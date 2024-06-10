<template>
    <div class="pdf-viewer">
        <slot name="before-viewer-container" />
        <div class="viewer-container" ref="viewerContainer">
            <slot name="before-viewer" />
            <div class="pdfViewer" ref="viewer" />
            <slot name="after-viewer" />
        </div>
        <slot name="after-viewer-container" />
        <div class="controls" ref="viewerControls">
            <div class="pages">
                {{ _$t('pdfViewer.page') }}
                <span class="current">{{ currentPage }}</span>
                {{ _$t('pdfViewer.pageOf') }}
                <span class="total">{{ pageCount }}</span>
            </div>
            <div class="actions">
                <div v-if="allowDocumentDownload" class="download">
                    <div class="action-button" @click="downloadDocument">
                        <MDIcon :icon="mdiDownload" />
                    </div>
                </div>
                <div class="scale">
                    <div v-if="showPageFitButton" class="action-button" @click="pageFit">
                        <MDIcon :icon="mdiCropFree" />
                    </div>
                    <div class="action-button" @click="decreaseScale">
                        <MDIcon :icon="mdiMinus" />
                    </div>
                    <div class="action-button" @click="increaseScale">
                        <MDIcon :icon="mdiPlus" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mdiCropFree, mdiDownload, mdiMinus, mdiPlus } from '@mdi/js'
import i18nWrapperMixin from '../mixins/i18n-wrapper'
import MDIcon from './MDIcon.vue'

let useLegacyPdfJsBuild = false
if (typeof Promise.withResolvers !== 'function') {
    useLegacyPdfJsBuild = true
}

const MIN_SCALE = 0.1
const MAX_SCALE = 10

export default {
    name: 'PDFViewer',
    mixins: [i18nWrapperMixin],
    components: {
        MDIcon,
    },
    props: {
        pdfjsCMapUrl: {
            type: String,
            required: true,
        },
        source: {
            required: true,
            validator: (value) => {
                return !!value && (typeof value === 'string' || value instanceof Uint8Array)
            },
        },
        pdfjsViewerOptions: {
            type: Object,
            default: function () {
                return {}
            },
        },
        defaultScale: {
            required: false,
            validator: (value) => {
                if (typeof value === 'string') {
                    return !!value && ['auto', 'page-actual', 'page-fit', 'page-width'].includes(value)
                } else {
                    return !!value && typeof value === 'number'
                }
            },
            default: 'auto',
        },
        documentName: {
            type: String,
            required: false,
            default: 'pdf-viewer-document.pdf',
        },
        allowDocumentDownload: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    data() {
        return {
            mdiMinus,
            mdiPlus,
            mdiDownload,
            mdiCropFree,
            pdfViewer: null,
            pdfDocument: null,
            currentScale: null,
        }
    },
    computed: {
        currentPage() {
            return this.pdfViewer ? this.pdfViewer.currentPageNumber : 0
        },
        pageCount() {
            return this.pdfDocument ? this.pdfDocument.numPages : 0
        },
        showPageFitButton() {
            return this.currentScale !== 'page-fit'
        },
    },
    watch: {
        currentScale(newVal, oldVal) {
            if (oldVal) {
                this.pdfViewer.currentScaleValue = this.currentScale
                const event = new CustomEvent('PDFViewer:scaleChange', { detail: this.pdfViewer.currentScale })
                window.dispatchEvent(event)
            }
        },
    },
    methods: {
        pageFit() {
            this.pdfViewer.currentScaleValue = this.currentScale = 'page-fit'
        },
        decreaseScale() {
            let newScale = this.pdfViewer.currentScale
            newScale -= 0.1
            newScale = newScale.toFixed(2)
            newScale = Math.floor(newScale * 10) / 10

            this.currentScale = newScale < MIN_SCALE ? MIN_SCALE : newScale
        },
        increaseScale() {
            let newScale = this.pdfViewer.currentScale
            newScale += 0.1
            newScale = newScale.toFixed(2)
            newScale = Math.ceil(newScale * 10) / 10

            this.currentScale = newScale > MAX_SCALE ? MAX_SCALE : newScale
        },
        async downloadDocument() {
            if (!this.allowDocumentDownload) {
                return
            }
            if (this.source instanceof Uint8Array) {
                this.pdfViewer.downloadManager.downloadData(this.source, this.documentName)
            } else {
                if (/^blob:/.test(this.source)) {
                    const response = await fetch(this.source)
                    if (response.status === 200) {
                        const blob = await response.blob()
                        this.pdfViewer.downloadManager.download(blob, this.source, this.documentName)
                    } else {
                        throw new Error('PDFViewer: Fetching blob url failed.')
                    }
                } else {
                    this.pdfViewer.downloadManager.downloadUrl(this.source, this.documentName)
                }
            }
        },
        async getPdfData() {
            return await this.pdfDocument.saveDocument()
        },
        async hasForm() {
            const formFields = await this.pdfDocument.getFieldObjects()
            const metadata = await this.pdfDocument.getMetadata()

            // Check if there are fields and if some are not signatures
            return (
                metadata?.info?.IsAcroFormPresent &&
                Object.values(formFields ?? {}).some((arr) => arr.some((field) => field.type !== 'signature'))
            )
        },
        async formValuesHaveChanged() {
            if (!this.hasForm || this.pdfDocument === undefined) return false
            const currentFormValues = await this.pdfDocument.annotationStorage.getAll()
            return currentFormValues !== null
        },
    },
    async created() {
        if (useLegacyPdfJsBuild) {
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
    },
    async mounted() {
        try {
            const { getDocument } = useLegacyPdfJsBuild
                ? await import('pdfjs-dist/legacy/build/pdf.mjs')
                : await import('pdfjs-dist')
            const { EventBus, DownloadManager, PDFViewer } = useLegacyPdfJsBuild
                ? await import('pdfjs-dist/legacy/web/pdf_viewer.mjs')
                : await import('pdfjs-dist/web/pdf_viewer.mjs')

            const eventBus = new EventBus()
            const downloadManager = new DownloadManager()
            this.pdfViewer = new PDFViewer({
                ...this.pdfjsViewerOptions,
                container: this.$refs.viewerContainer,
                viewer: this.$refs.viewer,
                eventBus,
                downloadManager,
            })

            const docOptions = {
                cMapUrl: this.pdfjsCMapUrl,
                cMapPacked: true,
            }

            if (this.source instanceof Uint8Array) {
                docOptions.data = new Uint8Array(this.source)
            } else {
                docOptions.url = this.source
            }

            const documentLoadingTask = getDocument(docOptions)
            this.pdfDocument = await documentLoadingTask.promise

            const event = new Event('PDFViewer:documentLoaded')
            window.dispatchEvent(event)

            eventBus.on('pagesloaded', () => {
                this.pdfViewer.currentScaleValue = this.currentScale = this.defaultScale

                const event = new Event('PDFViewer:pagesLoaded')
                window.dispatchEvent(event)

                const scrollbarWidth = this.$refs.viewerContainer.offsetWidth - this.$refs.viewerContainer.clientWidth
                this.$refs.viewerControls.style.width = `calc(100% - ${scrollbarWidth}px)`
            })

            this.pdfViewer.setDocument(this.pdfDocument)
        } catch (error) {
            this.$emit('error', error)
            throw error
        }
    },
}
</script>
