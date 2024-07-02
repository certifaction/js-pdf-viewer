<script lang="ts">
import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { type PDFDocumentProxy } from 'pdfjs-dist'
import { type PDFViewer, type PDFPageView, type PDFViewerOptions } from 'pdfjs-dist/web/pdf_viewer.mjs'
import {
    type PageChangeEvent,
    type PagesLoadedEvent,
    PdfJsHelper,
    Scale,
    type ScaleChangeEvent,
} from '../pdf/PdfJsHelper'

export interface PdfViewerProps {
    source: string | Uint8Array | PDFDocumentProxy | undefined
    translate: (key: string) => string
    defaultScale?: Scale | number
    pdfjsViewerOptions?: Omit<PDFViewerOptions, 'container' | 'eventBus'>
    pdfjsCMapUrl: string
}

interface PdfViewerState {
    pagesCount: number
    currentPage: number
    showPageFitButton: boolean
}
</script>

<script lang="ts" setup>
import { iconPlus, iconFit, iconMinus } from '../icons'
import CIcon from './CIcon.vue'

const props = withDefaults(defineProps<PdfViewerProps>(), {
    defaultScale: Scale.Auto,
    pdfjsViewerOptions: () => ({}),
})
const emit = defineEmits<{
    documentLoaded: []
    pagesLoaded: [pages: PDFPageView[]]
    scaleChange: [currentScale: number]
    error: [error: unknown]
}>()

const state = ref<PdfViewerState>({
    pagesCount: 1,
    currentPage: 1,
    showPageFitButton: false,
})

const viewerContainer = ref<HTMLDivElement | null>(null)
const viewer = ref<HTMLDivElement | null>(null)
const viewerControls = ref<HTMLDivElement | null>(null)

const pdfJsHelper = PdfJsHelper.getInstance(props.pdfjsCMapUrl)
let pdfViewer: PDFViewer

const pageFit = (): void => {
    pdfViewer.currentScaleValue = Scale.PageFit
}

const decreaseScale = (): void => {
    pdfViewer.decreaseScale()
}

const increaseScale = (): void => {
    pdfViewer.increaseScale()
}

const handlePagesLoaded = (pagesLoadedEvent: PagesLoadedEvent) => {
    pdfViewer.currentScaleValue = props.defaultScale.toString()
    state.value.pagesCount = pagesLoadedEvent.pagesCount

    if (viewerContainer.value && viewerControls.value) {
        const scrollbarWidth = viewerContainer.value.offsetWidth - viewerContainer.value.clientWidth
        viewerControls.value.style.width = `calc(100% - ${scrollbarWidth}px)`
    }

    if (pagesLoadedEvent.source._pages) {
        emit('pagesLoaded', pagesLoadedEvent.source._pages)
    }
}

const handlePageChanging = (pageChangingEvent: PageChangeEvent) => {
    state.value.currentPage = pageChangingEvent.pageNumber
}

const handleScaleChanging = (scaleChangingEvent: ScaleChangeEvent) => {
    state.value.showPageFitButton = scaleChangingEvent.presetValue !== Scale.PageFit

    emit('scaleChange', pdfViewer.currentScale)
}

watchEffect(async () => {
    if (!props.source || !pdfViewer) {
        return
    }

    if (props.source instanceof Uint8Array || typeof props.source === 'string') {
        const pdfDocument = await pdfJsHelper.loadDocument(props.source)
        pdfViewer.setDocument(pdfDocument)
    } else {
        pdfViewer.setDocument(props.source)
    }

    emit('documentLoaded')
})

onMounted(async () => {
    try {
        if (!viewerContainer.value || !viewer.value || !viewerControls.value) {
            throw new Error('Viewer container elements are not available')
        }

        pdfViewer = await pdfJsHelper.createPdfViewer(props.pdfjsViewerOptions, viewerContainer.value, viewer.value)

        pdfViewer.eventBus.on('pagesloaded', handlePagesLoaded)
        pdfViewer.eventBus.on('pagechanging', handlePageChanging)
        pdfViewer.eventBus.on('scalechanging', handleScaleChanging)
    } catch (error: unknown) {
        console.error('Error while mounting PDFViewer', error)
        emit('error', error)
    }
})

onUnmounted(() => {
    if (pdfViewer) {
        pdfViewer.eventBus.off('pagesloaded', handlePagesLoaded)
        pdfViewer.eventBus.off('pagechanging', handlePageChanging)
        pdfViewer.eventBus.off('scalechanging', handleScaleChanging)
        pdfViewer.cleanup()
    }
})
</script>

<template>
    <div class="pdf-viewer">
        <slot name="before-viewer-container" />
        <div ref="viewerContainer" class="viewer-container">
            <slot name="before-viewer" />
            <div ref="viewer" class="pdfViewer" />
            <slot name="after-viewer" />
        </div>
        <slot name="after-viewer-container" />

        <div ref="viewerControls" class="controls">
            <div class="pages">
                {{ props.translate('page') }}
                <span class="current">{{ state.currentPage }}</span>
                {{ props.translate('pageOf') }}
                <span class="total">{{ state.pagesCount }}</span>
            </div>

            <div class="actions">
                <div class="scale">
                    <div v-if="state.showPageFitButton" class="action-button" @click="pageFit">
                        <CIcon :icon="iconFit" />
                    </div>
                    <div class="action-button" @click="decreaseScale">
                        <CIcon :icon="iconMinus" />
                    </div>
                    <div class="action-button" @click="increaseScale">
                        <CIcon :icon="iconPlus" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@use 'pdfjs-dist/web/pdf_viewer';

.pdf-viewer {
    --pdfviewer-color-controls-font: var(--c-color-grey-600);
    --pdfviewer-color-controls-background: var(--c-color-grey-200);
    position: relative;

    .viewer-container {
        position: absolute;
        overflow: auto;
        width: 100%;
        height: 100%;
        background-color: var(--c-color-grey-50);

        .pdfViewer {
            position: relative;

            .page {
                box-sizing: content-box;

                .canvasWrapper {
                    box-shadow: var(--c-drop-shadow);
                }
            }
        }
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: absolute;
        z-index: 100;
        top: 1rem;
        width: 100%;
        padding: 0 1.5rem;

        .pages {
            border-radius: 0.5rem;
            padding: 0.5rem;
            background: var(--pdfviewer-color-controls-background);
            color: var(--pdfviewer-color-controls-font);
            font-size: 0.75rem;
            font-weight: 600;
            line-height: 1.5;
        }

        .actions {
            display: flex;

            .action-button {
                position: relative;
                cursor: pointer;
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                padding: 0.5rem;
                background: var(--pdfviewer-color-controls-background);
                color: var(--pdfviewer-color-controls-font);

                .c-icon {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    width: 1.25rem;
                    margin: auto;
                }
            }

            .download {
                padding-right: 0.5rem;
            }

            .scale {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
        }
    }
}
</style>
