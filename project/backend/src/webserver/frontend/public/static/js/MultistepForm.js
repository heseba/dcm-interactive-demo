import SummaryTable from './Table/SummaryTable.js';
import CouponForm from './CouponForm.js';
import OrderTable from './Table/OrderTable.js';
import Controller from './Controller.js';
import { selectElement, selectElements } from './utils/helpers.js';

export default class MultistepForm {
  constructor(productCatalog) {
    this.form = selectElement('.multistep-form');
    this.progressbar = selectElement('.progressbar');
    this.emptyTableNotice = selectElement('#warenkorb-empty-message');
    this.orderConfirmation = selectElement('#order-confirmation');
    this.buyBtns = Array.from(selectElements('.product button'));

    this.isCouponActive = false;
    this.total = {};

    /** @type {Array<HTMLInputElement>} */
    this.radioBtns = Array.from(
      selectElements(
        '.multistep-form__progress .steps .step input[type="radio"]'
      )
    );
    /** @type {Array<HTMLElement>} */
    this.stages = Array.from(
      selectElements('.multistep-form__content .stages [class^="stage"]')
    );

    this.cartController = new Controller(productCatalog, this);

    this.uiMapping = {
      'stage-1': {
        trigger: selectElements('[data-trigger="stage2"]'),
        stages: this.stages[0],
        radio: this.radioBtns[0],
      },
      'stage-2': {
        trigger: selectElements('[data-trigger="stage3"]'),
        stages: this.stages[1],
        radio: this.radioBtns[1],
      },
      'stage-3': {
        trigger: selectElements('[data-trigger="stage1"]'),
        stages: this.stages[2],
        radio: this.radioBtns[2],
      },
    };

    this.radioBtns.forEach((input, i) => {
      input.addEventListener('change', this.changeStage);
    });

    this.uiMapping['stage-1'].trigger.forEach((trigger) => {
      trigger.addEventListener('click', async (evt) => {
        await new OrderTable(
          { table: selectElement('table#bestelluebersicht') },
          this
        ).renderProducts(store.get('cart'));

        new CouponForm(this);

        this.setStage(2);
        // this.changeStage(this.uiMapping['stage-2'].radio); // or manually
      });
    });

    this.uiMapping['stage-2'].trigger.forEach((trigger) => {
      trigger.addEventListener('click', async (evt) => {
        await new SummaryTable(
          { table: selectElement('table#bestellzusammenfassung') },
          this.total,
          this.isCouponActive
        ).renderCosts();

        this.setStage(3);
        // this.changeStage(this.uiMapping['stage-2'].radio);  // or manually
      });
    });

    this.uiMapping['stage-3'].trigger.forEach((trigger) => {
      trigger.addEventListener('click', (evt) => {
        if (evt.target.id !== 'finishOrderBtn') {
          this.setStage(1);
          // this.changeStage(this.uiMapping['stage-1'].radio);  // or manually
          return;
        }

        this.cartController.clear();
        // because clear reveals it again
        this.emptyTableNotice.hidden = true;
        this.orderConfirmation.style.display = 'flex';

        setTimeout(() => {
          this.orderConfirmation.style.display = null;
          this.emptyTableNotice.hidden = false;
          this.setStage(1);
        }, 5000);
      });
    });

    // if localStorage gets deleted
    window.addEventListener('storage', (evt) => {
      if (evt.key === null) {
        if (!store.has('cart')) {
          this.setStage(1);
        }
      } else if (evt.key === 'cart' && evt.newValue === null) {
        this.setStage(1);
      }
    });
  }

  /**
   * Trigger stage change event manually
   *
   * @param {number} stage Stagenumber
   * @memberof MultistepForm
   */
  setStage = (stage) => {
    if (Number.isInteger(stage))
      this.radioBtns[stage - 1].dispatchEvent(new Event('change'));
    else
      this.radioBtns[this.radioBtns.indexOf(stage)].dispatchEvent(
        new Event('change')
      );
  };

  changeStage = (evt) => {
    const target = evt instanceof Event ? evt.target : evt;

    const currentStage = this.radioBtns.indexOf(target);

    // remove or add disabled status on all buy buttons in the product catalog
    switch (currentStage + 1) {
      case 1:
        this.enableBuyBtns();
        break;
      case 2 || 3:
        this.disableBuyBtns();
        break;
      default:
        break;
    }

    // firefox... doesn't understand this
    // this.progressbar.ariaValueNow = currentStage + 1;
    this.progressbar.setAttribute('aria-valuenow', currentStage + 1);
    this.progressbar.style.setProperty(`--progressValue`, currentStage + 1);

    target.checked = true; // sets so it will be selected
    target.setAttribute('checked', true); // sets the DOM attribute for CSS
    target.disabled = false;

    // enable also the previous step if there is any
    if (currentStage > 0) {
      this.radioBtns[currentStage - 1].disabled = false;
    }

    this.stages[currentStage].classList.add('active');
    this.stages[currentStage].removeAttribute('aria-hidden');
    this.unselectOtherSteps(target);
  };

  unselectOtherSteps = (target) => {
    const currentStage = this.radioBtns.indexOf(target);

    this.radioBtns.forEach((input, i) => {
      if (this.radioBtns[i] != target) {
        input.removeAttribute('checked');
        this.stages[i].classList.remove('active');
        this.stages[i].setAttribute('aria-hidden', true);

        // disable only all next steps ahead and the steps before the previous
        // n1, n2, n-1, n, n5
        if (i != currentStage && i != currentStage - 1) {
          this.radioBtns[i].disabled = true;
        }
      }
    });
  };

  enableBuyBtns = () => {
    this.buyBtns.forEach((buyBtn) => {
      buyBtn.removeAttribute('aria-disabled');
    });
  };
  disableBuyBtns = () => {
    this.buyBtns.forEach((buyBtn) => {
      buyBtn.setAttribute('aria-disabled', true);
    });
  };

  showForm = () => {
    this.form.hidden = false;
    this.stages[0].classList.add('active');
    this.emptyTableNotice.hidden = true;
  };

  hideForm = () => {
    this.form.hidden = true;
    this.stages[0].classList.remove('active');
    this.emptyTableNotice.hidden = false;
  };
}
