import { type PDFDocumentProxy, type DocumentInitParameters } from 'pdfjs-dist'
import { type PDFViewer as PDFViewerType, type PDFViewerOptions } from 'pdfjs-dist/web/pdf_viewer.mjs'

export enum Scale {
    Auto = 'auto',
    PageActual = 'page-actual',
    PageFit = 'page-fit',
    PageWidth = 'page-width',
}

export type DocumentOptions = Omit<DocumentInitParameters, 'cMapUrl' | 'iccUrl' | 'wasmUrl' | 'url' | 'data'>

// Manual type definition for EventBus "pagesloaded"
export interface PagesLoadedEvent {
    source: PDFViewerType
    pagesCount: number
}

// Manual type definition for EventBus "pagechanging"
export interface PageChangeEvent {
    source: PDFViewerType
    pageNumber: number
    pageLabel: string | null
    previous: number
}

// Manual type definition for EventBus "scalechanging"
export interface ScaleChangeEvent {
    source: PDFViewerType
    scale: number
    presetValue: Scale
}

export class PdfJsHelper {
    readonly #initialized: Promise<boolean>
    readonly #cMapUrl: string
    readonly #iccUrl: string
    readonly #wasmUrl: string

    /**
     * @param cMapUrl The URL where the predefined Adobe CMaps are located. Include the trailing slash.
     * @param iccUrl The URL where the predefined ICC profiles are located. Include the trailing slash.
     * @param wasmUrl The URL where the wasm files are located. Include the trailing slash.
     */
    constructor(cMapUrl: string, iccUrl: string, wasmUrl: string) {
        if (globalThis.useLegacyPdfJsBuild === undefined) {
            globalThis.useLegacyPdfJsBuild =
                typeof Promise.withResolvers !== 'function' || typeof URL.parse !== 'function'
        }
        this.#cMapUrl = cMapUrl
        this.#iccUrl = iccUrl
        this.#wasmUrl = wasmUrl

        this.#initialized = this.#init()
    }

    async #init(): Promise<boolean> {
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

    async loadDocument(source: string | Uint8Array, options?: DocumentOptions): Promise<PDFDocumentProxy> {
        await this.#initialized

        const { getDocument } = globalThis.useLegacyPdfJsBuild
            ? await import('pdfjs-dist/legacy/build/pdf.mjs')
            : await import('pdfjs-dist')

        const docOptions: DocumentInitParameters = {
            ...options,
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

    async hasForm(pdfDocument: PDFDocumentProxy): Promise<boolean> {
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

    async formValuesHaveChanged(pdfDocument: PDFDocumentProxy): Promise<boolean> {
        if (!(await this.hasForm(pdfDocument))) {
            return false
        }

        const currentFormValues = [...pdfDocument.annotationStorage]

        return currentFormValues.length !== 0
    }

    async createPdfViewer(
        pdfjsViewerOptions: Omit<PDFViewerOptions, 'container' | 'eventBus'>,
        viewerContainer: HTMLDivElement,
        viewer: HTMLDivElement,
    ): Promise<PDFViewerType> {
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
