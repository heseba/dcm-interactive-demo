import { selectElement, convertHtmlStringToElement } from '../utils/helpers.js';

import { createTableRowHTMLTemplate } from '../utils/tableRowTemplate.js';
import CartItem from '../Cart/CartItem.js';

export default class Table {
  /**
   * Creates an instance of Table.
   * @param {Object} tableOptions
   */
  constructor(tableOptions) {
    tableOptions = tableOptions ?? {};

    this.tableWrapper = tableOptions.tableWrapper; // toggle visibility
    this.table = tableOptions.table;

    this.tableBody =
      this.table.querySelector('tbody') ??
      this.table.appendChild(convertHtmlStringToElement('<tbody></tbody>'));

    this.tableFooter =
      this.table.querySelector('tfoot') ??
      this.tableBody.insertAdjacentElement(
        'afterend',
        convertHtmlStringToElement('<tfoot></tfoot>')
      );
  }

  /**
   * Adds a product the the table or increases the quantity.
   *
   * @param {CartItem} product
   */
  addProduct = (product) => {
    this.createTableRow(product);
  };

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
    tableRow.children[1].textContent = product.quantity;

    // Stückpreis
    tableRow.children[2].textContent = product.price;
    tableRow.children[2].dataset.value = product.value;
    // Mengenpreis
    tableRow.children[3].textContent = product.totalPrice;
    tableRow.children[3].dataset.value = product.totalValue;

    // reset the sorting filter if something changed in the table
    this.filter.deactivate();
  };

  /**
   * Removes a product from the table.
   *
   * @param {CartItem} product
   */
  removeProduct = (product) => {
    selectElement(`[data-tableid="${product.id}"]`).remove();
  };

  /**
   * Creates a new table row element and appends it to the table body if shouldAppend is not defined or true;
   *
   * @param {Object} product - The Product to create the row of.
   * @param {Boolean} [shouldAppend=true] - Whether it should append it to the table body immediately or not.
   */
  createTableRow = (product, options) => {
    options = options ?? {};
    const shouldAppend = options.shouldAppend ?? true;

    const newProductRow = createTableRowHTMLTemplate(product);

    const newProductRowElement = convertHtmlStringToElement(newProductRow);

    if (shouldAppend) {
      this.tableBody.appendChild(newProductRowElement);
    } else {
      return newProductRowElement;
    }
  };

  removeAllTableRows = () => {
    // [...this.tableBody.rows].forEach((row) => row.remove());
    this.tableBody.innerHTML = '';
    this.tableFooter.innerHTML = '';
  };

  /**
   * Initial load of the table.
   *
   * @param {[]CartItem} products
   */
  renderProducts = (products) => {
    this.removeAllTableRows();
    let rows = [];

    for (const product of products) {
      rows.push(this.createTableRow(product, { shouldAppend: false }));
    }

    this.tableBody.append(...rows);
  };

  // removes all products
  reset = () => {
    this.removeAllTableRows();
    this.hideTable();

    this.filter.deactivate();
  };

  // uncovers the table visually
  showTable = () => {
    this.tableWrapper.style.display = 'flex';
    this.tableWrapper.hidden = false;
  };

  // hides the table visually
  hideTable = () => {
    this.tableWrapper.style.display = 'none';
    this.tableWrapper.hidden = true;
  };
}
