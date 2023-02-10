'use strict';

import { convertHtmlStringToElement, euro } from '../utils/helpers.js';
import Table from './index.js';
import { createTableFooterHTMLTemplate } from '../utils/tableFooterTemplate.js';
import { codeDistributor } from '../initCodeDistributor.js';
import MultistepForm from '../MultistepForm.js';

export default class OrderTable extends Table {
  /**
   * Creates an instance of CartTable.
   * @param {Object} tableOptions
   * @param {MultistepForm} multistepForm
   * @memberof CartTable
   */
  constructor(tableOptions, multistepForm) {
    tableOptions = tableOptions ?? {};
    super(tableOptions);

    /** @type {MultistepForm} */
    this.multistepForm = multistepForm;

    this.scrollHeight = document.body.scrollHeight;
  }

  /**
   * Initial load of the table.
   *
   * @param {[]CartItem} products
   */
  renderProducts = async (products) => {
    this.removeAllTableRows();
    let rows = [];
    let total = 0.0;

    for (const product of products) {
      rows.push(this.createTableRow(product, { shouldAppend: false }));
      total = await codeDistributor.call(
        10,
        'AddFloats',
        product.totalValue,
        total
      );
    }

    this.tableBody.append(...rows);

    const totalObj = {
      value: total,
      price: euro(total).format(),
    };

    this.multistepForm.total = totalObj;
    let footerRow = convertHtmlStringToElement(
      createTableFooterHTMLTemplate(totalObj, 3)
    );

    this.tableFooter.append(footerRow);

    window.scrollTo(0, this.scrollHeight);
  };
}
