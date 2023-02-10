'use strict';

import Cart from './Cart/index.js';
import CartItem from './Cart/CartItem.js';
import CartTable from './Table/CartTable.js';
import MultistepForm from './MultistepForm.js';
import ProductCatalog from './ProductCatalog/index.js';
import { codeDistributor } from './initCodeDistributor.js';

import {
  isUndefined,
  selectElement,
  selectElements,
  addEventListenerMulti,
} from './utils/helpers.js';

export default class Controller {
  /**
   * Creates an instance of Controller.
   * @param {ProductCatalog} productCatalog
   * @param {MultistepForm} multistepForm
   * @memberof Controller
   */
  constructor(productCatalog, multistepForm) {
    this.productCatalog = productCatalog;
    this.multistepForm = multistepForm;

    this.cart = new Cart(this);
    this.table = new CartTable(
      {
        table: selectElement('table#warenkorb'),
        tableWrapper: selectElement('.stage-1 .table-wrapper'),
      },
      this
    );

    this.initBuyButtons();
    const mobileClearBtn = selectElement('#mobileTableClearBtn');
    const clearBtn = selectElement('#tableClearBtn');

    addEventListenerMulti([mobileClearBtn, clearBtn], 'click', this.clear);

    // if localStorage gets deleted
    window.addEventListener('storage', (evt) => {
      if (evt.key === null) {
        if (!store.has('cart')) {
          this.clear();
        }
      } else if (evt.key === 'cart' && evt.newValue === null) {
        this.clear();
      }
    });

    this.loadProducts();
  }

  initBuyButtons = () => {
    const productCards = selectElements('.product');

    Array.from(productCards).forEach((productCard) => {
      const buyBtn = productCard.querySelector('button');

      buyBtn.addEventListener('click', async (evt) => {
        if (
          evt.target.disabled ||
          evt.target.getAttribute('aria-disabled') === 'true'
        ) {
          return;
        }

        const productCardElement = evt.target.parentElement.parentElement;

        await this.add(new CartItem(productCardElement));

        // replayConfirmAnimation
        const cardContentElement =
          productCardElement.querySelector('.product__content');
        cardContentElement.classList.remove('confirm');
        cardContentElement.offsetWidth;
        cardContentElement.classList.add('confirm');
      });
    });
  };

  loadProducts = () => {
    if (store.has('cart')) {
      if (this.isCorruptedLocalStorage()) {
        this.clear();
        return;
      }

      this.cart.products = store.get('cart');
      this.table.renderProducts(this.cart.products);
      this.multistepForm.showForm();
      this.table.showTable();
    }
  };

  add = async (product) => {
    // trying to add an unknown product
    if (!this.productCatalog.doesProductExists(product.id)) {
      console.error('Failed to add product: ', product.name);
      return;
    }

    let cartItem = this.cart.getProductById(product.id);
    if (!isUndefined(cartItem)) {
      let quantity = await codeDistributor.call(
        8,
        'IncrementNumber',
        cartItem.quantity
      );

      // Fallback error handling
      if (typeof quantity === 'undefined') quantity = cartItem.quantity + 1;

      this.cart.update(cartItem, { quantity });
      this.table.updateProduct(cartItem);
    } else {
      // new item, don't call wasm to increment the quantity
      this.cart.add(product);
      this.table.addProduct(product);
    }

    store.set('cart', this.cart.products);

    if (!this.isEmpty) {
      this.multistepForm.showForm();
      this.table.showTable();
    }
  };

  /**
   * Removes a product.
   *
   * @param {CartItem|string} product
   */
  remove = (product) => {
    if (this.cart.isEmpty) {
      return;
    }

    // if (typeof product === 'string') {
    //   product = this.cart.getProductById(product);
    //   if (!isUndefined(product)) {
    //     console.error('Failed to remove product from Cart: ', product);
    //     return;
    //   }
    // }

    for (const [i, item] of this.cart.products.entries()) {
      if (item.id === product.id) {
        this.cart.remove(product);
        this.table.removeProduct(product);

        store.set('cart', this.cart.products);
        break;
      }
    }

    if (this.cart.isEmpty) {
      this.clear();
    }
  };

  updateProduct = (productId, props) => {
    props = props ?? {};

    const product = this.cart.getProductById(productId);

    if (props['quantity'] && props['quantity'] === 0) {
      this.cart.remove(product);
      this.table.removeProduct(product);
    } else {
      this.cart.update(product, props);
      this.table.updateProduct(product, props);
    }

    if (this.cart.isEmpty) {
      this.clear();
    } else {
      store.set('cart', this.cart.products);
    }
  };

  updateAllProducts = (products) => {
    this.cart.products = products;
    this.table.renderProducts(products);
    store.set('cart', products);
  };

  clear = () => {
    this.cart.clear();
    store.remove('cart');

    this.table.reset();
    this.multistepForm.hideForm();
  };

  isCorruptedLocalStorage = () => {
    /** @type {any[]} */
    let products = store.get('cart');
    const isCorruptedLocalStorage = products.every(
      (product) => product === null || product === {}
    );

    return isCorruptedLocalStorage;
  };
}
