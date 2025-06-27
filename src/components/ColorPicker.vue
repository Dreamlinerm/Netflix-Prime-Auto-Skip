<template>
	<Sketch v-model="color"></Sketch>
</template>

<script lang="ts">
import { Sketch } from "@ckpack/vue-color"
export default {
	data() {
		return {
			color: "#000",
		}
	},
	components: {
		Sketch,
	},
	mounted() {
		this.color = this.modelValue
	},
	watch: {
		color() {
			this.$emit("update:modelValue", this.color.hex8 || this.modelValue)
		},
	},
	props: {
		modelValue: String,
	},
	emits: ["update:modelValue"],
}
</script>

<style scoped></style>
