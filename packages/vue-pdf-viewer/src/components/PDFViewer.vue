<template>
    <div class="pdf-viewer">
        <div class="viewer-container" ref="viewerContainer">
            <div class="viewer"></div>
        </div>
        <div class="controls">
            <div class="pages">
                {{ _$t('verification.digitalTwin.pdfViewer.page') }}
                <span class="current">{{ currentPage }}</span> / <span class="total">{{ pageCount }}</span>
            </div>
            <div class="scale">
                <button type="button" class="btn secondary" @click="decreaseScale">
                    <MDIcon :icon="mdiMinus"/>
                </button>
                <button type="button" class="btn secondary" @click="increaseScale">
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
// import pdfjsLib from '@certifaction/vue-pdf-viewer/dist/pdf/pdf.js'
import pdfjsViewer from '../pdf/pdf_viewer'
import i18nWrapperMixin from '../mixins/i18n-wrapper'
import MDIcon from './MDIcon.vue'

console.log(pdfjsViewer)

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
        url: String,
        cmapUrl: String
    },
    // inject: ['pdfjsWorkerSrc', 'pdfjsCMapUrl'],
    data() {
        return {
            mdiMinus,
            mdiPlus,
            pdfViewer: null,
            pdfDocument: null,
            scaleOptions: [
                { label: this._$t('verification.digitalTwin.pdfViewer.scale.auto'), value: 'auto' },
                { label: this._$t('verification.digitalTwin.pdfViewer.scale.pageActual'), value: 'page-actual' },
                { label: this._$t('verification.digitalTwin.pdfViewer.scale.pageFit'), value: 'page-fit' },
                { label: this._$t('verification.digitalTwin.pdfViewer.scale.pageWidth'), value: 'page-width' },
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
        // pdfjsLib.GlobalWorkerOptions.workerSrc = this.pdfjsWorkerSrc
    },
    async mounted() {
        const eventBus = new pdfjsViewer.EventBus()
        this.pdfViewer = new pdfjsViewer.PDFViewer({
            container: this.$refs.viewerContainer,
            eventBus
        })

        eventBus.on('pagesinit', () => {
            this.pdfViewer.currentScaleValue = this.currentScale
        })

        // const documentLoadingTask = pdfjsLib.getDocument({
        //     url: this.url,
        //     cMapUrl: this.pdfjsCMapUrl,
        //     cMapPacked: true
        // })
        // this.pdfDocument = await documentLoadingTask.promise
        //
        // this.pdfViewer.setDocument(this.pdfDocument)
    }
}
</script>
