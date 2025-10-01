import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipPrettierFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
    {
        name: 'certifaction/js-pdf-viewer/files-to-lint',
        files: ['**/*.{js,mjs,jsx,vue}'],
    },

    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },

    js.configs.recommended,

    ...pluginVue.configs['flat/vue2-essential'],

    skipPrettierFormatting,
])
