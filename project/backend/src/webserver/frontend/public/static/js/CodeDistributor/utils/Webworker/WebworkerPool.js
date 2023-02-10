'use strict';

import Webworker from './index.js';
import WebworkerTask from './WebworkerTask.js';

export default class WebworkerPool {
  #maxPoolsize = navigator.hardwareConcurrency || 1;

  #poolSize = 0;
  /** @type {WebworkerTask[]} */
  #taskQueue = [];
  /** @type {Webworker[]} */
  #workerQueue = [];

  constructor(poolSize) {
    poolSize = this.#checkPoolsizeArg(poolSize);
    if (this.#isError(poolSize)) {
      console.error(poolSize);
      return undefined;
    }

    this.#poolSize = poolSize;

    // create the maximum amount of web workers for reuse
    for (var i = 0; i < this.#poolSize; i++) {
      this.#workerQueue.push(new Webworker(this));
    }
  }

  get taskQueue() {
    return this.#taskQueue;
  }
  get workerQueue() {
    return this.#workerQueue;
  }

  destroy = () => {
    this.#taskQueue = [];
    this.#workerQueue.forEach((webworker) => {
      if (!this.#isUndefined(webworker.worker)) webworker.worker.terminate();
    });
    this.#workerQueue = undefined;
  };

  /**
   * Adds a task to the queue. Web worker will work through the queue of tasks.
   *
   * @param {WebworkerTask} task
   * @memberof WebworkerPool
   */
  addTask = (task) => {
    task = this.#checkTaskArg(task);
    if (this.#isError(task)) {
      console.error(task.message);
      return undefined;
    }

    // if workers are available
    if (!this.#isUndefined(this.#workerQueue) && this.#workerQueue.length > 0) {
      // get the worker from the front of the queue
      /** @type {Webworker}  */
      const webWorker = this.#workerQueue.shift();
      webWorker.run(task);
      return;
    }

    // pool got manually destroyed, pointless to add new tasks
    if (!this.#isUndefined(this.#workerQueue)) {
      // no free workers currently available, add task to queue
      this.#taskQueue.push(task);
    }
  };

  clearTasks = () => {
    this.#taskQueue = [];
  };

  /**
   * Adds a task to the queue. Web worker will work through the queue of tasks.
   *
   * @param {WebworkerTask} task
   * @memberof WebworkerPool
   * @returns {Promise}
   */
  addTaskAsync = (task) => {
    return new Promise((resolve, reject) => {
      const promHandler = (evt) => {
        if (evt instanceof ErrorEvent) {
          reject(new Error(evt.message));
          return;
        } else if (evt instanceof Error) {
          reject(evt);
          return;
        } else if (evt.data['error']) {
          reject(evt.data.error);
          return;
        }

        resolve(evt);
      };
      task.callback = promHandler;

      this.addTask(task);
    });
  };

  #checkPoolsizeArg = (poolSize) => {
    if (this.#isUndefined(poolSize)) return this.#maxPoolsize;

    poolSize = this.#stringToNumber(poolSize);

    if (!(typeof poolSize === 'number')) {
      return new Error('Number expected in Webworkerpool constructor.');
    }

    if (poolSize > this.#maxPoolsize) {
      console.warn(
        `Client cannot handle more than ${
          this.#maxPoolsize
        } worker threads at a time.`
      );
      return this.#maxPoolsize;
    }

    return poolSize;
  };

  #checkTaskArg = (task) => {
    if (
      !(task instanceof WebworkerTask) &&
      (!task['script'] || !task['callback'] || !task['paramData'])
    ) {
      return new Error(
        "WebworkerPool function 'addTask' expects parameter of type WebworkerTask."
      );
    }

    return task;
  };

  #isUndefined = (variable) =>
    typeof variable === 'undefined' || variable === null;
  #stringToNumber = (str) => {
    const num = Number(str);

    if (isNaN(num)) {
      return str;
    } else {
      return num;
    }
  };
  #isError = (err) => err instanceof Error;
}
