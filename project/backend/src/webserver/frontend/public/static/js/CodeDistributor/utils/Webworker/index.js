'use strict';

import WebworkerPool from './WebworkerPool.js';
import WebworkerTask from './WebworkerTask.js';

export default class Webworker {
  /**  @type {WebworkerPool} */
  #webworkerPool = undefined;
  #task = {};
  /** @type {Worker} */
  worker = undefined;

  constructor(webworkerPool) {
    this.#webworkerPool = webworkerPool;
  }

  /**
   * @param {string} script
   */
  #createWorker = (script) => {
    const workerURL = script.startsWith('http')
      ? script
      : window.URL.createObjectURL(new Blob([script]));

    this.worker = new Worker(workerURL);

    return this.worker;
  };

  /**
   * Executes a task in the background.
   *
   * @param {WebworkerTask} task
   * @memberof Webworker
   */
  run = (task) => {
    this.#task = task;

    if (this.#task.script != null) {
      const worker = this.#createWorker(this.#task.script);

      worker.addEventListener('message', this.#messageEventHandler, false);
      worker.addEventListener('error', this.#errorEventHandler, false);
      worker.postMessage(task.paramData);
    }
  };

  #nextTask = () => {
    if (this.#webworkerPool.taskQueue.length > 0) {
      // don't put back in queue, but execute next task
      const task = this.#webworkerPool.taskQueue.shift();
      this.run(task);
      return;
    }

    if (!this.#isUndefined(this.#webworkerPool.workerQueue)) {
      // if there is nothing to do, make the worker available again
      this.#webworkerPool.workerQueue.push(this);
    }
  };

  // catch messages from postMessage method, it can only get one final message, preferably when the worker is done
  #messageEventHandler = (msgEvent) => {
    // worker is done, pass back results
    this.#task.callback(msgEvent);

    this.#nextTask();
  };

  // catch errors from worker
  #errorEventHandler = (errorEvent) => {
    // worker is done, pass back error
    this.#task.callback(errorEvent);

    this.#nextTask();
  };

  #isUndefined = (variable) =>
    typeof variable === 'undefined' || variable === null;
}
