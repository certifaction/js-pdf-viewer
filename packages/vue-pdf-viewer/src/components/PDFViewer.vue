<template>
    <div class="pdf-viewer">
        <div class="viewer-container" ref="viewerContainer">
            <div class="viewer"></div>
        </div>
        <div class="controls" ref="viewerControls">
            <div class="pages">
                <span class="current">{{ currentPage }}</span> {{ _$t('pdfViewer.pageOf') }} <span class="total">{{ pageCount }}</span>
            </div>
            <div class="actions">
                <div v-if="allowDocumentDownload" class="download">
                    <div class="action-button" @click="downloadDocument">
                        <MDIcon :icon="mdiDownload"/>
                    </div>
                </div>
                <div class="scale">
                    <div v-if="showPageFitButton" class="action-button" @click="pageFit">
                        <MDIcon :icon="mdiCropFree"/>
                    </div>
                    <div class="action-button" @click="decreaseScale">
                        <MDIcon :icon="mdiMinus"/>
                    </div>
                    <div class="action-button" @click="increaseScale">
                        <MDIcon :icon="mdiPlus"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mdiMinus, mdiPlus, mdiDownload, mdiCropFree } from '@mdi/js'
import { pdfjsLib } from '@certifaction/pdfjs'
import pdfjsViewer from '../pdf/pdf_viewer'
import i18nWrapperMixin from '../mixins/i18n-wrapper'
import MDIcon from './MDIcon.vue'

const MIN_SCALE = 0.1
const MAX_SCALE = 10

export default {
    name: 'PDFViewer',
    mixins: [
        i18nWrapperMixin
    ],
    components: {
        MDIcon
    },
    props: {
        pdfjsWorkerSrc: {
            type: String,
            required: false
        },
        pdfjsWorkerInstance: {
            type: Worker,
            required: false
        },
        pdfjsCMapUrl: {
            type: String,
            required: true
        },
        source: {
            required: true,
            validator: (value) => {
                return !!value && (typeof value === 'string' || value instanceof Uint8Array)
            }
        },
        pdfjsViewerOptions: {
            type: Object,
            default: function() {
                return {}
            }
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
            default: 'auto'
        },
        documentName: {
            type: String,
            required: false,
            default: 'pdf-viewer-document.pdf'
        },
        allowDocumentDownload: {
            type: Boolean,
            required: false,
            default: false
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
            return (this.pdfViewer) ? this.pdfViewer.currentPageNumber : 0
        },
        pageCount() {
            return (this.pdfDocument) ? this.pdfDocument.numPages : 0
        },
        showPageFitButton() {
            return this.currentScale !== 'page-fit'
        }
    },
    watch: {
        currentScale(newVal, oldVal) {
            if (oldVal) {
                this.pdfViewer.currentScaleValue = this.currentScale
                const event = new CustomEvent('PDFViewer:scaleChange', { detail: this.pdfViewer.currentScale })
                window.dispatchEvent(event)
            }
        }
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

            this.currentScale = (newScale < MIN_SCALE) ? MIN_SCALE : newScale
            this.updateCustomScale()
        },
        increaseScale() {
            let newScale = this.pdfViewer.currentScale
            newScale += 0.1
            newScale = newScale.toFixed(2)
            newScale = Math.ceil(newScale * 10) / 10

            this.currentScale = (newScale > MAX_SCALE) ? MAX_SCALE : newScale
            this.updateCustomScale()
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
        }
    },
    created() {
        if (this.pdfjsWorkerInstance) {
            pdfjsLib.GlobalWorkerOptions.workerPort = this.pdfjsWorkerInstance
        } else if (this.pdfjsWorkerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = this.pdfjsWorkerSrc
        } else {
            throw new Error('PDFViewer: pdfjsWorkerSrc or pdfjsWorkerInstance needs to be defined.')
        }
    },
    async mounted() {
        try {
            const eventBus = new pdfjsViewer.EventBus()
            const downloadManager = new pdfjsViewer.DownloadManager()
            this.pdfViewer = new pdfjsViewer.PDFViewer({
                ...this.pdfjsViewerOptions,
                container: this.$refs.viewerContainer,
                eventBus,
                downloadManager
            })

            const docOptions = {
                cMapUrl: this.pdfjsCMapUrl,
                cMapPacked: true
            }

            if (this.source instanceof Uint8Array) {
                docOptions.data = new Uint8Array(this.source)
            } else {
                docOptions.url = this.source
            }

            const documentLoadingTask = pdfjsLib.getDocument(docOptions)
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
    }
}
</script>
