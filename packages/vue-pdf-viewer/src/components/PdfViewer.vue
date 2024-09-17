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
                <span class="total">{{ pagesCount }}</span>
            </div>
            <div class="actions">
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
import { mdiCropFree, mdiMinus, mdiPlus } from '@mdi/js'
import i18nWrapperMixin from '../mixins/i18n-wrapper'
import { PdfJsHelper } from '../pdf/PdfJsHelper.js'
import MDIcon from './MDIcon.vue'

export default {
    name: 'PdfViewer',
    mixins: [i18nWrapperMixin],
    components: {
        MDIcon,
    },
    props: {
        source: {
            required: true,
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
        parentPdfJsHelper: {
            type: PdfJsHelper,
        },
        pdfjsViewerOptions: {
            type: Object,
            default: function () {
                return {}
            },
        },
        pdfjsCMapUrl: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            mdiMinus,
            mdiPlus,
            mdiCropFree,
            /** @type {PdfJsHelper} */
            pdfJsHelper: null,
            /** @type {PDFViewer} */
            pdfViewer: null,
            /** @type {PDFDocumentProxy} */
            pdfDocument: null,
            pagesCount: 0,
            currentPage: 1,
            showPageFitButton: false,
            requiredFormFieldsFilled: {},
            formEventListeners: [],
        }
    },
    computed: {
        transformedRequiredFormFieldsFilled() {
            return Object.values(this.requiredFormFieldsFilled)
        },
    },
    methods: {
        pageFit() {
            this.pdfViewer.currentScaleValue = 'page-fit'
        },
        decreaseScale() {
            this.pdfViewer.decreaseScale()
        },
        increaseScale() {
            this.pdfViewer.increaseScale()
        },
        handlePagesLoaded(pagesLoadedEvent) {
            this.pdfViewer.currentScaleValue = this.defaultScale
            this.pagesCount = pagesLoadedEvent.pagesCount

            const scrollbarWidth = this.$refs.viewerContainer.offsetWidth - this.$refs.viewerContainer.clientWidth
            this.$refs.viewerControls.style.width = `calc(100% - ${scrollbarWidth}px)`

            if (pagesLoadedEvent.source._pages) {
                const event = new CustomEvent('PDFViewer:pagesLoaded', pagesLoadedEvent.source._pages)
                window.dispatchEvent(event)
            }
        },
        handlePageChanging(pageChangingEvent) {
            this.currentPage = pageChangingEvent.pageNumber
        },
        handleScaleChanging(scaleChangingEvent) {
            this.showPageFitButton = scaleChangingEvent.presetValue !== 'page-fit'

            const event = new CustomEvent('PDFViewer:scaleChange', { detail: this.pdfViewer.currentScale })
            window.dispatchEvent(event)
        },
        async handleAnnotationLayerRendered() {
            if ((await this.pdfJsHelper.hasForm(this.pdfDocument)) && this.pdfjsViewerOptions.annotationMode === 2) {
                await this.prepareRequiredFormFields()
            }
        },
        async prepareRequiredFormFields() {
            const formFieldsToListen = await this.pdfJsHelper.getFormFieldsToListen(this.pdfDocument)

            if (formFieldsToListen.length > 0) {
                this.updateAllFormFields(formFieldsToListen)
                this.addFormEventListeners(formFieldsToListen)

                const allRequiredFieldsFilled = await this.pdfJsHelper.allRequiredFieldsFilled(
                    this.transformedRequiredFormFieldsFilled,
                )
                this.$emit('required-fields-filled', allRequiredFieldsFilled)
            }
        },
        async updateField(formField, htmlElement) {
            let fieldValue

            switch (htmlElement.type) {
                case 'radio':
                case 'checkbox':
                    fieldValue = htmlElement.checked
                    break
                default:
                    fieldValue = htmlElement.value
                    break
            }

            this.$set(this.requiredFormFieldsFilled, formField.id, { fieldName: formField.fieldName, fieldValue })
        },
        async updateAllFormFields(formFieldsToListen) {
            formFieldsToListen.forEach((formField) => {
                const htmlElement = document.querySelector(`[data-element-id="${formField.id}"]`)

                if (htmlElement && !formField.pushButton) {
                    this.updateField(formField, htmlElement)
                }
            })
        },
        async addFormEventListeners(formFieldsToListen) {
            this.removeFormEventListeners()

            formFieldsToListen.forEach((formField) => {
                const htmlElement = document.querySelector(`[data-element-id="${formField.id}"]`)

                if (htmlElement) {
                    const eventListener = async (event) => {
                        if (formField.pushButton) {
                            this.updateAllFormFields(formFieldsToListen)
                        } else {
                            this.updateField(formField, event.target)
                        }
                        const allRequiredFieldsFilled = await this.pdfJsHelper.allRequiredFieldsFilled(
                            this.transformedRequiredFormFieldsFilled,
                        )
                        this.$emit('required-fields-filled', allRequiredFieldsFilled)
                    }

                    switch (htmlElement.tagName.toLowerCase()) {
                        case 'select':
                            htmlElement.addEventListener('change', eventListener)
                            break
                        default:
                            if (formField.pushButton) {
                                htmlElement.addEventListener('click', eventListener)
                            } else {
                                htmlElement.addEventListener('input', eventListener)
                            }
                            break
                    }

                    this.formEventListeners.push({ element: htmlElement, listener: eventListener })
                }
            })
        },
        removeFormEventListeners() {
            this.formEventListeners.forEach(({ element, listener }) => {
                element.removeEventListener('input', listener)
            })
            this.formEventListeners = []
        },
    },
    created() {
        if (this.parentPdfJsHelper) {
            this.pdfJsHelper = this.parentPdfJsHelper
        } else {
            this.pdfJsHelper = new PdfJsHelper(this.pdfjsCMapUrl)
        }
    },
    async mounted() {
        try {
            this.pdfViewer = await this.pdfJsHelper.createPdfViewer(
                this.pdfjsViewerOptions,
                this.$refs.viewerContainer,
                this.$refs.viewer,
            )

            if (this.source instanceof Uint8Array || typeof this.source === 'string') {
                this.pdfDocument = await this.pdfJsHelper.loadDocument(this.source)
            } else {
                this.pdfDocument = this.source
            }

            this.pdfViewer.eventBus.on('pagesloaded', this.handlePagesLoaded)
            this.pdfViewer.eventBus.on('pagechanging', this.handlePageChanging)
            this.pdfViewer.eventBus.on('scalechanging', this.handleScaleChanging)
            this.pdfViewer.eventBus.on('annotationlayerrendered', this.handleAnnotationLayerRendered)

            this.pdfViewer.setDocument(this.pdfDocument)

            const event = new CustomEvent('PDFViewer:documentLoaded')
            window.dispatchEvent(event)
        } catch (error) {
            this.$emit('error', error)
            throw error
        }
    },
    beforeDestroy() {
        this.removeFormEventListeners()
        if (this.pdfViewer) {
            this.pdfViewer.eventBus.off('pagesloaded', this.handlePagesLoaded)
            this.pdfViewer.eventBus.off('pagechanging', this.handlePageChanging)
            this.pdfViewer.eventBus.off('scalechanging', this.handleScaleChanging)
            this.pdfViewer.eventBus.off('annotationlayerrendered', this.handleAnnotationLayerRendered)
            this.pdfViewer.cleanup()
        }
    },
}
</script>
