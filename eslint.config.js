import pluginVue from 'eslint-plugin-vue'
import skipPrettierFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
    {
        name: 'certifaction/js-pdf-viewer/files-to-lint',
        files: ['**/*.{js,mjs,vue}'],
    },

    ...pluginVue.configs['flat/vue2-essential'],

    skipPrettierFormatting,
]
