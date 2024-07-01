<script lang="ts">
export interface Icon {
    svgPath: string
    width?: number
    height?: number
}

export interface CIconProps {
    icon: Icon
}
</script>

<script lang="ts" setup>
const props = defineProps<CIconProps>()

const iconWidth = props.icon.width ?? 24
const iconHeight = props.icon.height ?? 24
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        class="c-icon"
        :width="iconWidth"
        :height="iconHeight"
        :viewBox="`0 0 ${iconWidth} ${iconHeight}`">
        <path fill-rule="evenodd" :d="props.icon.svgPath" />
    </svg>
</template>

<style lang="scss">
.c-icon {
    height: auto;
    fill: currentColor;
}
</style>
