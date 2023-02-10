'use strict';
import {
  logMessage,
  getAbsolutePath,
  isUndefined,
  isObject,
  isError,
} from './helpers.js';
import Caller from './utils/Caller.js';
import WebworkerPool from './utils/Webworker/WebworkerPool.js';
import WebworkerTask from './utils/Webworker/WebworkerTask.js';
import Websocket from './Websocket.js';

/**
 * @typedef JsonError
 * @type {object}
 * @prop {number} code
 * @prop {string} message
 */
/**
 * @typedef JsonResponse
 * @type {object}
 * @prop {string=} status
 * @prop {JsonError=} error
 */

export default class CodeDistributor {
  #wasmDir = '';
  /** @type {Websocket} */
  #ws = undefined;
  #fragmentList = undefined;
  /** @type {WebworkerPool} */
  #workerPool = undefined;
  #workerScriptURL = '';

  /**
   * Creates an instance of CodeDistributor.
   * @param {Object} options - The options to configure the CodeDistributor.
   * @param {string} [options.moduleDir] - The directory path to the CodeDistributor.
   * @param {string} options.wasmDir - The directory to your wasm files.
   * @param {string} [options.host] - Server host. IP/Domain + optional Port
   * @param {string} options.wsPath - The websocket path of the host.
   * @param {string} options.apiPath - The API path of the host.
   * @param {string} [options.maxReconnectAttempts] - Maximum amount trying to reconnect.
   * @memberof CodeDistributor
   */
  constructor(options) {
    [this.#wasmDir, this.#workerScriptURL] = this.#createPathURLs(
      options.wasmDir,
      options.moduleDir
    );

    const maxPoolSize = navigator.hardwareConcurrency || 1;
    this.#workerPool = new WebworkerPool(maxPoolSize);

    this.#ws = new Websocket({
      host: options.host,
      wsPath: options.wsPath,
      apiPath: options.apiPath,
      maxReconnectAttempts: options.maxReconnectAttempts,
    });
    this.#registerEventListeners();
  }

  destroy = () => {
    //   this.#ws.connection.close(1000, 'WebSocket closed normally.');
    if (!isUndefined(this.#workerPool)) {
      this.#workerPool.destroy();
    }
  };

  /**
   * Transforms the users parameters into an object.
   * If one parameter gets passed it should be an object.
   * If multiple parameters are present the parameters are appended at the end.
   *
   * @description
   * @param {any[]} args - List of arguments passed to callWasm function.
   * @returns {any} Transformed parameter object for the wasm function or undefined. The return object should look like this:
   * @example
   * {
   *    wasmId, // - The specified function ID from the CFD.yaml file.
   *    wasmFunc, // -  The function name to call.
   *    wasmParams, // - All function parameters.
   *    defer, // - specify this for independent long running tasks
   * }
   */
  #createOptions = (args) => {
    let options = undefined;

    // option 1: first parameter is an object consisting of required parameters
    if (args.length === 1) {
      if (!isObject(args.at(0))) {
        return new Error(
          "Argument is not type of object in function: 'callWasm'"
        );
      }
      options = args.at(0);
    } else if (args.length > 1) {
      // copy args and return deleted items starting from arr idx 1 in args
      const params = [...args].splice(2);
      options = {
        wasmId: args.at(0),
        wasmFunc: args.at(1),
        wasmParams: params.length === 0 ? undefined : params,
      };
    }
    return options;
  };

  /**
   * Execute a wasm function.
   * @param {Object} wasmData
   * @param {number} wasmData.wasmId - The specified function ID from the CFD.yaml file.
   * @param {string} wasmData.wasmFunc - The function name to call.
   * @param {any[]} wasmData.wasmParams - All function parameters.
   * @param {bool} wasmData.defer - true if function does not depend on previous response
   * @memberof CodeDistributor
   * @returns {Promise} The result, null or error message.
   * @example
   * await callWasm(0, "FuncName", 34,[3,4],"params")
   * await callWasm({
   *   wasmId: 0,
   *   wasmFunc: "FuncName",
   *   wasmParams: [34,[3,4],"params"],
   *   defer: false // true if function does not depend on previous response
   * })
   */
  callWasm = (wasmData) => {
    return new Promise((resolve, reject) => {
      const evtHandler = (evt) => {
        if (evt instanceof ErrorEvent) {
          reject(new Error(evt.message));
          return;
        } else if (evt instanceof Error) {
          reject(evt.message);
          return;
        } else if (typeof evt.data === 'undefined') {
          reject(
            new Error(`Couldn't execute WASM function: '${wasmData.wasmFunc}'`)
          );
          return;
        } else if (evt.data !== null && evt.data['error']) {
          reject(evt.data.error);
          return;
        }

        resolve(evt.data);
      };

      const task = new WebworkerTask(this.#workerScriptURL, evtHandler, {
        action: 'wasm',
        wasmDir: this.#wasmDir,
        wasmData,
      });

      this.#workerPool.addTask(task);
    });
  };

  #getFragmentFromList(nameOrId) {
    const getFragmentFromListById = (id) => {
      if (typeof id === 'string') return undefined;

      const result = this.#fragmentList.filter(
        (fragment) => Number(fragment.id) === id
      );
      return result.length === 1 ? result[0] : undefined;
    };
    const getFragmentFromListByName = (name) => {
      if (typeof id === 'number') return undefined;

      const result = this.#fragmentList.filter(
        (fragment) => fragment.name === name
      );
      return result.length === 1 ? result[0] : undefined;
    };

    let fragment = getFragmentFromListById(nameOrId);
    if (!isUndefined(fragment)) return [fragment, null];

    fragment = getFragmentFromListByName(nameOrId);
    if (!isUndefined(fragment)) return [fragment, null];
    else return [null, new Error(`Fragment '${nameOrId}' doesn't exist.`)];
  }

  call = async (...args) => {
    const options = this.#createOptions(args);
    if (isError(options)) throw new Error(options.message);

    // DEMO, to show where it's executed
    const clientIcon = document.querySelector('#client-icon');
    const serverIcon = document.querySelector('#server-icon');

    // execute everything on the client until we could establish a websocket connection
    if (isUndefined(this.#fragmentList)) {
      const result = await this.callWasm(options);
      console.log('from wasm: ' + result);
      clientIcon.classList.add('trigger');
      setTimeout(() => {
        clientIcon.classList.remove('trigger');
      }, 200);

      return result;
    }

    let fragment = undefined;
    /** @type {Error} */
    let err = undefined;

    if (options['wasmId'])
      [fragment, err] = this.#getFragmentFromList(options.wasmId);
    else if (options['wasmFunc'])
      [fragment, err] = this.#getFragmentFromList(options.wasmFunc);

    if (isUndefined(fragment)) {
      console.error(err.message);
      return undefined;
    }

    if (fragment.runOn === 'client') {
      let result = await this.callWasm(options);
      console.log('from wasm: ' + result);
      clientIcon.classList.add('trigger');
      setTimeout(() => {
        clientIcon.classList.remove('trigger');
      }, 200);

      return result;
    } else if (fragment.runOn === 'server') {
      // trigger the 'callFunction' event on the server
      this.#ws.emitServer('callFunction', {
        // id: options.wasmId,
        name: options.wasmFunc,
        params: options.wasmParams,
        defer: options.defer || false,
      });

      // IDEA: save all promises in a numerated list
      // resolve promise here and check which number returned
      // send timestamp alongside the data to identify the functionresult we need

      return new Promise((resolve, reject) => {
        this.#ws.once('functionResult', (data) => {
          console.log('from server: ' + data.result);

          /* NOTE
            We get undefined when:
            * 1. the function doesn't have any return values
            * 2. we expect to get a value or undefined to distinguish results
            Maybe use a special keyword to mark events where nothing is expected or don't even send any event from the server of results array is empty.
          */

          // if (isUndefined(data)) {
          // reject(undefined);
          // return;
          // }

          const id = setTimeout(() => {
            reject(new Error('function timeout'));
          }, 1000 * 10);

          if (data.funcName === options.wasmFunc) {
            serverIcon.classList.add('trigger');
            setTimeout(() => {
              serverIcon.classList.remove('trigger');
            }, 200);

            clearTimeout(id);
            resolve(data.result);
          } else if (data.funcName === '__executionError') {
            serverIcon.classList.add('trigger');
            setTimeout(() => {
              serverIcon.classList.remove('trigger');
            }, 200);

            reject(new Error(data.result));
          }
        });
      });
    }
  };

  /**
   * Registers functions which should trigger when a named event happens.
   *  ANCHOR EVENTS
   */
  #registerEventListeners = () => {
    // define what whould happen on "response" event, receive msg from server
    this.#ws.on('response', (data) => {
      // console.log(data);
    });

    // define what whould happen on "updateFragmentList" event
    this.#ws.on('updateFragmentList', (data) => {
      const connectionIcon = document.querySelector('#connection-icon');
      connectionIcon.classList.add('trigger');
      setTimeout(() => {
        connectionIcon.classList.remove('trigger');
      }, 200);

      this.#fragmentList = data;
      // TODO interrupt current still running promises in WASM
      // for each event which is transfereed on server side, call the cancel event
      // https://gist.github.com/pygy/6290f78b078e22418821b07d8d63f111
      // this.#ws.events;
    });
  };

  #createPathURLs = (wasmDir, moduleDir) => {
    // only available in Modules
    let dirURL = import.meta.url;
    let workerScriptURL,
      wasmDirectory = '';

    if (typeof dirURL !== 'string') {
      const caller = new Caller();
      wasmDirectory = getAbsolutePath(caller.folderURL, wasmDir);
      if (!isUndefined(moduleDir)) {
        workerScriptURL =
          getAbsolutePath(caller.folderURL, moduleDir) + `/worker.js`;
      } else {
        workerScriptURL =
          window.location.origin + `/${caller.relativeFolderPath}/worker.js`;
      }
    } else {
      dirURL = dirURL.substring(0, dirURL.lastIndexOf('/'));
      wasmDirectory = getAbsolutePath(dirURL, wasmDir);
      workerScriptURL = `${dirURL}/worker.js`;
    }

    return [wasmDirectory, workerScriptURL];
  };
}
