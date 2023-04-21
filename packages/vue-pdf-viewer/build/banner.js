'use strict'

import fs from 'fs'
import { glob } from 'glob'
import pkg from '../package.json' assert { type: 'json' }

const year = new Date().getFullYear()
const banner = `/*!
 * ${pkg.name} ${pkg.version}
 *
 * @link ${pkg.homepage}
 * @source ${pkg.repository.url}
 * @copyright (c) 2019-${year} Certifaction AG
 * @license ${pkg.license}
 */`

glob('dist/**/*.{js,css}', (err, files) => {
    if (err) throw err
    files.map(file => {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) throw err
            fs.writeFileSync(file, banner + '\n' + data)
        })
    })
})
