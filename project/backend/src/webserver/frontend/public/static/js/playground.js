'use strict';

import { selectElement, selectElements } from './utils/helpers.js';
import { codeDistributor } from './initCodeDistributor.js';

function wasm_add(codeDistributor) {
  const fields = {
    num1_input: selectElement('#add_numberOne'),
    num2_input: selectElement('#add_numberTwo'),
    result_output: selectElement('#add_result'),
    button: selectElement('#add_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      if (
        !fields.num1_input.value ||
        !fields.num2_input.value ||
        !Number.isInteger(Number(fields.num1_input.value)) ||
        !Number.isInteger(Number(fields.num2_input.value))
      ) {
        return;
      }

      const num1 = Number(fields.num1_input.value);
      const num2 = Number(fields.num2_input.value);
      try {
        fields.result_output.innerText = await codeDistributor.call({
          wasmId: 0,
          wasmFunc: 'Add',
          wasmParams: [num1, num2],
        });
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_gethash(codeDistributor) {
  const fields = {
    message: selectElement('#gethash_message'),
    result_output: selectElement('#gethash_result'),
    button: selectElement('#gethash_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      evt.preventDefault(); // stop reloading page

      const message = fields.message.value;
      try {
        fields.result_output.innerText = await codeDistributor.call({
          wasmId: 1,
          wasmFunc: 'GetHash',
          wasmParams: [message],
        });
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_calcmwst(codeDistributor) {
  const fields = {
    num: selectElement('#calcmwst_num'),
    result_output: selectElement('#calcmwst_result'),
    button: selectElement('#calcmwst_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      if (!fields.num.value) {
        return;
      }

      const num = parseFloat(fields.num.value);
      try {
        fields.result_output.innerText =
          (
            await codeDistributor.call({
              wasmId: 2,
              wasmFunc: 'CalcMwst',
              wasmParams: [num],
            })
          ).toFixed(2) + ' €';
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}

function wasm_genobj(codeDistributor) {
  const fields = {
    name: selectElement('#genobj_name'),
    age: selectElement('#genobj_age'),
    result_output: selectElement('#genobj_result'),
    button: selectElement('#genobj_calc'),
  };

  fields.button.addEventListener(
    'click',
    async (evt) => {
      // evt.preventDefault(); // stop reloading page
      if (
        !fields.name.value ||
        !fields.age.value ||
        !Number.isInteger(Number(fields.age.value))
      ) {
        return;
      }

      const name = fields.name.value;
      const age = Number(fields.age.value);
      try {
        const result = await codeDistributor.call({
          wasmId: 4,
          wasmFunc: 'GenObj',
          wasmParams: [name, age],
        });

        let pre = document.createElement('pre');
        pre.textContent = JSON.stringify(result, null, 2);
        fields.result_output.appendChild(pre);
      } catch (error) {
        fields.result_output.innerText = '#error';
        throw error;
      }
    },
    false
  );
}
function main() {
  wasm_add(codeDistributor);
  wasm_gethash(codeDistributor);
  wasm_calcmwst(codeDistributor);
  wasm_genobj(codeDistributor);

  let forms = selectElements('form');
  [...forms].forEach((form) => {
    form.addEventListener('submit', (evt) => {
      evt.preventDefault(); // stop reloading page
      return;
    });
  });

  let resetBtns = selectElements("input[type='reset']");
  [...resetBtns].forEach((resetBtn) => {
    let output = resetBtn.parentNode.parentNode.querySelector('output');
    resetBtn.addEventListener('click', (evt) => {
      output.innerHTML = '';
    });
  });
}

function contentLoadedHandler(e) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler, false);
  selectElement('body').classList.remove('preload');
  if (!window.Worker) {
    selectElement('body').innerHTML = `
  <p>Your browser requires WebWorker functionalities in order to work.
  `;
    return;
  }

  main.call(this);
}

window.addEventListener('DOMContentLoaded', contentLoadedHandler, false);
