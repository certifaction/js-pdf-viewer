# @certifaction/vue-pdf-viewer

[![npm][npm]][npm-url]
[![lerna][lerna]][lerna-url]

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

# or if using yarn
yarn add @certifaction/vue-pdf-viewer
```

## Usage

### ES6

```js
import PDFViewer from '@certifaction/vue-pdf-viewer'

new Vue({
    components: {
        PDFViewer
    }
})
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
$pdf-viewer-asset-base-path: "/node_modules/@certifaction/pdfjs/dist/";
@import "@certifaction/vue-pdf-viewer/src/style/index";
```

## Props

### pdfjsWorkerSrc

Type: `string` | Required: `false` (either [`pdfjsWorkerSrc`](#pdfjsworkersrc) or [`pdfjsWorkerInstance`](#pdfjsworkerinstance) is required)

URL to the pdfjs.worker.js or pdfjs.worker.min.js.

### pdfjsWorkerInstance

Type: `Worker` | Required: `false` (either [`pdfjsWorkerInstance`](#pdfjsworkerinstance) or [`pdfjsWorkerSrc`](#pdfjsworkersrc) is required)

When the worker is loaded with the Webpack [worker-loader](https://www.npmjs.com/package/worker-loader), you can also pass the instance of the worker.

vue.config.js example:
```js
chainWebpack: config => {
    config.module
        .rule('js')
        .exclude.add(/\.worker\.js$/)

    config.module
        .rule('worker')
        .test(/\.worker(\.min)?\.js$/)
        .use('worker-loader')
        .loader('worker-loader')
        .options({ filename: 'js/[name].[hash:8].js' })
        .end()
}
```

Usage example:
```vue
<template>
    <div class="test">
        <PDFViewer :pdfjs-worker-instance="pdfjsWorker"/>
    </div>
</template>

<script>
import PdfjsWorker from '@certifaction/pdfjs/dist/pdfjs.worker.min'

export default {
    name: 'Test',
    components: {
        PDFViewer
    },
    data() {
        return {
            pdfjsWorker: new PdfjsWorker()
        }
    }
}
</script>
```

### pdfjsCMapUrl

Type: `string` | Required: `true`

Pass the path where the cmaps can be accessed.

vue.config.js example to copy the cmaps to the dist folder:
```js
chainWebpack: config => {
    config.plugin('copy')
        .tap(args => {
            args[0].push({
                from: '@certifaction/pdfjs/dist/cmaps',
                to: 'pdf/cmaps',
                toType: 'dir',
                context: './node_modules'
            })
            return args
        })
}
```

### source

Type: `string` or `Uint8Array` | Required: `true`

URL as a `string` of the PDF document or the PDF documents content as `Uint8Array` which should be displayed.

### defaultScale

Type: `string` or `number` | Required: `false` | Default: `'auto'`

The PDF Viewer renders the pages initially with the defined defaulScale.

Possible values for `number`: Min = `0.1`, Max = `10`

Possible values for `string`: `'auto'`, `'page-actual',` `'page-fit'`, `'page-width'`

### pdfjsViewerOptions

Type: `Object` | Required: `false` | Default: `{}`

These options are passed to the constructor of PDFViewer.
Possible options are the PDFViewerOptions from [https://github.com/mozilla/pdf.js/web/base_viewer.js](https://github.com/mozilla/pdf.js/blob/master/web/base_viewer.js).

`container` and `eventBus` are always overridden by the component.

## License

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/certifaction/js-pdf-viewer/blob/master/LICENSE)

Released by [Certifaction AG](https://certifaction.com)

[npm]: https://img.shields.io/npm/v/@certifaction/vue-pdf-viewer.svg
[npm-url]: https://www.npmjs.com/package/@certifaction/vue-pdf-viewer
[lerna]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
