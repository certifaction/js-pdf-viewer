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
                        <CIcon :icon="iconExpand" />
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

<script>
import i18nWrapperMixin from '../mixins/i18n-wrapper'
import { PdfJsHelper } from '../pdf/PdfJsHelper.js'
import CIcon from './CIcon.vue'
import { iconExpand, iconMinus, iconPlus } from '../icons'

export default {
    name: 'PdfViewer',
    mixins: [i18nWrapperMixin],
    components: {
        CIcon,
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
        pdfjsViewerOptions: {
            type: Object,
            default: function () {
                return {}
            },
        },
        parentPdfJsHelper: {
            type: PdfJsHelper,
        },
        pdfjsCMapUrl: {
            type: String,
            required: true,
        },
        pdfjsIccUrl: {
            type: String,
            required: true,
        },
        pdfjsWasmUrl: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            iconPlus,
            iconMinus,
            iconExpand,
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
        async handlePagesInit() {
            this.pdfViewer.currentScaleValue = this.defaultScale

            if (this.pdfjsViewerOptions.annotationMode === 2) {
                const hasForm = await this.pdfJsHelper.hasForm(this.pdfDocument)
                if (hasForm) {
                    await this.prepareRequiredFormFields()
                }
            }
        },
        handlePagesLoaded(pagesLoadedEvent) {
            this.pagesCount = pagesLoadedEvent.pagesCount

            const scrollbarWidth = this.$refs.viewerContainer.offsetWidth - this.$refs.viewerContainer.clientWidth
            this.$refs.viewerControls.style.width = `calc(100% - ${scrollbarWidth}px)`

            if (pagesLoadedEvent.source._pages) {
                this.$emit('pages-loaded', pagesLoadedEvent.source._pages)
                const event = new CustomEvent('PDFViewer:pagesLoaded', pagesLoadedEvent.source._pages)
                window.dispatchEvent(event)
            }
        },
        handlePageChanging(pageChangingEvent) {
            this.currentPage = pageChangingEvent.pageNumber
        },
        handleScaleChanging(scaleChangingEvent) {
            this.showPageFitButton = scaleChangingEvent.presetValue !== 'page-fit'

            this.$emit('scale-changed', { detail: this.pdfViewer.currentScale })
            const event = new CustomEvent('PDFViewer:scaleChange', { detail: this.pdfViewer.currentScale })
            window.dispatchEvent(event)
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
        updateAllFormFields(formFieldsToListen) {
            formFieldsToListen.forEach((formField) => {
                const htmlElement = document.querySelector(`[data-element-id="${formField.id}"]`)

                if (htmlElement && !formField.pushButton) {
                    this.updateField(formField, htmlElement)
                }
            })
        },
        addFormEventListeners(formFieldsToListen) {
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
            this.pdfJsHelper = new PdfJsHelper(this.pdfjsCMapUrl, this.pdfjsIccUrl, this.pdfjsWasmUrl)
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

            this.pdfViewer.eventBus.on('pagesinit', this.handlePagesInit)
            this.pdfViewer.eventBus.on('pagesloaded', this.handlePagesLoaded)
            this.pdfViewer.eventBus.on('pagechanging', this.handlePageChanging)
            this.pdfViewer.eventBus.on('scalechanging', this.handleScaleChanging)

            this.pdfViewer.setDocument(this.pdfDocument)

            this.$emit('document-loaded')
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
            this.pdfViewer.eventBus.off('pagesinit', this.handlePagesInit)
            this.pdfViewer.eventBus.off('pagesloaded', this.handlePagesLoaded)
            this.pdfViewer.eventBus.off('pagechanging', this.handlePageChanging)
            this.pdfViewer.eventBus.off('scalechanging', this.handleScaleChanging)

            this.pdfViewer.cleanup()
        }
    },
}
</script>
