# @certifaction/vue-pdf-viewer

[![package-shield][package-shield]][package-url]
[![lerna-shield][lerna-shield]][lerna-url]

PDF-Viewer for Vue.js based on Mozillas PDF.js

## Table of contents

* [Install](#install)
    * [As NPM package](#as-npm-package)
* [Usage](#usage)
    * [ES6](#es6)
    * [Load locales](#load-locales)
    * [Load stylesheet](#load-stylesheet)
* [License](#license)

## Install

### As NPM package

```shell script
npm install @certifaction/vue-pdf-viewer
```

## Usage

### ES6

```js
import PDFViewer from '@certifaction/vue-pdf-viewer'
```

### Load locales

Example code how to load the component translations:

```js
import merge from 'lodash.merge'

import pdfViewerEN from '@certifaction/vue-pdf-viewer/src/locales/en.json'
import pdfViewerDE from '@certifaction/vue-pdf-viewer/src/locales/de.json'
import pdfViewerFR from '@certifaction/vue-pdf-viewer/src/locales/fr.json'
import pdfViewerIT from '@certifaction/vue-pdf-viewer/src/locales/it.json'

function loadLocaleMessages() {
    // Load your messages
}

const messages = merge({
    en: pdfViewerEN,
    de: pdfViewerDE,
    fr: pdfViewerFR,
    it: pdfViewerIT
}, loadLocaleMessages())

new VueI18n({
    messages
})
```

### Load stylesheet

```scss
@use "@certifaction/vue-pdf-viewer/src/style/index";

@import "pdfjs-dist/web/pdf_viewer.css";
```

## Props

### pdfjsCMapUrl

Type: `string` | Required: `true`

Pass the path where the cmaps can be accessed.

vite.config.js example to copy the cmaps to the dist folder:
```js
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(
              resolve(dirname(fileURLToPath(import.meta.url)), './node_modules/pdfjs-dist/cmaps/*'),
          ),
          dest: 'pdf/cmaps/',
        },
      ],
    }),
  ],
})
```

### source

Type: `string` or `Uint8Array` | Required: `true`

The URL of the PDF document as `string` or the PDF documents content as `Uint8Array` which should be displayed.

### defaultScale

Type: `string` or `number` | Required: `false` | Default: `'auto'`

The PDF Viewer renders the pages initially with the defined defaulScale.

Possible `number` values: Min = `0.1`, Max = `10`

Possible `string` values: `'auto'`, `'page-actual',` `'page-fit'`, `'page-width'`

### documentName

Type: `string` | Required: `false` | Default: `'pdf-viewer-document.pdf'`

The documentName is used for downloadable files.

### allowDocumentDownload

Type: `boolean` | Required: `false` | Default: `false`

Shows the document download button if `true`

### pdfjsViewerOptions

Type: `Object` | Required: `false` | Default: `{}`

These options are passed to the constructor of PDFViewer.
Possible options are the PDFViewerOptions from [https://github.com/mozilla/pdf.js/web/base_viewer.js](https://github.com/mozilla/pdf.js/blob/master/web/base_viewer.js).

`container` and `eventBus` are always overridden by the component.

## License

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/certifaction/js-pdf-viewer/blob/master/LICENSE)

Released by [Certifaction AG](https://certifaction.com)

[package-shield]: https://img.shields.io/github/package-json/v/certifaction/js-pdf-viewer?filename=packages%2Fvue-pdf-viewer%2Fpackage.json
[package-url]: https://github.com/certifaction/js-pdf-viewer/pkgs/npm/vue-pdf-viewer
[lerna-shield]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
