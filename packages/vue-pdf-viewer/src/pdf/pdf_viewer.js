import './pdf.init'
import { pdfjsViewer } from '@certifaction/pdfjs'

delete window['pdfjs-dist/build/pdf']

export default pdfjsViewer
