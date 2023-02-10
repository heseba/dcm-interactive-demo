/**
 * Creates a constructed string of table rows.
 * @param {Object} priceObj
 * @param {float} priceObj.value
 * @param {string} priceObj.price
 * @param {number} columnCount
 */
export const createTableFooterHTMLTemplate = (priceObj, columnCount) => {
  if (columnCount === 2) {
    return `
      <tr>
        <th scope="row">Gesamtsumme</th>
        <td data-label="Gesamtpreis" data-value="${priceObj.value}">${priceObj.price}</td>
      </tr>`;
  } else if (columnCount === 3) {
    return `
      <tr>
        <th scope="row">Gesamtsumme</th>
        <td colspan="2"></td>
        <td data-label="Gesamtpreis" data-value="${priceObj.value}">${priceObj.price}</td>
      </tr>`;
  }

  return ``;
};
