<template>
    <div class="pdf-viewer">
        <div class="viewer-container" ref="viewerContainer">
            <div class="viewer"></div>
        </div>
        <div class="controls">
            <div class="pages">
                {{ _$t('pdfViewer.page') }}
                <span class="current">{{ currentPage }}</span> / <span class="total">{{ pageCount }}</span>
            </div>
            <div class="scale">
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
        </div>
    </div>
</template>

<script>
import { mdiMinus, mdiPlus } from '@mdi/js'
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
                return !!value && (typeof value === 'string' || value.constructor === Uint8Array)
            }
        },
        pdfjsViewerOptions: {
            type: Object,
            default: function() {
                return {}
            }
        }
    },
    data() {
        return {
            mdiMinus,
            mdiPlus,
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
            currentScale: 'auto',
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
        currentScale() {
            this.pdfViewer.currentScaleValue = this.currentScale
        }
    },
    methods: {
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
        const eventBus = new pdfjsViewer.EventBus()
        this.pdfViewer = new pdfjsViewer.PDFViewer({
            ...this.pdfjsViewerOptions,
            container: this.$refs.viewerContainer,
            eventBus
        })

        eventBus.on('pagesinit', () => {
            this.pdfViewer.currentScaleValue = this.currentScale
        })

        const docOptions = {
            cMapUrl: this.pdfjsCMapUrl,
            cMapPacked: true
        }

        if (this.source.constructor === Uint8Array) {
            docOptions.data = this.source
        } else {
            docOptions.url = this.source
        }

        const documentLoadingTask = pdfjsLib.getDocument(docOptions)
        this.pdfDocument = await documentLoadingTask.promise

        eventBus.on('documentloaded', function() {
            const event = document.createEvent('Event')
            event.initEvent('PDFViewer:documentLoaded', true, true)
            window.dispatchEvent(event)
        })

        eventBus.on('pagesloaded', function() {
            const event = document.createEvent('Event')
            event.initEvent('PDFViewer:pagesLoaded', true, true)
            window.dispatchEvent(event)
        })

        this.pdfViewer.setDocument(this.pdfDocument)
    }
}
</script>
