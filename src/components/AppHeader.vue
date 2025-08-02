<script setup lang="ts">
const isFirefox = typeof browser !== "undefined"
const githubUrl = __GITHUB_URL__
function openSettings() {
	chrome.tabs.create({
		active: true,
		url: chrome.runtime.getURL("src/ui/options-page/index.html#"),
	})
}
</script>

<template>
	<div class="navbar text-primary-content justify-between">
		<div class="flex">
			<RouterLink
				to="/"
				class="flex gap-2 items-center"
			>
				<img
					src="@assets/logo.png"
					alt="logo"
					class="h-12 w-auto"
				/>
				<h2 class="text-wrap w-24 p-0">{{ $t("pageTitle") }}</h2>
			</RouterLink>
			<a
				target="_blank"
				class="flex flex-col text-center items-center justify-center"
				:href="
					isFirefox
						? 'https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/'
						: 'https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle'
				"
			>
				<p class="text-nowrap text-base p-0">
					{{ $t("rateNow") }}
				</p>
				<img
					:src="
						isFirefox
							? 'https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010'
							: 'https://img.shields.io/chrome-web-store/stars/akaimhgappllmlkadblbdknhbfghdgle?color=e60010'
					"
					alt="rating"
				/>
			</a>
		</div>
		<div class="flex h-full items-center">
			<a
				class="flex flex-center"
				style="font-size: 1.5rem"
				:href="githubUrl"
				target="_blank"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					class="w-8 h-8 bg-transparent fill-primary-content text-primary-content flex justify-center items-center cursor-pointer mx-1.5"
				>
					<path
						d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
					/>
				</svg>
			</a>
			<a
				class="flex flex-center"
				href="https://github.com/sponsors/Dreamlinerm"
				target="_blank"
			>
				<i-mdi-gift
					height="2rem"
					width="2rem"
				/>
			</a>
			<a
				class="flex gap-2 items-center cursor-pointer"
				@click="openSettings"
			>
				<i-mdi-cog
					height="2.5rem"
					width="2.5rem"
					class="ml-1.5"
				/>
			</a>
			<ul class="menu menu-xs p-0">
				<li>
					<LocaleSwitch />
				</li>
				<li class="flex flex-row">
					<ThemeSwitch />
				</li>
			</ul>
		</div>
	</div>
</template>

<style scoped>
p {
	font-size: initial;
}
</style>
