'use strict';

import { selectElements } from '../utils/helpers.js';
import Product from './Product.js';

/**
 * Creates a structure of all products from the product cards on the page
 *
 * @class ProductCatalog
 */
export default class ProductCatalog {
  constructor() {
    this.products = [];

    let productCards = selectElements('.product');

    Array.from(productCards).forEach((productCard) => {
      this.products.push(new Product(productCard));
    });
  }

  get isEmpty() {
    return this.products.length === 0;
  }

  getProductByName = (name) => {
    if (this.isEmpty) {
      return undefined;
    }

    for (const product of this.products) {
      if (name === product.name) return product;
    }

    return undefined;
  };

  getProductById = (id) => {
    if (this.isEmpty) {
      return undefined;
    }

    for (const product of this.products) {
      if (id === product.id) return product;
    }

    return undefined;
  };

  /**
   * Checks if item on the page.
   *
   * @param {string} id
   * @memberof ProductCatalog
   */
  doesProductExists = (id) => {
    if (this.isEmpty) return false;

    for (const item of this.products) {
      if (item.id === id) {
        return true;
      }
    }

    return false;
  };
}
