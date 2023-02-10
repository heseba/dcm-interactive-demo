import CodeDistributor from './CodeDistributor/index.js';

const codeDistributor = new CodeDistributor({
  moduleDir: './CodeDistributor',
  wasmDir: './CodeDistributor/wasm',
  // host: '127.0.0.1:5005',
  wsPath: '/ws',
  apiPath: '/api/v1',
  maxReconnectAttempts: 3,
});

export { codeDistributor };
