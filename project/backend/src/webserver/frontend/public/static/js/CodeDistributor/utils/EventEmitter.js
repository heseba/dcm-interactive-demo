export default class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Register a new event with the corresponding callback function.
   *
   * @param {string} eventName
   * @param {*} cb - Function to call when the event is triggered.
   */
  on(eventName, cb) {
    if (typeof this.events[eventName] !== 'object') {
      this.events[eventName] = [];
    }
    this.events[eventName].push(cb);
    return () => this.removeListener(eventName, cb);
  }
  removeListener(eventName, cb) {
    if (typeof this.events[eventName] === 'object') {
      const idx = this.events[eventName].indexOf(cb);
      if (idx > -1) {
        this.events[eventName].splice(idx, 1);
      }
    }
  }
  removeAllListeners() {
    Object.keys(this.events).forEach((eventName) =>
      this.events[eventName].splice(0, this.events[eventName].length)
    );
  }

  /**
   * Trigger all callbacks which are registered for the eventName.
   *
   * @param {string} eventName
   * @param {*} args
   */
  trigger(eventName, ...args) {
    if (typeof this.events[eventName] === 'object') {
      this.events[eventName].forEach((cb) => cb.apply(this, args));
    }
  }
  once(eventName, cb) {
    const remove = this.on(eventName, (...args) => {
      remove();
      cb.apply(this, args);
    });
  }
}
