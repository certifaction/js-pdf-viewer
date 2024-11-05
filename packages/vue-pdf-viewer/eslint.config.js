import pluginVue from 'eslint-plugin-vue'
import skipPrettierFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [...pluginVue.configs['flat/vue2-essential'], skipPrettierFormatting]
