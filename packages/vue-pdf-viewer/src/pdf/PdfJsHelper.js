/**
 * @typedef {import('pdfjs-dist').PDFDocumentProxy} PDFDocumentProxy
 * @typedef {import('pdfjs-dist/types/src/display/api').DocumentInitParameters} DocumentInitParameters
 * @typedef {import('pdfjs-dist/web/pdf_viewer').PDFViewer} PDFViewer
 * @typedef {import('pdfjs-dist/types/web/pdf_viewer').PDFViewerOptions} PDFViewerOptions
 */

/**
 * Manual type definition for EventBus "pagesloaded"
 * @typedef {Object} PagesLoadedEvent
 * @property {PDFViewer} source
 * @property {number} pagesCount
 */

/**
 * Manual type definition for EventBus "pagechanging"
 * @typedef {Object} PageChangeEvent
 * @property {PDFViewer} source
 * @property {number} pageNumber
 * @property {string | null} pageLabel
 * @property {number} previous
 */

/**
 * Manual type definition for EventBus "scalechanging"
 * @typedef {Object} ScaleChangeEvent
 * @property {PDFViewer} source
 * @property {number} scale
 * @property {'auto' | 'page-actual' | 'page-fit' | 'page-width'} presetValue
 */

export class PdfJsHelper {
    /** @type {PdfJsHelper} */
    static #instance

    /** @type {Promise<boolean>} */
    #initialized
    /** @type {boolean} */
    #useLegacyPdfJsBuild = false
    /** @type {string} */
    #pdfjsCMapUrl

    /**
     * @param {string} pdfjsCMapUrl
     */
    constructor(pdfjsCMapUrl) {
        if (PdfJsHelper.#instance) {
            throw new Error('PDFJSHelper is a singleton class. Use PDFJSHelper.getInstance() instead.')
        }

        if (typeof Promise.withResolvers !== 'function') {
            this.#useLegacyPdfJsBuild = true
        }
        this.#pdfjsCMapUrl = pdfjsCMapUrl

        this.#initialized = this.#init()
    }

    /**
     * @returns {Promise<boolean>}
     */
    async #init() {
        if (this.#useLegacyPdfJsBuild) {
            const { GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')
            GlobalWorkerOptions.workerPort = new Worker(
                new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url),
                { type: 'module' },
            )
        } else {
            const { GlobalWorkerOptions } = await import('pdfjs-dist')
            GlobalWorkerOptions.workerPort = new Worker(
                new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
                { type: 'module' },
            )
        }

        return true
    }

    /**
     * @param {string | Uint8Array} source
     * @returns {Promise<PDFDocumentProxy>}
     */
    async loadDocument(source) {
        await this.#initialized

        const { getDocument } = this.#useLegacyPdfJsBuild
            ? await import('pdfjs-dist/legacy/build/pdf.mjs')
            : await import('pdfjs-dist')

        /** @type {DocumentInitParameters} */
        const docOptions = {
            cMapUrl: this.#pdfjsCMapUrl,
            cMapPacked: true,
        }

        if (source instanceof Uint8Array) {
            docOptions.data = new Uint8Array(source)
        } else {
            docOptions.url = source
        }

        return await getDocument(docOptions).promise
    }

    /**
     * @param {PDFDocumentProxy} pdfDocument
     * @returns {Promise<Uint8Array>}
     */
    async getPdfData(pdfDocument) {
        return await pdfDocument.saveDocument()
    }

    /**
     * @param {PDFDocumentProxy} pdfDocument
     * @returns {Promise<boolean>}
     */
    async hasForm(pdfDocument) {
        await this.#initialized

        const formFields = await pdfDocument.getFieldObjects()
        const metadata = await pdfDocument.getMetadata()

        if (!metadata?.info) {
            return false
        }

        let isAcroFormPresent = false
        if ('IsAcroFormPresent' in metadata.info && metadata.info.IsAcroFormPresent) {
            isAcroFormPresent = true
        }

        // Check if there are fields and if some are not signatures
        return (
            isAcroFormPresent &&
            Object.values(formFields ?? {}).some((arr) =>
                arr.some((field) => 'type' in field && field.type !== 'signature'),
            )
        )
    }

    /**
     * @param {PDFDocumentProxy} pdfDocument
     * @returns {Promise<boolean>}
     */
    async formValuesHaveChanged(pdfDocument) {
        if (!(await this.hasForm(pdfDocument))) {
            return false
        }

        const currentFormValues = pdfDocument.annotationStorage.getAll()

        return currentFormValues !== null
    }

    /**
     * @param {PDFViewerOptions} pdfjsViewerOptions
     * @param {HTMLDivElement} viewerContainer
     * @param {HTMLDivElement} viewer
     * @returns {Promise<PDFViewer>}
     */
    async createPdfViewer(pdfjsViewerOptions, viewerContainer, viewer) {
        await this.#initialized

        const { EventBus, PDFViewer } = this.#useLegacyPdfJsBuild
            ? await import('pdfjs-dist/legacy/web/pdf_viewer.mjs')
            : await import('pdfjs-dist/web/pdf_viewer.mjs')

        const eventBus = new EventBus()

        return new PDFViewer({
            ...pdfjsViewerOptions,
            container: viewerContainer,
            viewer,
            eventBus,
        })
    }

    /**
     * @param {string} pdfjsCMapUrl
     * @returns {PdfJsHelper}
     */
    static getInstance(pdfjsCMapUrl) {
        if (!this.#instance) {
            this.#instance = new PdfJsHelper(pdfjsCMapUrl)
        }

        return this.#instance
    }
}
