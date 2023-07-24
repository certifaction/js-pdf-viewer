# @certifaction/js-pdf-viewer

> Branch [`1.x`](https://github.com/certifaction/js-pdf-viewer/tree/1.x) is for Vue2. Branch [`main`](https://github.com/certifaction/js-pdf-viewer/tree/main) is for Vue3

[![lerna][lerna]][lerna-url]

## Table of contents

* [Packages](#packages)
* [Development](#development)
  * [Requirements](#requirements)
  * [Getting started](#getting-started)
  * [Publishing](#publishing)
* [License](#license)

## Packages

This monorepo contains these packages:

| Project | Package | Version |
|---|---|---|
| Pdf.js ES6 Module | [@certifaction/pdfjs](https://github.com/certifaction/js-pdf-viewer/tree/main/packages/pdfjs) | [![latest](https://img.shields.io/github/package-json/v/certifaction/js-pdf-viewer?filename=packages%2Fpdfjs%2Fpackage.json)](https://github.com/certifaction/js-pdf-viewer/pkgs/npm/pdfjs) |
| Vue.js PDF-Viewer | [@certifaction/vue-pdf-viewer](https://github.com/certifaction/js-pdf-viewer/tree/main/packages/vue-pdf-viewer) | [![latest](https://img.shields.io/github/package-json/v/certifaction/js-pdf-viewer?filename=packages%2Fvue-pdf-viewer%2Fpackage.json)](https://github.com/certifaction/js-pdf-viewer/pkgs/npm/vue-pdf-viewer) |

## Development

### Requirements

* [NodeJS](https://nodejs.org) >= 20

### Getting started

Clone the git repo and install dependencies.
```shell script
git clone https://github.com/certifaction/js-pdf-viewer.git
cd js-pdf-viewer
npm install
```

Check and fix linting errors
```shell script
npm run lint
```

Build libraries
```shell script
npm run build
```

### Publishing

To publish a new version please commit your changes to master and then execute

```shell script
npm run build
npm run publish
```

This will start the wizard to publish a new version.

## License

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/certifaction/js-pdf-viewer/blob/master/LICENSE)

Released by [Certifaction AG](https://certifaction.com)

[lerna]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
