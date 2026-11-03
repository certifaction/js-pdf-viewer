<script lang="ts" setup>
import { computed } from 'vue'
import { type Icon } from '../icons'

interface Props {
    icon: Icon
}

const props = defineProps<Props>()

const svgAttributes = computed(() => {
    const width = props.icon.width ?? 24
    const height = props.icon.height ?? 24

    return {
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'c-icon',
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    }
})
</script>

<template>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <svg v-if="props.icon.svgCode" v-bind="svgAttributes" v-html="props.icon.svgCode" />
    <svg v-else-if="props.icon.svgPath" v-bind="svgAttributes">
        <path :d="props.icon.svgPath" />
    </svg>
</template>

<style lang="scss">
.c-icon {
    height: auto;
    fill: currentColor;
}
</style>
