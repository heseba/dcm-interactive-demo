'use strict';

import {
  selectElement,
  selectElements,
  convertHtmlStringToElement,
  stringToNumber,
} from '../utils/helpers.js';
import { createTableRowHTMLTemplate } from '../utils/tableRowTemplate.js';
import { codeDistributor } from '../initCodeDistributor.js';
import Table from './index.js';
import Controller from '../Controller.js';
import Filter from './TableFilter.js';
import Modal from '../Modal.js';

export default class CartTable extends Table {
  /**
   * Creates an instance of CartTable.
   * @param {Object} tableOptions
   * @param {Controller} controller
   * @memberof CartTable
   */
  constructor(tableOptions, controller) {
    super(tableOptions);
    this.controller = controller;

    // ignored if empty
    const tableQuantityEntries = selectElements('.quantity-wrapper');
    [...tableQuantityEntries].forEach((quantityEntry) => {
      this.setupQuantityButtons(quantityEntry);
    });

    const modal = selectElement('#mobileSortModal');
    const modalToggle = selectElement('#mobileSortBtn');
    new Modal(modal, modalToggle);

    this.filter = new Filter(this);
  }

  /**
   * Updates the table data for a product.
   *
   * @param {CartItem} product
   */
  updateProduct = (product) => {
    const tableRow = selectElement(`[data-tableid="${product.id}"]`);
    // Produktname
    tableRow.children[0].textContent = product.name;
    tableRow.children[0].dataset.value = product.name;
    // Quantität
    /** @type {HTMLInputElement} */
    const quantityWrapper =
      tableRow.children[1].querySelector(`.quantity-wrapper`);
    const input = quantityWrapper.querySelector(`#quantity-${product.id}`);
    input.value = product.quantity;
    // Stückpreis
    tableRow.children[2].textContent = product.price;
    tableRow.children[2].dataset.value = product.value;
    // Mengenpreis
    tableRow.children[3].textContent = product.totalPrice;
    tableRow.children[3].dataset.value = product.totalValue;

    // decrease button
    if (product.quantity > 1) {
      let delBtn = quantityWrapper.children[0];
      delBtn.querySelector('.icon__delete-text').removeAttribute('hidden');
      delBtn.querySelector('.icon__delete-trash').setAttribute('hidden', true);
    } else if (product.quantity === 1) {
      this.showTrashIcon(quantityWrapper.children[0]);
    } else if (product.quantity === 0) {
      this.controller.remove(product);
      return;
    }

    // reset the sorting filter if something changed in the table
    this.filter.deactivate();
  };

  /**
   * Creates a new table row element and appends it to the table body if shouldAppend is not defined or true;
   *
   * @param {Object} product - The Product to create the row of.
   * @param {Boolean} [shouldAppend=true] - Wheter it should append it to the table body immediately or not.
   */
  createTableRow = (product, options) => {
    options = options ?? {};
    const shouldAppend = options.shouldAppend ?? true;

    const newProductRow = createTableRowHTMLTemplate(product, {
      withQuantityButtons: true,
    });

    const newProductRowElement = convertHtmlStringToElement(newProductRow);
    this.setupQuantityButtons(newProductRowElement);

    if (shouldAppend) {
      this.tableBody.appendChild(newProductRowElement);
    } else {
      return newProductRowElement;
    }
  };

  // on change if the user leaves the input field
  handleInput = (evt) => {
    const input = evt.target;
    const productId = input.id.split('-').splice(1).join('-');

    const quantity = stringToNumber(input.value);
    if (!(quantity > 0) || !Number.isInteger(quantity)) {
      this.controller.updateProduct(productId, { quantity: 1 });
      return;
    }

    this.controller.updateProduct(productId, { quantity });
  };

  getProducts = () => {
    return this.controller.cart.products;
  };

  // needs to be in a seperate function because of initial load and when a new table row is created
  setupQuantityButtons = (newProductRowElement) => {
    const quantityColumn =
      newProductRowElement.querySelector('.quantity-wrapper');
    const decreaseBtn = quantityColumn.children[0];
    const input = quantityColumn.children[1];
    const increaseBtn = quantityColumn.children[2];

    // fired when someone entered a new value and left the input box
    input.addEventListener('change', this.handleInput);
    increaseBtn.addEventListener('click', (evt) =>
      this.increaseQuantity(evt, input)
    );
    decreaseBtn.addEventListener('click', (evt) =>
      this.decreaseQuantity(evt, input)
    );
  };

  increaseQuantity = async (evt, input) => {
    const productId = input.id.split('-').splice(1).join('-');

    let quantity = stringToNumber(input.value);
    quantity = await codeDistributor.call(8, 'IncrementNumber', quantity);

    // Fallback error handling
    if (typeof quantity === 'undefined')
      quantity = stringToNumber(input.value) + 1;

    this.controller.updateProduct(productId, { quantity });
  };

  decreaseQuantity = async (evt, input) => {
    const productId = input.id.split('-').splice(1).join('-');

    let quantity = stringToNumber(input.value);
    quantity = await codeDistributor.call(9, 'DecrementNumber', quantity);

    // Fallback error handling
    if (typeof quantity === 'undefined')
      quantity = stringToNumber(input.value) - 1;

    this.controller.updateProduct(productId, { quantity });
  };

  showTrashIcon = (input) => {
    input.querySelector('.icon__delete-trash').removeAttribute('hidden');
    input.querySelector('.icon__delete-text').setAttribute('hidden', true);
  };
  showMinusIcon = (input) => {
    input.querySelector('.icon__delete-text').removeAttribute('hidden');
    input.querySelector('.icon__delete-trash').setAttribute('hidden', true);
  };
}
