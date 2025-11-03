import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipPrettierFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
    {
        name: 'certifaction/js-pdf-viewer/files-to-lint',
        files: ['**/*.{js,mjs,jsx,vue}'],
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },

    js.configs.recommended,
    ...pluginVue.configs['flat/vue2-essential'],
    ...pluginOxlint.configs['flat/recommended'],
    skipPrettierFormatting,
])
