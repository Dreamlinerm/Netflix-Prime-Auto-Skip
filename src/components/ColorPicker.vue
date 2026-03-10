<template>
	<Sketch v-model="color"></Sketch>
</template>

<script lang="ts">
import { Sketch } from "@ckpack/vue-color"
export default {
	components: {
		Sketch,
	},
	props: {
		modelValue: String,
	},
	emits: ["update:modelValue"],
	data() {
		return {
			color: "#000",
		}
	},
	watch: {
		color() {
			this.$emit("update:modelValue", this.color.hex8 || this.modelValue)
		},
	},
	mounted() {
		this.color = this.modelValue
	},
}
</script>

<style scoped></style>
