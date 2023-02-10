'use strict';

import { convertHtmlStringToElement, euro } from '../utils/helpers.js';
import Table from './index.js';
import { createTableFooterHTMLTemplate } from '../utils/tableFooterTemplate.js';
import { codeDistributor } from '../initCodeDistributor.js';

export default class SummaryTable extends Table {
  /**
   * Creates an instance of CartTable.
   * @param {Object} tableOptions
   * @param {Object} total
   * @param {float} total.value
   * @param {string} total.price
   * @param {Boolean} isCouponActive
   * @memberof CartTable
   */
  constructor(tableOptions, total, isCouponActive) {
    tableOptions = tableOptions ?? {};
    super(tableOptions);
    this.total = total;
    this.isCouponActive = isCouponActive;

    this.scrollHeight = document.body.scrollHeight;
  }

  /**
   * Initial load of the table.
   */
  renderCosts = async () => {
    this.removeAllTableRows();
    /** @type {string[]} */
    let rows = [];
    /** @type {float[]} */
    let totalValues = [];

    totalValues.push(this.total.value);
    rows.push(
      this.#createTableRow({
        name: 'Gesamtpreis',
        priceObj: this.total,
      })
    );

    if (this.isCouponActive) {
      // toFixed returns a string => convert with +
      const discountValue = await codeDistributor.call(
        15,
        'CalcDiscount',
        this.total.value,
        15.0
      );
      const discountValuePrecisionTwo = await codeDistributor.call(
        16,
        'RoundFloat',
        discountValue
      );

      totalValues.push(-discountValuePrecisionTwo);

      rows.push(
        this.#createTableRow({
          name: 'Gutschein (15% Rabatt)',
          priceObj: {
            value: -discountValuePrecisionTwo,
            price: '-' + euro(discountValuePrecisionTwo).format(),
          },
        })
      );
    }

    const transportCostValue = 6.0;
    totalValues.push(transportCostValue);

    rows.push(
      this.#createTableRow({
        name: 'Transportkosten',
        priceObj: {
          value: transportCostValue,
          price: euro(transportCostValue).format(),
        },
      })
    );

    const total = await codeDistributor.call(10, 'AddFloats', ...totalValues);

    this.tableBody.append(...rows);

    let footerRow = convertHtmlStringToElement(
      createTableFooterHTMLTemplate(
        {
          value: total,
          price: euro(total).format(),
        },
        2
      )
    );

    this.tableFooter.append(footerRow);

    window.scrollTo(0, this.scrollHeight);
  };

  #createTableRow = (data) => {
    const { name, priceObj } = data;
    return convertHtmlStringToElement(`
      <tr>
        <td data-label="Kostenpunkt">${name}</td>
        <td data-label="Preis" data-value="${priceObj.value}">${priceObj.price}</td>
      </tr>
    `);
  };
}
