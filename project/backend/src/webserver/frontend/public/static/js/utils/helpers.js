/**
 * Shortcut for querySelector
 *
 * @param {string} selector
 * @returns {HTMLElement} the HTMLElement
 */
const selectElement = (selector) => document.querySelector(selector);

/**
 * Shortcut for querySelectorAll
 *
 * @param {string} selector
 * @returns {Array<HTMLElement>} array of HTMLElements
 */
const selectElements = (selector) => document.querySelectorAll(selector);

/* waits for x miliseconds, a function can be passed */
const wait = (ms, cb) => {
  cb = cb || null;
  return new Promise((resolve, reject) => {
    if (cb) setTimeout(() => resolve(cb), ms);
    setTimeout(() => resolve(), ms);
  });
};

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

/**
 * @param {String} htmlString representing a single element
 * @return {Element}
 */
const convertHtmlStringToElement = (htmlString) => {
  var template = document.createElement('template');
  htmlString = htmlString.trim(); // Never return a text node of whitespace as the result

  template.innerHTML = htmlString;
  return template.content.firstChild;
};

const getLang = () => {
  if (navigator.languages != undefined) return navigator.languages[0];
  return navigator.language;
};

const euro = (value) =>
  currency(value, {
    precision: 2,
    separator: '.',
    decimal: ',',
    format: (c) => {
      return c.value.toLocaleString(getLang(), {
        style: 'currency',
        currency: 'EUR',
        currencyDisplay: 'symbol',
      });
    },
  });

const stringToNumber = (str) => {
  const num = Number(str);

  if (isNaN(num)) {
    return str;
  } else {
    return num;
  }
};

const isArray = (arr) => {
  return typeof arr === 'object' && Array.isArray(arr);
};

/**
 * Attaches multiple EventListener on elements.
 * @param {(HTMLElement|Array<HTMLElement>)} elements Element(s) to which the event(s) should be attached.
 * @param {String|Array<String>} eventNames Event(s) on which should be listened to, seperated by space or in array.
 * @param {Function} listener Callback - decide what should happen after attaching the events.
 * @param {Object} [options={capture:false}] EventListener options like capture, once or bubble. useCapture defaults to false.
 * @example addEventListenerMulti(item, "event1 event2", (e) => {e.stopPropagation(); e.preventDefault();}, {once: true})
 * @example addEventListenerMulti(item, ["event1", "event2"], (e) => {e.stopPropagation(); e.preventDefault();}, {once: true})
 */
const addEventListenerMulti = (
  elements,
  eventNames,
  listener,
  options = { capture: false }
) => {
  // one element with multiple events
  if (typeof elements === 'object' && typeof elements.length === 'undefined') {
    const events = isArray(eventNames) ? eventNames : eventNames.split(' ');
    for (let i = 0; i < events.length; i++) {
      elements.addEventListener(events[i], listener, options);
    }
  }
  // multiple elements with multiple events
  else if (
    typeof elements === 'object' &&
    typeof elements.length === 'number'
  ) {
    for (let i = 0; i < elements.length; i++) {
      const events = isArray(eventNames) ? eventNames : eventNames.split(' ');
      for (let j = 0; j < events.length; j++) {
        elements[i].addEventListener(events[j], listener, options);
      }
    }
  } else {
    throw new Error(`Wrong type of elements passed: '${typeof elements}'`);
  }
};

/**
 * Set the scroll top
 * @param {int} scrollTop The scrollTop
 */
const setScrollTop = (scrollTop) => {
  // Different browsers treat this differently, so set all
  window.document.body.scrollTop = scrollTop;
  window.document.documentElement.scrollTop = scrollTop;
};

export {
  selectElement,
  selectElements,
  wait,
  isUndefined,
  euro,
  stringToNumber,
  convertHtmlStringToElement,
  getLang,
  addEventListenerMulti,
  setScrollTop,
};
