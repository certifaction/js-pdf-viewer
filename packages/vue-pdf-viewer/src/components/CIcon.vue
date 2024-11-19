<script lang="ts">
export interface Icon {
    svgPath?: string
    svgCode?: string
    width?: number
    height?: number
}

export interface CIconProps {
    icon: Icon
}
</script>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<CIconProps>()

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
    <svg v-if="props.icon.svgCode" v-bind="svgAttributes" v-html="props.icon.svgCode"></svg>
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
