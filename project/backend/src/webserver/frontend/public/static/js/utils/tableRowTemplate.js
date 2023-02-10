export const createTableRowHTMLTemplate = (product, options) => {
  options = options ?? {};

  let withQuantityButtons = options['withQuantityButtons'] ?? false;

  let id = product.id;
  let name = product.name;
  let price = product.price;
  let value = product.value;

  let quantity = product.quantity ?? 1;
  // if total was not calculated yet (aka. 1 piece)
  let totalPrice = product.totalPrice ?? price;
  let totalValue = product.totalValue ?? value;

  let quantityCell = `${quantity}`;

  if (withQuantityButtons) {
    quantityCell = `
    <div class="quantity-wrapper">
      <button
        type="button"
        class="btn btn--quantity"
        aria-label="Stückzahl verringern"
        aria-controls="quantity-${id}"
      >
        <svg
            class="table-delete-icons"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
          >
          <style>
            .font { font: normal 1.2em sans-serif; }
          </style>
            <g
              class="icon__delete-text"
              fill="#1F1F1F"
              ${quantity > 1 ? '' : 'hidden'}
            >
              <text x="9" y="19" class="font">-</text>
            </g>
              <g
              class="icon__delete-trash"
              stroke-width="1.5"
              stroke="#d11111"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              ${quantity > 1 ? 'hidden' : ''}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
            </g>
          </svg>
      </button>
      <input
        type="number"
        class="no-counter-control"
        value="${quantity}"
        min="1"
        max="100"
        step="1"
        aria-label="Stückzahl"
        id="quantity-${id}"
      /><button
        class="btn btn--quantity"
        aria-label="Stückzahl erhöhen"
        aria-controls="quantity-${id}"
      >
        +
      </button>
    </div>
    `;
  }

  return `<tr data-tableId="${id}">
          <td data-label="Produktname" data-value="${name}">${name}</td>
          <td data-label="Quantität">${quantityCell}</td>
          <td data-label="Stückpreis" data-value="${value}">${price}</td>
          <td data-label="Mengenpreis" data-value="${totalValue}">${totalPrice}</td>
        </tr>`;
};
