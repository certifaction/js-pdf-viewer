<script setup>
const props = defineProps({
    icon: {
        type: String,
        required: true
    }
})
</script>

<template>
    <svg class="md-icon" viewBox="0 0 24 24">
        <path fill="currentColor" :d="props.icon"/>
    </svg>
</template>
