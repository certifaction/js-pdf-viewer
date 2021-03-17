# @certifaction/js-pdf-viewer

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
| Pdf.js ES6 Module | [@certifaction/pdfjs](https://github.com/certifaction/js-pdf-viewer/tree/main/packages/pdfjs) | [![latest](https://img.shields.io/npm/v/@certifaction/pdfjs/latest.svg)](https://npmjs.com/package/@certifaction/pdfjs) |
| Vue.js PDF-Viewer | [@certifaction/vue-pdf-viewer](https://github.com/certifaction/js-pdf-viewer/tree/main/packages/vue-pdf-viewer) | [![latest](https://img.shields.io/npm/v/@certifaction/vue-pdf-viewer/latest.svg)](https://npmjs.com/package/@certifaction/vue-pdf-viewer) |

## Development

### Requirements

* [NodeJS](https://nodejs.org) >= 15
* [Yarn](https://yarnpkg.com)
* [Lerna](https://lerna.js.org)

### Getting started

Clone the git repo and install dependencies.
```shell script
git clone https://github.com/certifaction/js-pdf-viewer.git
cd js-pdf-viewer
lerna bootstrap
```

Check and fix linting errors
```shell script
lerna run lint
```

Build libraries
```shell script
lerna run build
```

### Publishing

To publish a new version please commit your changes to master and then execute

```shell script
lerna run build
lerna publish
```

This will start the wizard to publish a new version.

## License

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/certifaction/js-pdf-viewer/blob/master/LICENSE)

Released by [Certifaction AG](https://certifaction.com)

[lerna]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
