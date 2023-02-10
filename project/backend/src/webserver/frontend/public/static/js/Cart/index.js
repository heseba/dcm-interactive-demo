'use strict';

import { euro } from '../utils/helpers.js';
import CartItem from './CartItem.js';
import Controller from '../Controller.js';

export default class Cart {
  /**
   * Creates an instance of Cart.
   * @param {Controller} controller
   * @memberof Cart
   */
  constructor(controller) {
    /** @type {CartItem[]} */
    this.products = [];
    this.controller = controller;
  }

  get isEmpty() {
    return this.products.length === 0;
  }

  /**
   * Returns the product from the cart if it exists.
   *
   * @param {string} id
   * @returns {CartItem|undefined}
   */
  getProductById = (id) => {
    if (this.isEmpty) return undefined;

    for (const item of this.products) {
      if (item.id === id) {
        return item;
      }
    }
    return undefined;
  };

  /**
   * Returns the product from the cart if it exists.
   *
   * @param {string} name
   * @returns {CartItem|undefined}
   */
  getProductByName = (name) => {
    if (this.isEmpty) return undefined;

    for (const item of this.products) {
      if (item.name === name) {
        return item;
      }
    }
    return undefined;
  };

  /**
   * Checks if item is in cart.
   *
   * @param {string} id
   * @returns {boolean}
   */
  isProductInCart = (id) => {
    if (this.isEmpty) return false;

    for (const item of this.products) {
      if (item.id === id) {
        return true;
      }
    }

    return false;
  };

  /**
   * Adds the item to the shopping cart.
   *
   * @param {CartItem} product
   */
  add = (product) => {
    this.products.push(product);
  };

  /**
   * Removes the product from the shopping cart.
   *
   * @param {CartItem} product
   */
  remove = (product) => {
    for (const [i, item] of this.products.entries()) {
      if (product.id === item.id) {
        this.products.splice(i, 1);
      }
    }
  };

  /**
   * Updates a product with the newly provided values.
   *
   * @param {CartItem} product
   * @param {CartItem} values
   * @memberof Cart
   */
  update = (product, values) => {
    // this only works since we are providing a reference to the exact object coming from the controller
    for (const [prop, value] of Object.entries(values)) {
      product[prop] = value;
    }

    // recalculate total prices
    let formattedValue = undefined;
    for (const item of this.products) {
      formattedValue = euro(item.value * item.quantity);
      item.totalValue = formattedValue.value;
      item.totalPrice = formattedValue.format();
    }
  };

  clear = (evt) => {
    this.products = [];
  };
}
