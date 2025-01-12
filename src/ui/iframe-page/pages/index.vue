<template>
	<div
		class="absolute top-0 right-0 p-2 cursor-pointer"
		@click="removeIframe"
	>
		<i-mdi-close />
	</div>
	<div class="flex flex-row items-center justify-center">
		<img
			class="h-16 mx-4"
			src="@/assets/Logo/NetflixAmazon Auto-Skip.svg"
			alt="Logo"
		/>
		<div>
			<h1>Support Streaming enhanced ❤️</h1>
			<button
				class="btn btn-secondary"
				@click="applyPrimeAffiliateLink"
			>
				Apply affiliate link
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
function applyPrimeAffiliateLink() {
	window.parent.postMessage({ type: "applyPrimeAffiliateLink" }, "*")
}
function removeIframe() {
	window.parent.postMessage({ type: "removeIframe" }, "*")
}
</script>
