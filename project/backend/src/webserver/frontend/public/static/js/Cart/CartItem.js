'use strict';

import Product from '../ProductCatalog/Product.js';
import { euro } from '../utils/helpers.js';

export default class CartItem extends Product {
  /**
   * Creates an instance of CartItem.
   * @param {Product} product
   * @memberof CartItem
   */
  constructor(product, quantity) {
    super(product);
    this.quantity = quantity ?? 1;
    this.totalValue = this.value * this.quantity;
    this.totalPrice = euro(this.totalValue).format()
  }
}
