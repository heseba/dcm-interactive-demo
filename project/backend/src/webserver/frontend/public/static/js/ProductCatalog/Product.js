'use strict';

import { euro } from '../utils/helpers.js';

export default class Product {
  /**
   * Creates an instance of Product.
   * @param {Object|HTMLDivElement|Product} product
   * @param {string} product.id
   * @param {string} product.name
   * @param {float} product.value
   * @param {string} product.price
   * @param {HTMLDivElement} product.htmlElement
   * @memberof Product
   */
  constructor(product) {
    if (
      product instanceof HTMLDivElement &&
      product.classList.contains('product')
    ) {
      const name = product.querySelector('.product__title').textContent;
      const price = product.querySelector('.product__price').textContent;

      const formattedPrice = euro(price);

      this.id = product.dataset.shopid;
      this.name = name;
      this.value = formattedPrice.value;
      this.price = formattedPrice.format();
      this.htmlElement = product;
    } else {
      // generic object || instanceof Product
      this.id = product.id;
      this.name = product.name;
      this.value = product.value;
      this.price = product.price;
      this.htmlElement = product.htmlElement;
    }
  }
}
