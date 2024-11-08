import { type PDFDocumentProxy, type DocumentInitParameters } from 'pdfjs-dist'
import { type PDFViewer as PDFViewerType, type PDFViewerOptions } from 'pdfjs-dist/web/pdf_viewer.mjs'

export enum Scale {
    Auto = 'auto',
    PageActual = 'page-actual',
    PageFit = 'page-fit',
    PageWidth = 'page-width',
}

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
    readonly #useLegacyPdfJsBuild: boolean = false
    readonly #pdfjsCMapUrl: string

    constructor(pdfjsCMapUrl: string) {
        if (typeof Promise.withResolvers !== 'function') {
            this.#useLegacyPdfJsBuild = true
        }
        this.#pdfjsCMapUrl = pdfjsCMapUrl

        this.#initialized = this.#init()
    }

    async #init(): Promise<boolean> {
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

    async loadDocument(source: string | Uint8Array): Promise<PDFDocumentProxy> {
        await this.#initialized

        const { getDocument } = this.#useLegacyPdfJsBuild
            ? await import('pdfjs-dist/legacy/build/pdf.mjs')
            : await import('pdfjs-dist')

        const docOptions: DocumentInitParameters = {
            cMapUrl: this.#pdfjsCMapUrl,
            cMapPacked: true,
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

        const currentFormValues = pdfDocument.annotationStorage.getAll()

        return currentFormValues !== null
    }

    async createPdfViewer(
        pdfjsViewerOptions: Omit<PDFViewerOptions, 'container' | 'eventBus'>,
        viewerContainer: HTMLDivElement,
        viewer: HTMLDivElement,
    ): Promise<PDFViewerType> {
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
}
