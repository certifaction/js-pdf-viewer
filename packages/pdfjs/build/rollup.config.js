import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import copy from 'rollup-plugin-copy'
import pkg from '../package.json' assert { type: 'json' }

const sourcemap = true

export default [
    {
        input: 'src/index.js',
        output: [
            {
                format: 'cjs',
                file: pkg.main,
                exports: 'named',
                sourcemap
            },
            {
                format: 'es',
                file: pkg.module,
                sourcemap
            }
        ],
        plugins: [
            commonjs(),
            resolve({
                browser: true,
                preferBuiltins: false
            }),
            babel({
                babelHelpers: 'bundled',
                exclude: [
                    '../../node_modules/core-js/**'
                ]
            }),
            copy({
                targets: [
                    {
                        src: [
                            '../../node_modules/pdfjs-dist/build/pdf.worker.js',
                            '../../node_modules/pdfjs-dist/build/pdf.worker.min.js',
                            '../../node_modules/pdfjs-dist/build/pdf.worker.js.map'
                        ],
                        dest: 'dist/',
                        rename: (name, extension) => `${name.replace('pdf.worker', 'pdfjs.worker')}.${extension}`
                    },
                    {
                        src: '../../node_modules/pdfjs-dist/web/pdf_viewer.css',
                        dest: 'dist/',
                        transform: (content) => content.toString()
                            .replaceAll('.pdfViewer', '.viewer-container .viewer')
                    },
                    {
                        src: '../../node_modules/pdfjs-dist/web/pdf_viewer.css',
                        dest: 'dist/',
                        rename: (name) => `${name}_scss.scss`,
                        transform: (content) => content.toString()
                            .replaceAll(/url\("?((?!data:)[^)"]*)"?\)/ig, 'pdf-viewer-asset("$1")')
                            .replaceAll('.pdfViewer', '.viewer-container .viewer')
                    },
                    { src: '../../node_modules/pdfjs-dist/web/images', dest: 'dist/' },
                    { src: '../../node_modules/pdfjs-dist/cmaps', dest: 'dist/' }
                ]
            })
        ]
    }
]
