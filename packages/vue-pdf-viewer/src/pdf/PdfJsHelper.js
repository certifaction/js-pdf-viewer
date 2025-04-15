/**
 * @typedef {import('pdfjs-dist').PDFDocumentProxy} PDFDocumentProxy
 * @typedef {import('pdfjs-dist/types/src/display/api').DocumentInitParameters} DocumentInitParameters
 * @typedef {import('pdfjs-dist/web/pdf_viewer').PDFViewer} PDFViewer
 * @typedef {import('pdfjs-dist/types/web/pdf_viewer').PDFViewerOptions} PDFViewerOptions
 */

/**
 * Manual type definition for parameter "RequiredField"
 * @typedef {Object} RequiredField
 * @property {string} fieldName
 * @property {string | boolean} fieldValue
 * @property {string} [fieldId]
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
    /** @type {Promise<boolean>} */
    #initialized
    /** @type {string} */
    #cMapUrl
    /** @type {string} */
    #iccUrl
    /** @type {string} */
    #wasmUrl

    /**
     * @param {string} cMapUrl
     * @param {string} iccUrl
     * @param {string} wasmUrl
     */
    constructor(cMapUrl, iccUrl, wasmUrl) {
        if (globalThis.useLegacyPdfJsBuild === undefined) {
            globalThis.useLegacyPdfJsBuild =
                typeof Promise.withResolvers !== 'function' || typeof URL.parse !== 'function'
        }
        this.#cMapUrl = cMapUrl
        this.#iccUrl = iccUrl
        this.#wasmUrl = wasmUrl

        this.#initialized = this.#init()
    }

    /**
     * @returns {Promise<boolean>}
     */
    async #init() {
        if (globalThis.useLegacyPdfJsBuild) {
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

        const { getDocument } = globalThis.useLegacyPdfJsBuild
            ? await import('pdfjs-dist/legacy/build/pdf.mjs')
            : await import('pdfjs-dist')

        /** @type {DocumentInitParameters} */
        const docOptions = {
            cMapUrl: this.#cMapUrl,
            iccUrl: this.#iccUrl,
            wasmUrl: this.#wasmUrl,
        }

        if (source instanceof Uint8Array) {
            // Create a clone because the buffer gets transferred
            docOptions.data = globalThis.structuredClone(source)
        } else {
            docOptions.url = source
        }

        return await getDocument(docOptions).promise
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
     * @param {PDFDocumentProxy} pdfDocument
     * @returns {Promise<Array<any>>}
     */
    async getFormFieldsToListen(pdfDocument) {
        if (!(await this.hasForm(pdfDocument))) {
            return []
        }

        const pageCount = pdfDocument.numPages
        const fieldsToListen = []

        for (let i = 1; i <= pageCount; i++) {
            const page = await pdfDocument.getPage(i)
            const annotations = await page.getAnnotations()
            Object.values(annotations).forEach((annotation) => {
                if (
                    (annotation.required && annotation.subtype === 'Widget') ||
                    (annotation.fieldType === 'Btn' && annotation.pushButton)
                ) {
                    fieldsToListen.push(annotation)
                }
            })
        }
        return fieldsToListen
    }

    /**
     * @param {RequiredField[]} requiredFields
     * @returns {Promise<boolean>}
     */
    async allRequiredFieldsFilled(requiredFields) {
        let hasEmptyRequiredFields = false

        requiredFields.forEach((requiredField) => {
            // Groups like choices have the same fieldName, so there just one needs to be selected
            const sameFieldNameFields = requiredFields.filter((ff) => ff.fieldName === requiredField.fieldName)
            const isEmpty = sameFieldNameFields.every(
                (ff) => ff.fieldValue === null || ff.fieldValue === false || ff.fieldValue === '',
            )
            if (isEmpty) {
                hasEmptyRequiredFields = true
            }
        })

        return !hasEmptyRequiredFields
    }

    /**
     * @param {PDFViewerOptions} pdfjsViewerOptions
     * @param {HTMLDivElement} viewerContainer
     * @param {HTMLDivElement} viewer
     * @returns {Promise<PDFViewer>}
     */
    async createPdfViewer(pdfjsViewerOptions, viewerContainer, viewer) {
        await this.#initialized

        const { EventBus, PDFViewer } = globalThis.useLegacyPdfJsBuild
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
}
