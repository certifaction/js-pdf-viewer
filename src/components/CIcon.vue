<template>
    <svg v-if="icon.svgCode" v-bind="svgAttributes" v-on="$listeners" v-html="icon.svgCode" />
    <svg v-else-if="icon.svgPath" v-bind="svgAttributes" v-on="$listeners">
        <path :d="icon.svgPath" />
    </svg>
</template>

<script>
export default {
    name: 'CIcon',
    props: {
        icon: {
            type: Object,
            required: true,
        },
    },
    computed: {
        svgAttributes() {
            const width = this.icon.width ?? 24
            const height = this.icon.height ?? 24

            return {
                xmlns: 'http://www.w3.org/2000/svg',
                class: 'c-icon',
                width,
                height,
                viewBox: `0 0 ${width} ${height}`,
            }
        },
    },
}
</script>
