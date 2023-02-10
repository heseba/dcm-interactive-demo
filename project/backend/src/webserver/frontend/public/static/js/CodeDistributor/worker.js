const logMessage = function (message) {
  message = new Date().toLocaleTimeString() + ' ' + message;
  console.log(message);
};

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

// JS Glue Code, this will be generated automatically when using the wasm-builder
self.importScripts('./wasm_exec.js');
// helper code to instantiate wasm modules
self.importScripts('./instantiateWasm.js');

// Defined in wasm_exec.js. Don't forget to add this in your index.html.
const go = new Go();

const callWasm = async (wasmDir, funcId, funcName, ...funcParams) => {
  // Get the importObject from the go instance.
  const importObject = go.importObject;

  // support multiple parameter instead of using arrays only
  funcParams.length > 1 ? [...funcParams] : (funcParams = funcParams[0]);

  // prepare single argument vs array of arguments
  if (!isUndefined(funcParams)) {
    funcParams = [
      ...[],
      ...(Array.isArray(funcParams) ? funcParams : [funcParams]),
    ];
  }

  const wasmPath = `${wasmDir}/${funcId}_${funcName}.wasm`;

  try {
    const wasmModule = await instantiateWasm(wasmPath, importObject);
    go.run(wasmModule.instance);

    let result = undefined;
    if (!isUndefined(funcParams)) {
      result = this['codedistributor'][funcName](...funcParams);
    } else {
      result = this['codedistributor'][funcName]();
    }

    return result;
  } catch (error) {
    console.error(`WASM Function '${funcName}' couldn't be executed: ${error}`);
    return undefined;
  }
};

const messageEventHandler = async (msgEvent) => {
  const data = msgEvent.data;

  if (data.action == 'wasm') {
    const wasmDir = data.wasmDir;
    const { wasmId, wasmFunc, wasmParams } = data.wasmData;

    try {
      let result = await callWasm(wasmDir, wasmId, wasmFunc, wasmParams);
      // now send it back to main thread
      self.postMessage(result);
    } catch (error) {
      throw error;
    } finally {
      // UX don't wait for it, do the clean up after 2s
      setTimeout(() => {
        self.close();
      }, 2000);
    }
  }
};

// initialize EventListeners
self.addEventListener('message', messageEventHandler, false);

// self.onmessage = function (event) {};
