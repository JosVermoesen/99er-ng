# 99er-ng

This is a learning version of js99er.net using Angular 16 with PrimeNG. Try the original [here](https://js99er.net).

## Setting up development environment for 99er-ng

* Clone the repository to a folder on your computer
* Check Node is installed [Node.js](https://nodejs.org)
* Install Angular CLI: `npm install -g @angular/cli`
* Change to the directory containing the source code and install the dependencies: `npm i`

## Development server

Run 99er-ng locally by typing: `ng serve -o`, which will:

* Build the app for development mode
* Starts the web server and opens the app on port 4200 of your default browser: `http://localhost:4200`

### Updating to latest Angular

This app is on Angular 16.

`ng update @angular/cli@16 @angular/core@16`

### npm outdated

In terminal use the command `npm outdated` to see what packages are requiring updates and what their current and wanted versions are.

This will also show you which packages are deprecated. You can update all packages, or just some of them, by running `npm update [package-name]`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Embedding into a website

In index.html, whitout a config into the js99er element, all tooling will be visible, default cartridges loaded, all settings enabled.

```js
    <js99er></js99er>
```

If you want start with a config, after building the app, edit in dist/index.html the js99er element

Example1:

```js
    <js99er cartridgeURL="my-folder/my-cart.rpk"></js99er>
```

Example2:

```js
    <js99er 
        config='{
            "sidePanelVisible": false,
            "toolbarVisible": false,
            "cartridgeURL": "my-folder/my-cart.rpk", "settings": {}}'
        >
    </js99er>
```

The settings object may contain the following properties, shown here with the defaults:

```json
"settings": {
    "SoundEnabled": true,
    "SpeechEnabled": true,
    "32KRAMEnabled": true,
    "F18AEnabled": false,
    "PCKeyboardEnabled": false,
    "MapArrowKeysEnabled": false,
    "GoogleDriveEnabled": false,
    "SAMSEnabled": false,
    "GRAMEnabled": false,
    "PixelatedEnabled": false,
    "PauseOnFocusLostEnabled": false,
    "TIPIEnabled": false,
    "DebugResetEnabled": false,
    "H264CodexEnabled": false,
    "FastTIPIMouseEnabled": false
}
```
