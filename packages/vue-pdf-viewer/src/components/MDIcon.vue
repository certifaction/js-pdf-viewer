<template>
    <svg class="md-icon" viewBox="0 0 24 24">
        <path fill="currentColor" :d="icon" />
    </svg>
</template>

<script>
export default {
    name: 'MDIcon',
    props: {
        icon: {
            type: String,
            required: true,
        },
    },
}
</script>
