<script setup>
import { onMounted, ref } from 'vue'
import { mdiMinus, mdiPlus, mdiCropFree } from '@mdi/js'
import { pdfjsLib } from '@certifaction/pdfjs'
import pdfjsViewer from '../pdf/pdf_viewer'
import MDIcon from './MDIcon.vue'

const MIN_SCALE = 0.1
const MAX_SCALE = 10

// Props
const props = defineProps({
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
    }
})

// Events
const emit = defineEmits(['error'])

// Reactive data
const state = ref({
    pagesCount: 1,
    currentPage: 1,
    showPageFitButton: false
})

// Template refs
const viewerControls = ref(null)
const viewerContainer = ref(null)

// Non-reactive data
let pdfViewer = null
let pdfDocument = null

if (props.pdfjsWorkerInstance) {
    pdfjsLib.GlobalWorkerOptions.workerPort = props.pdfjsWorkerInstance
} else if (props.pdfjsWorkerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = props.pdfjsWorkerSrc
} else {
    throw new Error('PDFViewer: pdfjsWorkerSrc or pdfjsWorkerInstance needs to be defined.')
}

const pageFit = () => {
    pdfViewer.currentScaleValue = 'page-fit'
}

const decreaseScale = () =>  {
    let newScale = pdfViewer.currentScale
    newScale -= 0.1
    newScale = newScale.toFixed(2)
    newScale = Math.floor(newScale * 10) / 10

    pdfViewer.currentScaleValue = (newScale < MIN_SCALE) ? MIN_SCALE : newScale
}

const increaseScale = () =>  {
    let newScale = pdfViewer.currentScale
    newScale += 0.1
    newScale = newScale.toFixed(2)
    newScale = Math.ceil(newScale * 10) / 10

    pdfViewer.currentScaleValue = (newScale > MAX_SCALE) ? MAX_SCALE : newScale
}

onMounted(async () => {
    try {
        const eventBus = new pdfjsViewer.EventBus()
        pdfViewer = new pdfjsViewer.PDFViewer({
            ...props.pdfjsViewerOptions,
            container: viewerContainer.value,
            eventBus
        })

        const docOptions = {
            cMapUrl: props.pdfjsCMapUrl,
            cMapPacked: true
        }

        if (props.source instanceof Uint8Array) {
            docOptions.data = new Uint8Array(props.source)
        } else {
            docOptions.url = props.source
        }

        const documentLoadingTask = pdfjsLib.getDocument(docOptions)
        pdfDocument = await documentLoadingTask.promise

        const event = new Event('PDFViewer:documentLoaded')
        window.dispatchEvent(event)

        eventBus.on('pagesloaded', (pagesLoadedEvent) => {
            pdfViewer.currentScaleValue = props.defaultScale
            state.value.pagesCount = pagesLoadedEvent.pagesCount

            const event = new Event('PDFViewer:pagesLoaded')
            window.dispatchEvent(event)

            const scrollbarWidth = viewerContainer.value.offsetWidth - viewerContainer.value.clientWidth
            viewerControls.value.style.width = `calc(100% - ${scrollbarWidth}px)`
        })

        eventBus.on('pagechanging', function(pageChangingEvent) {
            state.value.currentPage = pageChangingEvent.pageNumber
        })

        eventBus.on('scalechanging', function(scaleChangingEvent) {
            state.value.showPageFitButton = scaleChangingEvent.presetValue !== 'page-fit'
            const event = new CustomEvent('PDFViewer:scaleChange', { detail: pdfViewer.currentScale })
            window.dispatchEvent(event)
        })

        pdfViewer.setDocument(pdfDocument)
    } catch (error) {
        emit('error', error)
        throw error
    }
})
</script>

<template>
    <div class="pdf-viewer">
        <div class="viewer-container" ref="viewerContainer">
            <div class="viewer" />
        </div>
        <div class="controls" ref="viewerControls">
            <div class="pages">
                <span class="current">{{ state.currentPage }}</span> {{ $t('pdfViewer.pageOf') }} <span class="total">{{ state.pagesCount }}</span>
            </div>
            <div class="actions">
                <div class="scale">
                    <div v-if="state.showPageFitButton" class="action-button" @click="pageFit">
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
