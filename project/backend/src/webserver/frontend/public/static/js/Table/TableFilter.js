import CartItem from '../Cart/CartItem.js';
import { codeDistributor } from '../initCodeDistributor.js';
import {
  selectElement,
  selectElements,
  addEventListenerMulti,
} from '../utils/helpers.js';
import Table from './index.js';

export default class Filter {
  /**
   * Creates an instance of Filter.
   * @param {Table} table
   */
  constructor(table) {
    this.table = table;

    this.orderSwitch = selectElement('#toggle-sort-order');
    this.tableHeaderButtons = Array.from(
      selectElements('.warenkorb__btn--tablehead')
    );
    this.modalRadioButtons = Array.from(
      selectElements("#filterkriterien input[type='radio']")
    );
    this.isActive = false;

    this.uiMapping = {
      produktname: {
        btn: this.tableHeaderButtons.find((input) =>
          input.id.includes('Produktname')
        ),
        radio: this.modalRadioButtons.find((input) =>
          input.id.includes('Produktname')
        ),
        sortMode: '',
        prop: 'name',
      },
      stueckpreis: {
        btn: this.tableHeaderButtons.find((input) =>
          input.id.includes('Stueckpreis')
        ),
        radio: this.modalRadioButtons.find((input) =>
          input.id.includes('Stueckpreis')
        ),
        sortMode: '',
        prop: 'value',
      },
      mengenpreis: {
        btn: this.tableHeaderButtons.find((input) =>
          input.id.includes('Mengenpreis')
        ),
        radio: this.modalRadioButtons.find((input) =>
          input.id.includes('Mengenpreis')
        ),
        sortMode: '',
        prop: 'totalValue',
      },
    };

    addEventListenerMulti(
      [...this.tableHeaderButtons, ...this.modalRadioButtons],
      'click',
      async (evt) => {
        this.isActive = true;

        if (
          evt.target == this.uiMapping.produktname.btn ||
          evt.target == this.uiMapping.produktname.radio
        ) {
          this.unsetUiStates(evt.target);
          this.setStates(evt.target);

          const products = await this.sortValues(
            this.table.getProducts(),
            this.uiMapping.produktname.prop,
            this.uiMapping.produktname.sortMode
          );

          // this.table.renderProducts(products);
          // update it globally, so it keeps the sorted order
          this.table.controller.updateAllProducts(products);
        } else if (
          evt.target == this.uiMapping.stueckpreis.btn ||
          evt.target == this.uiMapping.stueckpreis.radio
        ) {
          this.unsetUiStates(evt.target);
          this.setStates(evt.target);

          const products = await this.sortValues(
            this.table.getProducts(),
            this.uiMapping.stueckpreis.prop,
            this.uiMapping.stueckpreis.sortMode
          );

          // this.table.renderProducts(products);
          // update it globally, so it keeps the sorted order
          this.table.controller.updateAllProducts(products);
        } else if (
          evt.target == this.uiMapping.mengenpreis.btn ||
          evt.target == this.uiMapping.mengenpreis.radio
        ) {
          this.unsetUiStates(evt.target);
          this.setStates(evt.target);

          const products = await this.sortValues(
            this.table.getProducts(),
            this.uiMapping.mengenpreis.prop,
            this.uiMapping.mengenpreis.sortMode
          );

          // this.table.renderProducts(products);
          // update it globally, so it keeps the sorted order
          this.table.controller.updateAllProducts(products);
        }
      }
    );

    // click listener for the switch in the modal
    this.orderSwitch.addEventListener('click', async (evt) => {
      if (!this.isActive) {
        return;
      }

      this.unsetUiStates();

      for (const uiElem of Object.values(this.uiMapping)) {
        if (uiElem.radio.checked) {
          const state = uiElem.sortMode === 'asc' ? 'asc' : 'desc';
          const stateReverse = state === 'asc' ? 'desc' : 'asc';
          uiElem.btn.classList.remove(state);
          uiElem.btn.classList.add(stateReverse);

          uiElem.sortMode = stateReverse;

          const products = await this.sortValues(
            this.table.getProducts(),
            uiElem.prop,
            uiElem.sortMode
          );

          // this.table.renderProducts(products);
          // update it globally, so it keeps the sorted order
          this.table.controller.updateAllProducts(products);
        }
      }
    });
  }

  /**
   * Sorts products depending on the criteria and sorting mode
   *
   * @param {CartItem[]} products
   * @param {string} criteria Filter criteria (property on the CartItem object)
   * @param {string} sortMode asc/desc
   * @returns {CartItem[]}
   */
  sortValues = async (products, criteria, sortMode) => {
    sortMode = sortMode || 'asc';

    if (products.length === 0 || products.length === 1) {
      return products;
    }

    // NOTE SORTING
    // const sorted = this.jsSort([...products], criteria, sortMode);
    const sortedProducts = await this.wasmSort(
      [...products],
      criteria,
      sortMode
    );

    return sortedProducts;
  };

  wasmSort = async (products, criteria, sortMode) => {
    /** @type {Array<String>} */
    let filtered = products.map((product) => {
      return product[criteria];
    });

    // strings
    if (typeof filtered[0] === 'string') {
      filtered = await codeDistributor.call(
        6,
        'SortStrings',
        sortMode,
        filtered
      );
    } else {
      filtered = await codeDistributor.call(
        7,
        'SortFloats',
        sortMode,
        filtered
      );
    }

    let sorted = [];
    for (const item of filtered) {
      for (const product of products) {
        if (item === product[criteria]) sorted.push(product);
      }
    }

    return sorted;
  };

  jsSort = (products, criteria, sortMode) => {
    /** @type {Array<String>} */
    let filtered = products.map((product) => {
      return product[criteria];
    });

    // strings
    if (typeof filtered[0] === 'string') {
      filtered = filtered.sort((a, b) => {
        if (sortMode === 'asc') {
          return a.localeCompare(b);
        } else {
          return b.localeCompare(a);
        }
      });
    } else {
      filtered = filtered.sort((a, b) => {
        if (sortMode === 'asc') {
          return a - b;
        } else {
          return b - a;
        }
      });
    }

    let sorted = [];
    for (const item of filtered) {
      for (const product of products) {
        if (item === product[criteria]) sorted.push(product);
      }
    }

    return sorted;
  };

  setStates = (target) => {
    for (const [key, uiElem] of Object.entries(this.uiMapping)) {
      if (target == uiElem.btn || target == uiElem.radio) {
        if (target.type === 'radio') {
          // ascending
          if (this.orderSwitch.checked === false) {
            this.uiMapping[key].btn.classList.remove('desc');
            this.uiMapping[key].btn.classList.add('asc');
            this.uiMapping[key].sortMode = 'asc';

            this.uiMapping[
              key
            ].btn.ariaLabel = `${this.uiMapping[key].btn.innerText} absteigend sortieren`;
          } else {
            this.uiMapping[key].btn.classList.remove('asc');
            this.uiMapping[key].btn.classList.add('desc');
            this.uiMapping[key].sortMode = 'desc';

            this.uiMapping[
              key
            ].btn.ariaLabel = `${this.uiMapping[key].btn.innerText} aufsteigend sortieren`;
          }
        } else {
          if (target.classList.contains('desc')) {
            target.classList.remove('desc');
            target.classList.add('asc');
            this.orderSwitch.checked = false;
            this.uiMapping[key].sortMode = 'asc';
            this.uiMapping[key].radio.checked = true;

            // switched because if you focus the button it should describe the action when pressed
            target.ariaLabel = `${target.innerText} absteigend sortieren`;
          } else if (target.classList.contains('asc')) {
            target.classList.remove('asc');
            target.classList.add('desc');
            this.orderSwitch.checked = true;
            this.uiMapping[key].sortMode = 'desc';
            this.uiMapping[key].radio.checked = true;

            // switched because if you focus the button it should describe the action when pressed
            target.ariaLabel = `${target.innerText} aufsteigend sortieren`;
          } else {
            // default
            target.classList.add('asc');
            target.ariaLabel = `${target.innerText} aufsteigend sortieren`;
            this.orderSwitch.checked = false;
            this.uiMapping[key].sortMode = 'asc';
            this.uiMapping[key].radio.checked = true;
          }
        }
      }
    }
  };

  unsetUiStates = (target) => {
    target = target ?? false;

    this.tableHeaderButtons.forEach((diffBtn) => {
      diffBtn != target ? diffBtn.classList.remove('asc', 'desc') : null;
    });

    if (!this.isActive) {
      this.orderSwitch.checked = false;
      for (const uiElem of Object.values(this.uiMapping)) {
        uiElem.radio.checked = false;
      }
    }
  };

  unsetSortModes = () => {
    if (!this.isActive) {
      for (const uiElem of Object.values(this.uiMapping)) {
        uiElem.sortMode = '';
      }
    }
  };

  deactivate = () => {
    if (this.isActive) {
      this.isActive = false;
      this.unsetUiStates();
    }
  };
}
