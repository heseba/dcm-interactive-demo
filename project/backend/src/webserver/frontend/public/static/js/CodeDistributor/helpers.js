/**
 * Waits for x milliseconds, a function can be passed.
 *
 * @param {Number} ms - Time in milliseconds.
 * @param {Function} [cb=null] - Callback function which should wait.
 * @returns Promise
 */
const wait = (ms, cb) => {
  cb = cb ?? null;
  return new Promise((resolve, reject) => {
    if (cb) setTimeout(() => resolve(cb), ms);
    setTimeout(() => resolve(), ms);
  });
};

/**
 * Logs a string with timestamp.
 *
 * @param {String} message - Message string
 */
const logMessage = function (message) {
  message = new Date().toLocaleTimeString() + ' ' + message;
  console.log(message);
};

/**
 * Combines the current URL directory path with a given relative path.
 *
 * @param {*} baseUrl - URL of the current directory path.
 * @param {*} relative - Relative path to a file from the current directory.
 * @return {String} - Generates a absolute URL path to a directory.
 * @example
 * const folderPath = getAbsolutePath(
 *   "http://127.0.0.1:5005/js/callerFolder",
      "./to/this/path",
    );
 */
const getAbsolutePath = function (baseUrl, relative) {
  let splitRelativeArray = relative.split('/');
  let absolutePath = baseUrl.split('/');
  // to get on the same level as the current folder
  absolutePath.pop();

  for (let i = 0; i < splitRelativeArray.length; i++) {
    if (splitRelativeArray[i] === '.') {
      continue;
    } else if (splitRelativeArray[i] === '..') {
      absolutePath.pop();
      continue;
    }

    absolutePath.push(splitRelativeArray[i]);
  }

  return absolutePath.join('/');
};

/**
 * Transforms a stringified byte array to a byte array.
 *
 * @param {*} str - stringified byte array
 * @return {Array<int>}
 */
function transformStrToByteArray(str) {
  str = str.replace('[', '');
  str = str.replace(']', '');
  return str.split(' ').map((char) => Number(char));
}

/**
 * Decodes a stringified base64 encoded byte array.
 *
 * @param {string} base64ByteStr - stringified base64 encoded byte array
 * @return {*} Decoded JavaScript value of the stringified byte array.
 * @example
 * try {
 *    let value = await decodeBase64ByteToStr("WzUzIDUbase64IDUxIDDU0XQ==")
 * } catch{
 *    console.error("Couldn't decode base64 byte string: ", err);
 * }
 */
const decodeBase64ByteToStr = (base64ByteStr) => {
  // https://stackoverflow.com/a/54037351/10192487
  const b64toBlob = (base64, type = 'application/octet-stream') =>
    fetch(`data:${type};base64,${base64}`).then((res) => res.blob());

  return new Promise((resolve, reject) => {
    b64toBlob(base64ByteStr)
      .then((blob) => blob.text())
      .then((byteText) => resolve(decodeStringByteArray(byteText)))
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Decodes a stringified version of a byte array.
 *
 * @param {string} byteDataAsString - stringified byte array
 * @return {*} Decoded JavaScript value of the stringified byte array.
 * @example
 * let value = decodeStringByteArray("[23 43 45]")
 */
const decodeStringByteArray = (byteDataAsString) => {
  // let a = Uint8Array.from(byteDataAsString, (x) => x.charCodeAt(0));
  // console.log(JSON.parse(new TextDecoder().decode(a)));
  let byteData = new Uint8Array(transformStrToByteArray(byteDataAsString));
  return JSON.parse(new TextDecoder().decode(byteData));
};

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj);
const isError = (err) => err instanceof Error;

// used in conjunction with JSON.stringify(elem, escapeCharacters)
// https://stackoverflow.com/a/54272211/10192487
// https://stackoverflow.com/questions/4253367/how-to-escape-a-json-string-containing-newline-characters-using-javascript
const escapeCharacters = (_, obj) => {
  if (isUndefined(obj)) {
    let { params } = obj;
    if (isUndefined(params)) {
      for (const [i, param] of params.entries()) {
        if (typeof param !== 'string') continue;
        params[i] = param
          .replace(/[\\]/g, '\\\\')
          .replace(/[\/]/g, '\\/')
          .replace(/[\b]/g, '\\b')
          .replace(/[\f]/g, '\\f')
          .replace(/[\n]/g, '\\n')
          .replace(/[\r]/g, '\\r')
          .replace(/[\t]/g, '\\t')
          .replace(/[\"]/g, '\\"')
          .replace(/\\'/g, "\\'")
          .replace(/\\0/g, '\\0');
      }

      return obj;
    }
  }
};

/**
 *  Strips the payload from the JWT token.
 *  Fails if the token is modified.
 * @param {string} token
 */
const decodeJWTPayload = (token) => {
  if (token.split('.')[1]) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    try {
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      return err;
    }
  }
  return {};
};

const stringToNumber = (str) => {
  const num = Number(str);

  if (isNaN(num)) {
    return str;
  } else {
    return num;
  }
};

export {
  wait,
  logMessage,
  getAbsolutePath,
  decodeBase64ByteToStr,
  decodeStringByteArray,
  escapeCharacters,
  isUndefined,
  isObject,
  isError,
  decodeJWTPayload,
  stringToNumber,
};
