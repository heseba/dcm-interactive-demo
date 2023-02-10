'use strict';

import MultistepForm from './MultistepForm.js';
import { codeDistributor } from './initCodeDistributor.js';
import { selectElement, selectElements } from './utils/helpers.js';

export default class CouponForm {
  /**
   * Creates an instance of CouponForm.
   * @param {MultistepForm} multistepForm
   * @memberof CouponForm
   */
  constructor(multistepForm) {
    this.form = selectElement('#coupon-form');
    this.form.addEventListener('submit', (evt) => {
      evt.preventDefault(); // stop reloading page
      return;
    });

    this.input = this.form.querySelector('input#coupon-input');
    this.submitButton = this.form.querySelector('button');
    this.statusDisplay = selectElement('#coupon-status');
    this.activeTimeout = null;

    this.submitButton.addEventListener('click', async (evt) => {
      if (
        evt.target.disabled ||
        evt.target.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      evt.target.classList.add('loading');
      let [ok, err] = await this.#validateInput();

      if (!ok) {
        this.#changeStatusDisplay('error', err);
        evt.target.classList.remove('loading');
        return;
      }

      [ok, err] = await this.#validateCoupon();
      evt.target.classList.remove('loading');

      if (!ok) {
        this.#changeStatusDisplay('error', err);
        return;
      }

      this.#changeStatusDisplay('success', 'Gutschein eingelöst: -15%');
      multistepForm.isCouponActive = true;
    });
  }

  /**
   * Display the resulting action message.
   * @param {string} status error or success
   * @param {string} msg Message to display.
   */
  #changeStatusDisplay = (status, msg) => {
    this.statusDisplay.removeAttribute('hidden');
    this.statusDisplay.setAttribute('aria-hidden', 'false');

    if (this.activeTimeout !== null) clearTimeout(this.activeTimeout);

    // hide msg after x seconds
    this.activeTimeout = setTimeout(() => {
      this.statusDisplay.setAttribute('hidden', '');
      this.statusDisplay.setAttribute('aria-hidden', 'true');
      this.activeTimeout = null;
    }, 1000 * 4);

    this.statusDisplay.textContent = msg;

    switch (status) {
      case 'success':
        this.statusDisplay.classList.remove('error');
        this.statusDisplay.classList.add('success');
        // don't allow to use more coupons
        this.submitButton.disabled = true;
        this.submitButton.ariaDisabled = 'true';
        this.input.disabled = true;
        // keep message displayed
        clearTimeout(this.activeTimeout);
        break;
      case 'error':
        this.statusDisplay.classList.remove('success');
        this.statusDisplay.classList.add('error');
        break;
      default:
        break;
    }
  };

  #validateInput = async () => {
    try {
      const { returnValue0, returnValue1: err } = await codeDistributor.call(
        11,
        'ValidateCouponInput',
        this.input.value
      );

      if (returnValue0 === false) {
        this.input.focus();
        return [returnValue0, err.message];
      }

      return [returnValue0, undefined];
    } catch (err) {
      this.submitButton.disabled = true;
      this.submitButton.ariaDisabled = 'true';
      return [
        false,
        'Ein Fehler ist aufgetreten. Gutscheine können aktuell nicht verwertet werden.',
      ];
    }
  };

  #validateCoupon = async () => {
    try {
      const valid = await codeDistributor.call(
        13,
        'ValidateCoupon',
        this.input.value
      );

      if (!valid) {
        return [valid, 'Ungültiger Coupon'];
      }

      return [valid, undefined];
    } catch (err) {
      this.submitButton.disabled = true;
      this.submitButton.ariaDisabled = 'true';
      [
        false,
        'Ein Fehler ist aufgetreten. Gutscheine können aktuell nicht verwertet werden.',
      ];
    }
  };
}
