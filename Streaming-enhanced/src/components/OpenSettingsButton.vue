<script lang="ts" setup>
import { useRouter } from "vue-router"
const router = useRouter()
const gotoSettings = () => {
	router.push("/action-popup/SharedOptions")
}
</script>
<template>
	<button
		class="btn btn-secondary rounded-2xl w-full"
		@click="gotoSettings"
	>
		{{ $t("openSharedSettings") }}
	</button>
</template>
