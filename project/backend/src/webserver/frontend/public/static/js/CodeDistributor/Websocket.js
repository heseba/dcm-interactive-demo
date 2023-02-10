import { logMessage } from './helpers.js';
import EventEmitter from './utils/EventEmitter.js';
import { selectElement, isUndefined } from '../utils/helpers.js';

export default class Websocket extends EventEmitter {
  /** @type {WebSocket} */
  #ws = undefined;
  #apiPath = '';
  #wsRoute = '';
  #accessToken = '';

  // reconnect measures
  #reconnectTimer = 5; //5min
  #maxReconnectAttempts = 3;
  #reconnectAttempts = 0;
  #reconnectTimerMs = this.#reconnectTimer * 1000;

  #globalReconnectTimer = this.#reconnectTimer * this.#maxReconnectAttempts;
  #globalReconnectIntervalTimer = undefined;

  #reconnectCounterElement = selectElement('#connection-icon');

  /**
   * Creates an instance of CodeDistributor.
   * @param {Object} options - The options to configure the CodeDistributor.
   * @param {string} [options.host] - Server host. IP/Domain + optional Port
   * @param {string} options.wsPath - The websocket path of the host.
   * @param {string} options.apiPath - The API path of the host.
   * @param {string} [options.maxReconnectAttempts] - Maximum amount trying to reconnect.
   */
  constructor(options) {
    super();

    this.#apiPath = options.apiPath;

    if (!isUndefined(options.maxReconnectAttempts))
      this.#maxReconnectAttempts = options.maxReconnectAttempts;

    this.#wsRoute =
      options.host || false
        ? 'ws://' + options.host + options.wsPath
        : window.location.origin.replace(
            window.location.protocol + '//',
            'ws://'
          ) + options.wsPath;

    this.#establishConnection();
  }

  get connection() {
    return this.#ws;
  }

  #establishConnection = async () => {
    try {
      let authResult = await this.#authenticate();
      // init websocket connection
      // const wsProtocol = 'codedistributor';
      this.#ws = new WebSocket(this.#wsRoute + `?cdat=${this.#accessToken}`);

      // register EventListeners for the WebSocket
      this.#ws.onopen = this.#onWsOpen;
      this.#ws.onmessage = this.#onWsMessage;
      this.#ws.onclose = this.#onWsClose;
      this.#ws.onerror = this.#onWsError;
    } catch (err) {
      throw err;
    }
  };

  /**
   *
   * @returns {Promise}
   * @memberof Websocket
   */
  #authenticate = () => {
    return new Promise(async (resolve, reject) => {
      try {
        /** @type {JsonResponse} */
        const authResult = await this.#getAccessToken();

        resolve(authResult);
      } catch (err) {
        if (this.#reconnectAttempts === this.#maxReconnectAttempts) {
          clearInterval(this.#globalReconnectIntervalTimer);
          this.#globalReconnectTimer =
            this.#reconnectTimer * this.#maxReconnectAttempts;
          this.#reconnectCounterElement.setAttribute('style', `--content:'⚡'`);

          reject(new Error(err.error.message));
          return;
        }

        // don't start interval again if it's running
        if (
          this.#globalReconnectTimer ===
          this.#reconnectTimer * this.#maxReconnectAttempts
        ) {
          this.#globalReconnectIntervalTimer = setInterval(() => {
            this.#reconnectCounterElement.setAttribute(
              'style',
              `--content:'${--this.#globalReconnectTimer}'`
            );
          }, 1000);
        }

        this.#reconnectAttempts++;
        console.error(
          `Failed connecting to websocket server. Attempting to reconnect: ${
            this.#reconnectAttempts
          }/${this.#maxReconnectAttempts}.`
        );

        setTimeout(() => {
          this.#establishConnection();
        }, this.#reconnectTimerMs);
      }
    });
  };

  #getAccessToken = () => {
    const authRoute = window.location.origin + this.#apiPath + '/auth';

    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(authRoute, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.status === 405) {
          reject({ error: { code: res.status, message: res.statusText } });
          return;
        }

        if (res.headers.has('Authorization')) {
          // access token
          this.#accessToken = res.headers.get('Authorization');
        }

        const jsonData = await res.json();

        resolve(jsonData);
      } catch (err) {
        this.#accessToken = '';
        // stumbled upon a non json response, probably wrong server route
        if (err.message === 'Unexpected token < in JSON at position 0') {
          reject({
            error: {
              code: 400,
              message: 'Could not authorize: not a valid route',
            },
          });
          return;
        }
        reject({
          error: {
            code: 400,
            message: 'Could not authorize: ' + err.message,
          },
        });
      }
    });
  };

  /*
  # =================================================================
  # WebSocket EventHandler
  # =================================================================
  */

  // when the websocket connection opens
  #onWsOpen = (evt) => {
    evt = evt || window.event;
    const target = evt.target || evt.srcElement;
    // target.readystate === 1;

    const websocketStatus = selectElement('#websocketStatus');
    !isUndefined(websocketStatus)
      ? (websocketStatus.dataset.status = 'online')
      : null;

    clearInterval(this.#globalReconnectIntervalTimer);
    this.#globalReconnectTimer =
      this.#reconnectTimer * this.#maxReconnectAttempts;
    this.#reconnectCounterElement.setAttribute('style', "--content:''");

    if (this.#reconnectAttempts > 0) {
      logMessage('>>>> WebSocket Connection reconnected');
      this.#reconnectAttempts = 0;
    } else {
      logMessage('>>>> WebSocket Connection established');
    }

    // ANCHOR TRIGGER SERVER EVENTS
    // trigger the 'message' event on the server with the message
    // this.emitServer('message', 'Msg from Client sent');

    // trigger the 'updateFragmentList' event on the server to initially get the current status
    this.emitServer('updateFragmentList');
  };

  // when the websocket connection receives data from the server
  #onWsMessage = (evt) => {
    try {
      let jsonData = JSON.parse(evt.data);
      if (jsonData) {
        this.trigger(jsonData.event, jsonData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // when the websocket connection closes
  #onWsClose = (evt) => {
    const websocketStatus = selectElement('#websocketStatus');
    !isUndefined(websocketStatus)
      ? (websocketStatus.dataset.status = 'offline')
      : void 0;

    logMessage('>>>> WebSocket Connection closed');
    this.#establishConnection();
    // console.info(evt);
  };

  // when the websocket connection runs into an error
  // Errors also cause WebSocket connections to close.
  #onWsError = (evt) => {
    clearInterval(this.#globalReconnectIntervalTimer);
    this.#globalReconnectTimer =
      this.#reconnectTimer * this.#maxReconnectAttempts;
    this.#reconnectCounterElement.setAttribute('style', `--content:'⚡'`);

    console.error('Error: WebSocket connection closed unexpected.');
    // console.error('WebSocket Error: ', evt);
  };

  /**
   * Trigger an event on the server and send data through the websocket.
   *
   * @param {string} eventName - Event name to trigger.
   * @param {*} data - The data to transfer.
   */
  emitServer = (eventName, data) => {
    if (eventName === 'callFunction' && !isUndefined(data)) {
      // always convert params to array, because server is dealing with arrays
      if (!Array.isArray(data.params)) {
        data.params = [data.params];
      }
      data = JSON.stringify(data);
    }

    let event = { event: eventName, data };
    let rawData = JSON.stringify(event);
    this.#ws.send(rawData);
  };
}
