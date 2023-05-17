<script setup>
import { onMounted, ref, watch, computed, toRaw } from 'vue'
import { mdiMinus, mdiPlus, mdiCropFree } from '@mdi/js'
import { pdfjsLib } from '@certifaction/pdfjs'
import pdfjsViewer from '../pdf/pdf_viewer'
import MDIcon from './MDIcon.vue'

const MIN_SCALE = 0.1
const MAX_SCALE = 10

// Props
const props = defineProps({
    pdfjsWorkerSrc: {
        type: String, required: false
    },
    pdfjsWorkerInstance: {
        type: Worker, required: false
    },
    pdfjsCMapUrl: {
        type: String, required: true
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
    pdfViewer: null,
    pdfDocument: null,
    currentScale: null
})

// Template refs
const viewerControls = ref(null)
const viewerContainer = ref(null)

// Computed
const currentPage = computed(() => state.value.pdfViewer ? state.value.pdfViewer.currentPageNumber : 0)
const pageCount = computed(() => state.value.pdfDocument ? state.value.pdfDocument.numPages : 0)
const showPageFitButton = computed(() => state.value.currentScale !== 'page-fit')

if (props.pdfjsWorkerInstance) {
    pdfjsLib.GlobalWorkerOptions.workerPort = props.pdfjsWorkerInstance
} else if (props.pdfjsWorkerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = props.pdfjsWorkerSrc
} else {
    throw new Error('PDFViewer: pdfjsWorkerSrc or pdfjsWorkerInstance needs to be defined.')
}

function pageFit() {
    toRaw(state.value.pdfViewer).currentScaleValue = state.value.currentScale = 'page-fit'
}

function decreaseScale() {
    let newScale = state.value.pdfViewer.currentScale
    newScale -= 0.1
    newScale = newScale.toFixed(2)
    newScale = Math.floor(newScale * 10) / 10

    state.value.currentScale = (newScale < MIN_SCALE) ? MIN_SCALE : newScale
}

function increaseScale() {
    let newScale = state.value.pdfViewer.currentScale
    newScale += 0.1
    newScale = newScale.toFixed(2)
    newScale = Math.ceil(newScale * 10) / 10

    state.value.currentScale = (newScale > MAX_SCALE) ? MAX_SCALE : newScale
}

// Watchers
watch(() => state.value.currentScale, (newCurrentScale, oldCurrentScale) => {
    if (oldCurrentScale) {
        toRaw(state.value.pdfViewer).currentScaleValue = state.value.currentScale
        const event = new CustomEvent('PDFViewer:scaleChange', { detail: toRaw(state.value.pdfViewer).currentScale })
        window.dispatchEvent(event)
    }
})

onMounted(async () => {
    try {
        const eventBus = new pdfjsViewer.EventBus()
        state.value.pdfViewer = new pdfjsViewer.PDFViewer({
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
        state.value.pdfDocument = await documentLoadingTask.promise

        const event = new Event('PDFViewer:documentLoaded')
        window.dispatchEvent(event)

        eventBus.on('pagesloaded', () => {
            toRaw(state.value.pdfViewer).currentScaleValue = state.value.currentScale = props.defaultScale

            const event = new Event('PDFViewer:pagesLoaded')
            window.dispatchEvent(event)

            const scrollbarWidth = viewerContainer.value.offsetWidth - viewerContainer.value.clientWidth
            viewerControls.value.style.width = `calc(100% - ${scrollbarWidth}px)`
        })

        toRaw(state.value.pdfViewer).setDocument(toRaw(state.value.pdfDocument))
    } catch (error) {
        emit('error', error)
        throw error
    }
})
</script>

<template>
    <div class="pdf-viewer">
        <div class="viewer-container" ref="viewerContainer">
            <div class="viewer"></div>
        </div>
        <div class="controls" ref="viewerControls">
            <div class="pages">
                <span class="current">{{ currentPage }}</span> {{ $t('pdfViewer.pageOf') }} <span class="total">{{ pageCount }}</span>
            </div>
            <div class="actions">
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
