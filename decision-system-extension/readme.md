# Fragment Distribution Control Browser Extension

- [Fragment Distribution Control Extension](#fragment-distribution-control-browser-extension)
  - [Installation](#installation)
  - [Permissions](#permissions)
  - [Files](#files)
    - [Background Script](#background-script)
    - [Content Scripts](#content-scripts)
    - [Popup Page](#popup-page)
    - [Options Page](#options-page)
    - [Icons](#icons)
  - [Load Extension](#load-extension)
  - [Debugging](#debugging)
    - [Running scripts outside the extension](#running-scripts-outside-the-extension)

All JSON keys: [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)

## Installation

**Chrome**
Open your browser extensions pane and activate the developer mode.  
Click on load packed extension and choose the `.crx` file.

**Firefox**
Currently it can only be loaded as temporary addon.  
[Follow these steps to enable developer mode.](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#:~:text=and%20Safari%20implementation.-,Turn%20on%20the%20developer%20preview,-The%20developer%20preview)  
Afterwards load the extension temporarly [here](about:debugging#/runtime/this-firefox) by opening the manifest.json file.

## Permissions

The permissions depend on what the extension needs to do.

```json
"permissions": ["activeTab", "storage"]
```

A list of all of the permissions and what they mean can be found [here](https://developer.chrome.com/docs/extensions/mv3/declare_permissions).

## Files

### Background Script

Background Script is a JavaScript file that runs in the background to handle browser events. It is also known as the extension’s event handler page. It is responsible for handling the browser's events such as on bookmark create, on page load completed, etc.

```json
"background": {
  "service_worker": ["scripts/background.js"]
}
```

### Content Scripts

This is the JavaScript file that is injected into the web page to perform operations such as accessing the details of the web pages, make changes to them, and pass information to their parent extension.

|           |                                                                                 |
| --------- | ------------------------------------------------------------------------------- |
| `matches` | responsible for deciding where to inject script, based of URL pattern matching. |
| `css`     | An array of style sheet file paths to be injected.                              |
| `js`      | An array of JS file paths to be injected.                                       |
| `run_at`  | used to decide when to inject and execute the script.                           |

```json
"content_scripts": [
  {
    "matches": ["http://*/*", "https://*/*"], // *://*/*
    "css": ["styles/contentStyle.css"],
    "js": ["scripts/contentScript.js"],
    "run_at": "document_end",
    "all_frames": false
  }
]
```

### Popup Page

A pop up is an HTML file that is displayed in a special window when the user clicks the toolbar icon. It works in a very similar way compared to a web page; it can contain links to stylesheets and script tags but does not allow inline JavaScript.

```json
"browser_action": {
  "default_title": "My Extension Title",
  "default_popup": "pages/popup/popup.html"
}
```

### Options Page

Allow users to customize the behaviour of an extension by providing an options page. A user can view the extension’s options by right-clicking the extension icon in the toolbar and then selecting options. Another way to navigate to the extension management page at chrome://extensions and then selecting Details on the desired extension. In the details page select the options link.

```json
"options_ui": {
  "page": "pages/options/options.html",
  "browser_style": true
},
```

### Icons

We need 4 icons to officially submit the extension to the Chrome Web Store.

```json
"action": {
  "default_icon": {
    "16": "assets/icons/favicon16.png",
    "32": "assets/icons/favicon32.png",
    "48": "assets/icons/favicon48.png",
    "128": "assets/icons/favicon128.png"
  }
}
```

## Load Extension

- `chrome://extensions/` in the browser’s address bar
  - or click on options > more tools > extensions
- enable developer mode
- first time: pack your extension (this generates 2 files which you have to keep)
- Load unpacked extension

Any new adjustment you make, can be updated when you click on the reload button.

## Debugging

Right-click on the popup icon and click on "check pop-up".
We now have access to logging and debugging! Keep in mind, though, that if anything is set in localStorage, then it will only exist in the extension’s DevTools localStorage; not the user’s browser localStorage.

### Running scripts outside the extension

Say we want to run a script that has access to information on the current tab?

```js
function exampleFunction() {
  chrome.tabs.executeScript(() => {
    chrome.tabs.executeScript({ file: 'scripts/background.js' });
  });
}
```
