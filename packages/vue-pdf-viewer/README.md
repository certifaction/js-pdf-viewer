# @certifaction/vue-pdf-viewer

[![package-shield][package-shield]][package-url]
[![lerna-shield][lerna-shield]][lerna-url]

PDF-Viewer for Vue.js based on Mozillas PDF.js

## Table of contents

* [Install](#install)
    * [As NPM package](#as-npm-package)
* [Usage](#usage)
    * [ES6](#es6)
* [Props](#props)
    * [source](#source)
    * [translate](#translate)
    * [defaultScale](#defaultscale)
    * [pdfjsViewerOptions](#pdfjsvieweroptions)
    * [pdfjsCMapUrl](#pdfjscmapurl)
* [License](#license)

## Install

### As NPM package

```shell script
npm install @certifaction/vue-pdf-viewer
```

## Usage

### ES6

```ts
import { PDFViewer } from '@certifaction/vue-pdf-viewer'
```

## Props

### source

Type: `string` or `Uint8Array` | Required: `true`

The URL of the PDF document as `string` or the PDF documents content as `Uint8Array` which should be displayed.

### translate

Type: `(key: string) => string` | Required: `true`

Function which gets used to translate the component.

vite.config.ts example to copy the provided translation files (to be used with i18next):
```ts
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(resolve(dirname(fileURLToPath(import.meta.url)), './node_modules/@certifaction/vue-pdf-viewer/src/locales/*')),
          dest: 'locales/',
          rename: (fileName, fileExtension) => `${fileName}/pdfViewer.${fileExtension}`,
        },
      ],
    }),
  ],
})
```

### defaultScale

Type: `string` or `number` | Required: `false` | Default: `'auto'`

The PDF Viewer renders the pages initially with the defined defaulScale.

Possible `number` values: Min = `0.1`, Max = `10`

Possible `string` values: `'auto'`, `'page-actual',` `'page-fit'`, `'page-width'`

### pdfjsViewerOptions

Type: `PDFViewerOptions` | Required: `false` | Default: `{}`

These options are passed to the constructor of PDFViewer.
Possible options are the PDFViewerOptions from [https://github.com/mozilla/pdf.js/web/base_viewer.js](https://github.com/mozilla/pdf.js/blob/master/web/base_viewer.js).

`container` and `eventBus` are always overridden by the component.

### pdfjsCMapUrl

Type: `string` | Required: `true`

Pass the path where the cmaps can be accessed.

vite.config.ts example to copy the cmaps to the dist folder:
```ts
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(resolve(dirname(fileURLToPath(import.meta.url)), './node_modules/pdfjs-dist/cmaps/*')),
          dest: 'pdf/cmaps/',
        },
      ],
    }),
  ],
})
```

## License

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/certifaction/js-pdf-viewer/blob/master/LICENSE)

Released by [Certifaction AG](https://certifaction.com)

[package-shield]: https://img.shields.io/github/package-json/v/certifaction/js-pdf-viewer?filename=packages%2Fvue-pdf-viewer%2Fpackage.json
[package-url]: https://github.com/certifaction/js-pdf-viewer/pkgs/npm/vue-pdf-viewer
[lerna-shield]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
