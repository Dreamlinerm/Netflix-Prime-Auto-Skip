<template>
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
				Apply Prime affiliate link
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
function applyPrimeAffiliateLink() {
	window.parent.postMessage({ type: "applyPrimeAffiliateLink" }, "*")
}
</script>
