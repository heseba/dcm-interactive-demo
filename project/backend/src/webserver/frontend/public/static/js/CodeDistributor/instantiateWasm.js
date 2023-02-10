/**
 * Creates an instance of the provided wasm module.
 *
 * @param {string} wasmModuleUrl - Path to .wasm file.
 * @param {object} importObject - Import object inside the wasm sandbox.
 * @return {*} WASM instance
 */
const instantiateWasm = async (wasmModuleUrl, importObject) => {
  importObject = importObject ?? {
    env: {
      abort: () => console.log('Abort!'),
    },
  };

  // Check if the browser supports streaming instantiation
  // Fallback to using fetch to download the entire module
  // 'instantiateStreaming' in WebAssembly;
  if (!WebAssembly.instantiateStreaming) {
    const fetchAndInstantiate = async () => {
      const wasmArrayBuffer = await fetch(wasmModuleUrl).then((response) =>
        response.arrayBuffer(),
      );
      return WebAssembly.instantiate(wasmArrayBuffer, importObject);
    };

    const instance = await fetchAndInstantiate();
    return instance;
  }

  // Fetch the module, and instantiate it as it is downloading
  const instance = await WebAssembly.instantiateStreaming(
    fetch(wasmModuleUrl),
    importObject,
  );

  return instance;
};