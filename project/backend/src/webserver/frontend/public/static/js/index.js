'use strict';

//#region vendors global imports (everywhere available)
// https://currency.js.org/
import './vendor/currency/currency.js';
// https://github.com/nbubna/store#readme
import './vendor/store2/store2.min.js';
//#endregion

import { selectElement, selectElements } from './utils/helpers.js';
import ProductCatalog from './ProductCatalog/index.js';
import MultistepForm from './MultistepForm.js';

async function main() {
  const productCatalog = new ProductCatalog();
  new MultistepForm(productCatalog);
}

function contentLoadedHandler(e) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler, false);
  selectElement('body').classList.remove('preload');
  if (!window.Worker || !window.localStorage) {
    selectElement('body').innerHTML = `
  <p>Your browser requires WebWorker and LocalStorage functionalities in order to work.
  `;
    return;
  }

  main.call(this);
}

window.addEventListener('DOMContentLoaded', contentLoadedHandler, false);
