const DEBUG = false;
const API_KEY = 'vrb2Etiu2sUDrCe2';
let ALERT_TIMEOUT = null;
let browser = chrome;

const isUndefined = (variable) =>
  typeof variable === 'undefined' || variable === null;

/**
 * @param {String} htmlString representing a single element
 * @return {Element}
 */
const convertHtmlStringToElement = (htmlString) => {
  var template = document.createElement('template');
  htmlString = htmlString.trim(); // Never return a text node of whitespace as the result

  template.innerHTML = htmlString;
  return template.content.firstChild;
};

const loadDataFromLastSession = () => {
  browser.storage.local.get('ClientID', function (items) {
    if (!browser.runtime.lastError) {
      //do what you want to do with the data
      const clientId = items.ClientID;
      if (!isUndefined(clientId)) {
        document.querySelector('#input_clientid').value = clientId;
      }
    }
  });

  browser.storage.local.get('Client', function (items) {
    if (!browser.runtime.lastError) {
      //do what you want to do with the data
      const client = items.Client;

      if (!isUndefined(client) && !client['error']) {
        document.querySelector('#fragment-table').classList.remove('d-none');
        fillFragmentTable(client);
      }
    }
  });
};

const fillFragmentTable = (client) => {
  const fragmentTable = document.querySelector('#fragment-table');
  const fragmentTableBody = fragmentTable.querySelector('tbody');
  let rows = [];

  const createFragmentIDCell = (value) => {
    const cell = document.createElement('td');
    cell.classList.add('col-3');
    cell.textContent = value;
    return cell;
  };
  const createFragmentNameCell = (value) => {
    const cell = document.createElement('td');
    cell.classList.add('col');
    cell.textContent = value;
    return cell;
  };
  const createFragmentStatus = (value) => {
    const cell = document.createElement('td');
    cell.classList.add('col-4');
    let location = ''; // default = server

    if (value === 'client') {
      location = 'checked';
    }

    const toggleElementString = `
    <label class="toggleSwitch nolabel">
      <input type="checkbox" ${location} />
      <a></a>
      <span>
        <span class="left-span">Server</span>
        <span class="right-span">Client</span>
      </span>
    </label>`;

    const toggleElement = convertHtmlStringToElement(toggleElementString);
    cell.append(toggleElement);
    return cell;
  };

  client.fragments.forEach((fragment) => {
    const row = document.createElement('tr');
    row.classList.add('d-flex');
    const fragmentIDCell = createFragmentIDCell(fragment.id);
    const fragmentNameCell = createFragmentNameCell(fragment.name);
    const fragmentStatusCell = createFragmentStatus(fragment.runOn);
    row.append(fragmentIDCell, fragmentNameCell, fragmentStatusCell);
    rows.push(row);
  });

  fragmentTableBody.innerHTML = '';
  fragmentTableBody.append(...rows);
};

/**
 *  Like window.location it returns the current URL.
 * @return {Promise<URL>}
 */
const getCurrentUrl = () => {
  return new Promise((resolve, reject) => {
    browser.tabs.query(
      { active: true, currentWindow: true, lastFocusedWindow: !DEBUG },
      (tabs) => {
        if (tabs.length === 0) {
          reject(new Error('no active tab found'));
          return;
        }

        let { url: urlString } = tabs[0];

        if (!urlString) {
          reject(new Error('failed to retrieve URL'));
          return;
        }

        resolve(new URL(urlString));
      },
    );
  });
};

const createSuccessAlert = (msg) => {
  const div = document.createElement('div');
  div.classList.add('my-alert', 'success');
  const svg = convertHtmlStringToElement(`
  <svg
    class="bi flex-shrink-0 me-2"
    width="16"
    height="16"
    role="img"
    aria-hidden="true"
  >
    <use xlink:href="#check-circle-fill" />
  </svg>
  `);

  const alertPrefix = convertHtmlStringToElement(
    ` <strong class="me-2"> Success </strong>`,
  );

  div.append(svg, alertPrefix, msg);
  return div;
};

const createErrorAlert = (msg) => {
  const div = document.createElement('div');
  div.classList.add('my-alert', 'error');
  const svg = convertHtmlStringToElement(`
  <svg
    class="bi flex-shrink-0 me-2"
    width="16"
    height="16"
    role="img"
    aria-hidden="true"
  >
    <use xlink:href="#exclamation-triangle-fill" />
  </svg>
  `);

  const alertPrefix = convertHtmlStringToElement(
    ` <strong class="me-2"> Error </strong>`,
  );

  div.append(svg, alertPrefix, msg);
  return div;
};

const hideAlert = () => {
  const alert = document.querySelector('#alert');
  alert.classList.remove('show');
  alert.innerHTML = '';
  // reset animation
  alert.getAnimations();
};

// type: success || error
const showAlert = (type, msg = '') => {
  const alert = document.querySelector('#alert');
  hideAlert();

  // alert.classList.remove('show'); // for current existing showing errors
  let alertElement = undefined;

  if (type === 'success') alertElement = createSuccessAlert(msg);
  else if (type === 'error') alertElement = createErrorAlert(msg);
  else return;

  alert.append(alertElement);
  alert.classList.add('show');

  // remove class and clear children after 5s
  if (ALERT_TIMEOUT) {
    clearTimeout(ALERT_TIMEOUT);
  }
  ALERT_TIMEOUT = setTimeout(hideAlert, 5000);
};

const updateClientHandler = async (evt) => {
  const clientId = document.querySelector('#input_clientid').value;
  const fragmentTableBody = document.querySelector('#fragment-table tbody');
  const rows = Array.from(fragmentTableBody.children);
  let fragments = [];

  // building the fragments array
  rows.forEach((row) => {
    const cols = row.children;
    let fragment = {};
    fragment['id'] = cols[0].textContent;
    fragment['name'] = cols[1].textContent;
    fragment['runOn'] = cols[2].querySelector('input').checked
      ? 'client'
      : 'server';

    fragments.push(fragment);
  });

  if (fragments.length === 0) {
    showAlert('error', 'missing data to update');
    return;
  }

  let url = '';
  try {
    url = await getCurrentUrl();
  } catch (err) {
    showAlert('error', err);
    console.error(err);
    return;
  }

  const apiRoute = '/api/v1';
  const apiRequest =
    url.protocol + url.host + apiRoute + `/clients?uuid=${clientId}`;
  let res = undefined;

  try {
    const response = await fetch(apiRequest, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'PUT',
        Origin: url.protocol + url.host,
        Authorization: API_KEY,
      },
      body: JSON.stringify(fragments),
    });

    res = await response.json();

    if (res['error']) {
      showAlert('error', `${res['error'].message}`);
      return;
    } else {
      showAlert(
        'success',
        res['status'].startsWith('Fragments')
          ? 'Fragments updated.'
          : 'No new information.',
      );
    }

    // probably not necessary to send again a request
    // loadClientHandler();
  } catch (err) {
    showAlert('error', 'update request failed');
    console.error(err);
    return;
  }
};

const loadClientHandler = async (evt) => {
  const clientId = document.querySelector('#input_clientid').value;
  if (isUndefined(clientId) || clientId === '') {
    return;
  }

  browser.storage.local.set({ ClientID: clientId }, function () {
    if (browser.runtime.lastError) {
      console.log("Error: couldn't save client id.");
    }
  });

  let url = '';
  try {
    url = await getCurrentUrl();
  } catch (err) {
    showAlert('error', err);
    console.error(err);
    return;
  }

  const apiRoute = '/api/v1';
  const apiRequest =
    url.protocol + url.host + apiRoute + `/clients?uuid=${clientId}`;
  let client = undefined;

  try {
    const response = await fetch(apiRequest, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        Authorization: API_KEY,
      },
    });

    client = await response.json();
  } catch (err) {
    showAlert('error', 'fetch request failed');
    browser.storage.local.remove('Client', function () {
      if (browser.runtime.lastError) {
        console.error(browser.runtime.lastError);
      }
    });

    console.error(err);
    return;
  }

  if (!client['error']) {
    browser.storage.local.set({ Client: client }, function () {
      if (browser.runtime.lastError) {
        console.log("Error: couldn't save client id.");
      }
    });
    document.querySelector('#fragment-table').classList.remove('d-none');
    fillFragmentTable(client);
  } else {
    const fragmentTable = document.querySelector('#fragment-table');
    fragmentTable.classList.add('d-none');
    const fragmentTableBody = fragmentTable.querySelector('tbody');
    fragmentTableBody.innerHTML = '';
    showAlert('error', client['error'].message);
    browser.storage.local.remove('Client', function () {
      if (browser.runtime.lastError) {
        console.error(browser.runtime.lastError);
      }
    });
    browser.storage.local.remove('ClientID', function () {
      if (browser.runtime.lastError) {
        console.error(browser.runtime.lastError);
      }
    });
  }
};

const fetchClientsHandler = async (evt) => {
  let url = '';
  try {
    url = await getCurrentUrl();
  } catch (err) {
    showAlert('error', err.message);
    console.error(err);
    return;
  }

  const apiRoute = '/api/v1';
  const apiRequest = url.protocol + url.host + apiRoute + '/clients';
  let clients = [];

  try {
    const response = await fetch(apiRequest, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        Authorization: API_KEY,
      },
    });

    clients = await response.json();
  } catch (err) {
    showAlert('error', 'fetch request failed');
    console.error(err);
    return;
  }

  const clientsTable = document.querySelector('#clients-table');
  const clientsTableBody = clientsTable.querySelector('tbody');

  if (clients?.length !== 0) {
    clientsTable.classList.remove('d-none');
  } else {
    clientsTableBody.innerHTML = '';
    clientsTable.classList.add('d-none');
    return;
  }

  let rows = [];

  const createClientPosCell = (value) => {
    const cell = document.createElement('th');
    cell.classList.add('text-center', 'col-1');
    cell.setAttribute('scope', 'row');
    cell.textContent = value;
    return cell;
  };
  const createClientUUIDCell = (value) => {
    const cell = document.createElement('td');
    cell.classList.add('col');
    cell.textContent = value;
    return cell;
  };

  clients.forEach((fragment) => {
    const row = document.createElement('tr');
    row.classList.add('d-flex');
    const nr = createClientPosCell(fragment['pos']);
    const uuid = createClientUUIDCell(fragment['uuid']);
    row.append(nr, uuid);
    rows.push(row);
  });

  clientsTableBody.innerHTML = '';
  clientsTableBody.append(...rows);
};

function main() {
  loadDataFromLastSession();

  let forms = document.querySelectorAll('.form');
  [...forms].forEach((form) => {
    form.addEventListener('submit', (evt) => {
      evt.preventDefault(); // stop reloading page
      return;
    });
  });

  let fetchClientsButton = document.querySelector('#fetchClientsButton');
  fetchClientsButton.addEventListener('click', fetchClientsHandler, false);

  let loadClientButton = document.querySelector('#loadClientButton');
  loadClientButton.addEventListener('click', loadClientHandler, false);

  let updateClientButton = document.querySelector('#updateClientButton');
  updateClientButton.addEventListener('click', updateClientHandler, false);

  document
    .querySelector('input[type=search]')
    .addEventListener('input', (evt) => {
      // clear button in search input field
      // Object.getPrototypeOf(evt).constructor.name
      if (!(evt instanceof InputEvent)) {
        browser.storage.local.remove(['Client'], function () {
          if (browser.runtime.lastError) {
            console.error(browser.runtime.lastError);
          }
        });
        const fragmentTable = document.querySelector('#fragment-table');
        fragmentTable.classList.add('d-none');
        const fragmentTableBody = fragmentTable.querySelector('tbody');
        fragmentTableBody.innerHTML = '';
      }
    });
}

function contentLoadedHandler(e) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler, false);

  main.call(this);
}

window.addEventListener('DOMContentLoaded', contentLoadedHandler, false);
