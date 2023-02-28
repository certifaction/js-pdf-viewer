<template>
    <div class="pdf-viewer">
        <div class="viewer-container" ref="viewerContainer">
            <div class="viewer"></div>
        </div>
        <div v-if="newControlsEnabled" class="controls-new" ref="viewerControls">
            <div class="pages">
                <span class="current">{{ currentPage }}</span> {{ _$t('pdfViewer.pageOf') }} <span class="total">{{ pageCount }}</span>
            </div>
            <div class="scale">
                <div class="scale-button" @click="pageFit">
                    <MDIcon :icon="mdiCropFree"/>
                </div>
                <div class="scale-button" @click="decreaseScale">
                    <MDIcon :icon="mdiMinus"/>
                </div>
                <div class="scale-button" @click="increaseScale">
                    <MDIcon :icon="mdiPlus"/>
                </div>
            </div>
        </div>
        <div v-else class="controls">
            <div class="pages">
                {{ _$t('pdfViewer.page') }}
                <span class="current">{{ currentPage }}</span> / <span class="total">{{ pageCount }}</span>
            </div>
            <div class="scale">
                <button type="button" class="btn" @click="pageFit">
                    <MDIcon :icon="mdiCropFree"/>
                </button>
                <button type="button" class="btn" @click="decreaseScale">
                    <MDIcon :icon="mdiMinus"/>
                </button>
                <button type="button" class="btn" @click="increaseScale">
                    <MDIcon :icon="mdiPlus"/>
                </button>
                <select class="scale-selector" v-model="currentScale">
                    <option v-for="option in scaleOptions"
                            :key="option.value"
                            :value="option.value">{{ option.label }}
                    </option>
                    <option :value="customScale.value" disabled class="hidden">{{ customScale.label }}</option>
                </select>
            </div>
            <button v-if="allowDocumentDownload" type="button" class="btn download-button" @click="downloadDocument">
                <MDIcon :icon="mdiDownload"/>
            </button>
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
        newControlsEnabled: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    data() {
        return {
            mdiMinus,
            mdiPlus,
            mdiDownload,
            mdiCropFree,
            pdfViewer: null,
            pdfDocument: null,
            scaleOptions: [
                { label: this._$t('pdfViewer.scale.auto'), value: 'auto' },
                { label: this._$t('pdfViewer.scale.pageActual'), value: 'page-actual' },
                { label: this._$t('pdfViewer.scale.pageFit'), value: 'page-fit' },
                { label: this._$t('pdfViewer.scale.pageWidth'), value: 'page-width' },
                { label: '50%', value: 0.5 },
                { label: '75%', value: 0.75 },
                { label: '100%', value: 1 },
                { label: '125%', value: 1.25 },
                { label: '150%', value: 1.5 },
                { label: '200%', value: 2 },
                { label: '300%', value: 3 },
                { label: '400%', value: 4 }
            ],
            currentScale: null,
            customScale: { label: '', value: 0 }
        }
    },
    computed: {
        currentPage() {
            return (this.pdfViewer) ? this.pdfViewer.currentPageNumber : 0
        },
        pageCount() {
            return (this.pdfDocument) ? this.pdfDocument.numPages : 0
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
        updateCustomScale() {
            if (!this.scaleOptions.find(option => option.value === this.currentScale)) {
                this.customScale.label = (this.currentScale * 100).toFixed(0) + '%'
                this.customScale.value = this.currentScale
            }
        },
        async downloadDocument() {
            if (!this.allowDocumentDownload) {
                return
            }
            const index = this.documentName.lastIndexOf('.pdf')
            const editedDocumentName = this.documentName.substring(0, index) + '_PREVIEW' + this.documentName.substring(index)
            if (this.source instanceof Uint8Array) {
                this.pdfViewer.downloadManager.downloadData(this.source, editedDocumentName)
            } else {
                if (/^blob:/.test(this.source)) {
                    const response = await fetch(this.source)
                    if (response.status === 200) {
                        const blob = await response.blob()
                        this.pdfViewer.downloadManager.download(blob, this.source, editedDocumentName)
                    } else {
                        throw new Error('PDFViewer: Fetching blob url failed.')
                    }
                } else {
                    this.pdfViewer.downloadManager.downloadUrl(this.source, editedDocumentName)
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
                docOptions.data = this.source
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
