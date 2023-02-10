'use strict';

export default class WebworkerTask {
  constructor(...args) {
    let options = this.#checkArgs(args);
    if (this.#isError(options)) {
      console.error(options);
      return undefined;
    }

    if (typeof options.script == 'function') {
      const workerString = options.script.toString();
      // strip away function definition "() => {}"
      options.script = workerString.substring(
        workerString.indexOf('{') + 1,
        workerString.lastIndexOf('}')
      );
    }

    /** @type {string} */
    this.script = options.script;
    this.callback = options.callback;
    this.paramData = options.paramData;
  }

  #checkArgs = (args) => {
    let options = undefined;

    // option 1: first parameter is an object consisting of required parameters
    if (args.length === 1) {
      if (!this.#isObject(args.at(0))) {
        return new Error(
          'Argument is not type of object in WebworkerTask constructor.'
        );
      }
      options = args.at(0);

      if (!options['script']) {
        return new Error(
          'Missing property "script" on object in WebworkerTask constructor.'
        );
      } else if (!options['callback']) {
        return new Error(
          'Missing property "callback" on object in WebworkerTask constructor.'
        );
      } else if (!options['paramData']) {
        return new Error(
          'Missing property "paramData" on object in WebworkerTask constructor.'
        );
      }
    }
    // option 2: 3 parameters
    else if (args.length > 1 && args.length <= 3) {
      options = {
        script: args.at(0),
        callback: args.at(1),
        paramData: args.at(2),
      };
    } else {
      return new Error(
        'Invalid amount of arguments in WebworkerTask constructor.'
      );
    }

    return options;
  };

  #isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj);
  #isError = (err) => err instanceof Error;
}
