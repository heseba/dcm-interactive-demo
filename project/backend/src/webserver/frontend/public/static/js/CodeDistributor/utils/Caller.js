/**
 * Creates an object with paths of the current executing file.
 *
 * @class Caller
 * @example
 * const caller = new Caller();
 * caller.name
 * new Caller().location
 */
class Caller {
  #name = undefined;
  #location = undefined;
  #fileURL = undefined;
  #folderURL = undefined;
  #relativeFolderPath = undefined;
  #isFirefox = undefined;

  constructor() {
    if (navigator.userAgentData) {
      this.#isFirefox = !(
        navigator.userAgentData &&
        navigator.userAgentData.brands &&
        navigator.userAgentData.brands.some(
          (b) => b.brand === 'Google Chrome' || b.brand === 'Microsoft Edge'
        )
      );
    } else {
      this.#isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
    }

    // we need this to check if we are in a subfolder or on the same level as the calling function
    const regex = new RegExp(Object.getPrototypeOf(this).constructor.name);

    let callStack = new Error().stack.split('\n');
    // remove first "Error" line in array
    callStack.shift();

    // test if helper function was imported somewhere from a subfolder
    let callerString = regex.test(callStack[0]) ? callStack[1] : callStack[0];
    let callerStringArray = callerString.trim().split(' ');
    // pass copy of array with Array.from or [...array], don't modify original
    this.#name = this.#setName(Array.from(callerStringArray));
    this.#location = this.#setLocation(Array.from(callerStringArray));
    this.#fileURL = this.#setFileURL(this.#location);
    this.#folderURL = this.#setFolderURL(this.#fileURL);
    this.#relativeFolderPath = this.#setRelativeFolderPath(this.#fileURL);

    return this;
  }

  // make private variables public
  get name() {
    return this.#name;
  }
  get location() {
    return this.#location;
  }
  get fileURL() {
    return this.#fileURL;
  }
  get folderURL() {
    return this.#folderURL;
  }
  get relativeFolderPath() {
    return this.#relativeFolderPath;
  }

  #setName = (callerStringArray) => {
    if (this.#isFirefox) {
      return 'new ' + callerStringArray[0].split('@')[0] + '()';
    }
    callerStringArray.shift();
    callerStringArray.pop();
    return callerStringArray.join(' ') + '()';
  };

  #setLocation = (callerStringArray) => {
    let callerString = callerStringArray[callerStringArray.length - 1];
    if (this.#isFirefox) {
      return callerString.split('@')[1];
    }

    callerString = callerString.split('');
    callerString.shift();
    callerString.pop();
    return callerString.join('');
  };

  #setFileURL = (callerString) => {
    const callerStringArray = callerString.split(':');
    // const [line, column] = [
    //   callerStringArray[callerStringArray - 2],
    //   callerStringArray[callerStringArray - 1],
    // ];

    callerStringArray.pop();
    callerStringArray.pop();

    return callerStringArray.join(':');
  };

  #setFolderURL = (callerString) => {
    return callerString.substring(0, callerString.lastIndexOf('/'));
  };

  #setRelativeFolderPath = (callerString) => {
    callerString = callerString.replace(window.location.href, '').split('/');
    callerString.pop();
    return callerString.join('/');
  };
}

export default Caller;
