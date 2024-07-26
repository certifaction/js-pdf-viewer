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
                <span class="total">{{ pageCount }}</span>
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

const MIN_SCALE = 0.1
const MAX_SCALE = 10

export default {
    name: 'PdfViewer',
    mixins: [i18nWrapperMixin],
    components: {
        MDIcon,
    },
    props: {
        pdfjsCMapUrl: {
            type: String,
            required: true,
        },
        source: {
            required: true,
        },
        pdfjsViewerOptions: {
            type: Object,
            default: function () {
                return {}
            },
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
            currentScale: null,
            requiredFormFieldsFilled: {},
            formEventListeners: [],
        }
    },
    computed: {
        currentPage() {
            return this.pdfViewer ? this.pdfViewer.currentPageNumber : 0
        },
        pageCount() {
            return this.pdfDocument ? this.pdfDocument.numPages : 0
        },
        showPageFitButton() {
            return this.currentScale !== 'page-fit'
        },
        transformedRequiredFormFieldsFilled() {
            return Object.values(this.requiredFormFieldsFilled)
        },
    },
    watch: {
        currentScale(newVal, oldVal) {
            if (oldVal) {
                this.pdfViewer.currentScaleValue = this.currentScale
                const event = new CustomEvent('PDFViewer:scaleChange', { detail: this.pdfViewer.currentScale })
                window.dispatchEvent(event)
            }
        },
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

            this.currentScale = newScale < MIN_SCALE ? MIN_SCALE : newScale
        },
        increaseScale() {
            let newScale = this.pdfViewer.currentScale
            newScale += 0.1
            newScale = newScale.toFixed(2)
            newScale = Math.ceil(newScale * 10) / 10

            this.currentScale = newScale > MAX_SCALE ? MAX_SCALE : newScale
        },
        onPagesLoaded() {
            this.pdfViewer.currentScaleValue = this.currentScale = this.defaultScale

            const event = new Event('PDFViewer:pagesLoaded')
            window.dispatchEvent(event)

            const scrollbarWidth = this.$refs.viewerContainer.offsetWidth - this.$refs.viewerContainer.clientWidth
            this.$refs.viewerControls.style.width = `calc(100% - ${scrollbarWidth}px)`
        },
        async onAnnotationLayerRendered() {
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
        this.pdfJsHelper = PdfJsHelper.getInstance(this.pdfjsCMapUrl)
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

            this.pdfViewer.eventBus.on('pagesloaded', this.onPagesLoaded)
            this.pdfViewer.eventBus.on('annotationlayerrendered', this.onAnnotationLayerRendered)

            this.pdfViewer.setDocument(this.pdfDocument)

            const event = new Event('PDFViewer:documentLoaded')
            window.dispatchEvent(event)
        } catch (error) {
            this.$emit('error', error)
            throw error
        }
    },
    beforeDestroy() {
        this.removeFormEventListeners()
        if (this.pdfViewer) {
            this.pdfViewer.eventBus.off('pagesloaded', this.onPagesLoaded)
            this.pdfViewer.eventBus.off('annotationlayerrendered', this.onAnnotationLayerRendered)
            this.pdfViewer.cleanup()
        }
    },
}
</script>
