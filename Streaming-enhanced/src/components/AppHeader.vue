<script setup lang="ts">
const version = __VERSION__
</script>

<template>
	<div class="navbar base-100 text-primary-content p-2">
		<div class="flex-1 pl-2">
			<RouterLink
				to="/"
				class="flex gap-2 items-center"
			>
				<div class="flex justify-center flex-row">
					<img
						src="@assets/logo.png"
						alt="logo"
						class="h-8 w-auto"
					/>
					<div class="flex-center flex-col">
						<h2>
							{{ $t("pageTitle") }}
						</h2>
						<p style="color: grey; font-size: 1rem">{{ version }}</p>
					</div>
				</div>
				<a
					target="_blank"
					class="flex-center flex-col"
					style="text-align: center; text-decoration: none"
					href="https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/"
				>
					<p style="font-size: 1rem">
						{{ $t("rateNow") }}
					</p>
					<img
						src="https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010"
						alt="rating"
					/>
				</a>
				<a
					class="flex flex-center"
					style="font-size: 1.5rem"
					href="https://github.com/Dreamlinerm/Netflix-Prime-Auto-Skip"
					target="_blank"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						class="w-[2rem] h-[2rem] bg-transparent fill-primary-content text-primary-content flex justify-center items-center cursor-pointer mx-1.5"
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
				<!-- <div class="text-base font-semibold">Vite Vue 3 Chrome Extension</div> -->
			</RouterLink>
		</div>
		<div class="flex-none">
			<ul class="menu menu-horizontal menu-xs">
				<li>
					<RouterLink
						to="/options-page"
						class="flex gap-2 items-center"
					>
						<i-mdi-cog />
					</RouterLink>
				</li>
				<li>
					<LocaleSwitch />
				</li>
				<li><ThemeSwitch /></li>
			</ul>
		</div>
	</div>
</template>

<style scoped></style>
