<script setup lang="ts">
import { computed } from "vue"
import { Sketch } from "@ckpack/vue-color"
const props = withDefaults(defineProps<{ modelValue?: string }>(), { modelValue: "#000000" })
const emit = defineEmits<{ "update:modelValue": [value: string] }>()
const color = computed({
	get: () => props.modelValue,
	set: (value: string | { hex8: string }) => emit("update:modelValue", typeof value === "string" ? value : value.hex8),
})
</script>

<template><Sketch v-model="color" /></template>
