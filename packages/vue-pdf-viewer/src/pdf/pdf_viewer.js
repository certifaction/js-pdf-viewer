import './pdf.init'
import { pdfjsViewer } from '@certifaction/pdfjs'
// import pdfjsViewer from '@certifaction/pdfjs/dist/pdf_viewer.js'
// import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer'

// console.log(window['pdfjs-dist/build/pdf'])

delete window['pdfjs-dist/build/pdf']

export default pdfjsViewer
