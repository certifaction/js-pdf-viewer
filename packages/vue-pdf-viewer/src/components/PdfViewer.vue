<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef, watchEffect } from 'vue'
import {
    type PageChangeEvent,
    type PagesLoadedEvent,
    PdfJsHelper,
    Scale,
    type ScaleChangeEvent,
} from '../pdf/PdfJsHelper'
import { iconPlus, iconFit, iconMinus } from '../icons'
import CIcon from './CIcon.vue'
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/pdf'
import type { PDFViewerOptions } from 'pdfjs-dist/types/web/pdf_viewer'
import type { PDFPageView, PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer.component'

interface PropsBase {
    source: string | Uint8Array | PDFDocumentProxy | undefined
    translate: (key: string) => string
    defaultScale?: Scale | number
    pdfjsViewerOptions?: Omit<PDFViewerOptions, 'container' | 'eventBus'>
}

interface PropsWithHelper {
    parentPdfJsHelper: PdfJsHelper
    pdfjsCMapUrl?: never
    pdfjsIccUrl?: never
    pdfjsWasmUrl?: never
}

interface PropsWithoutHelper {
    parentPdfJsHelper?: never
    pdfjsCMapUrl: string
    pdfjsIccUrl: string
    pdfjsWasmUrl: string
}

type Props = PropsBase & (PropsWithHelper | PropsWithoutHelper)

interface State {
    pagesCount: number
    currentPage: number
    showPageFitButton: boolean
}

const props = withDefaults(defineProps<Props>(), {
    defaultScale: Scale.Auto,
    pdfjsViewerOptions: () => ({}),
})

const emit = defineEmits<{
    documentLoaded: []
    pagesLoaded: [pages: PDFPageView[]]
    scaleChange: [currentScale: number]
    error: [error: unknown]
}>()

const state = ref<State>({
    pagesCount: 0,
    currentPage: 1,
    showPageFitButton: false,
})

const viewerContainer = useTemplateRef<HTMLDivElement>('viewerContainer')
const viewer = useTemplateRef<HTMLDivElement>('viewer')
const viewerControls = useTemplateRef<HTMLDivElement>('viewerControls')

const pdfJsHelper =
    props.parentPdfJsHelper ?? new PdfJsHelper(props.pdfjsCMapUrl, props.pdfjsIccUrl, props.pdfjsWasmUrl)
let pdfViewer: PDFViewer | undefined
let pdfDocument: PDFDocumentProxy | undefined

const pageFit = (): void => {
    if (pdfViewer) {
        pdfViewer.currentScaleValue = Scale.PageFit
    }
}

const decreaseScale = (): void => {
    pdfViewer?.decreaseScale()
}

const increaseScale = (): void => {
    pdfViewer?.increaseScale()
}

const handlePagesInit = async () => {
    if (!pdfViewer) {
        return
    }

    pdfViewer.currentScaleValue = props.defaultScale.toString()

    if (pdfDocument && props.pdfjsViewerOptions.annotationMode === 2) {
        const hasForm = await pdfJsHelper.hasForm(pdfDocument)
        if (hasForm) {
            // TODO: Implement prepare required form fields
        }
    }
}

const handlePagesLoaded = (pagesLoadedEvent: PagesLoadedEvent) => {
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

    if (pdfViewer) {
        emit('scaleChange', pdfViewer.currentScale)
    }
}

const loadDocument = async (source: string | Uint8Array | PDFDocumentProxy) => {
    if (source instanceof Uint8Array || typeof source === 'string') {
        pdfDocument = await pdfJsHelper.loadDocument(source)
    } else {
        pdfDocument = source
    }

    pdfViewer?.setDocument(pdfDocument)

    emit('documentLoaded')
}

watchEffect(async () => {
    if (!props.source || !pdfViewer) {
        return
    }

    await loadDocument(props.source)
})

onMounted(async () => {
    try {
        if (!viewerContainer.value || !viewer.value || !viewerControls.value) {
            throw new Error('Viewer container elements are not available')
        }

        pdfViewer = await pdfJsHelper.createPdfViewer(props.pdfjsViewerOptions, viewerContainer.value, viewer.value)

        pdfViewer.eventBus.on('pagesinit', handlePagesInit)
        pdfViewer.eventBus.on('pagesloaded', handlePagesLoaded)
        pdfViewer.eventBus.on('pagechanging', handlePageChanging)
        pdfViewer.eventBus.on('scalechanging', handleScaleChanging)

        if (props.source) {
            await loadDocument(props.source)
        }
    } catch (error: unknown) {
        console.error('Error while mounting PDFViewer', error)
        emit('error', error)
    }
})

onUnmounted(() => {
    if (pdfViewer) {
        pdfViewer.eventBus.off('pagesinit', handlePagesInit)
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
@import 'pdfjs-dist/web/pdf_viewer.css';

.pdf-viewer {
    --page-border: 0.5rem solid transparent;
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
