<script setup lang="ts">
const version = __VERSION__
</script>

<template>
	<div class="navbar bg-bgcustom text-primary-content p-2">
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
					<i-mdi-gift />
				</a>
				<a
					class="flex flex-center text-xl"
					href="https://github.com/sponsors/Dreamlinerm"
					target="_blank"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						class="icon"
					>
						<path
							d="M9.06,1.93C7.17,1.92 5.33,3.74 6.17,6H3A2,2 0 0,0 1,8V10A1,1 0 0,0 2,11H11V8H13V11H22A1,1 0 0,0 23,10V8A2,2 0 0,0 21,6H17.83C19,2.73 14.6,0.42 12.57,3.24L12,4L11.43,3.22C10.8,2.33 9.93,1.94 9.06,1.93M9,4C9.89,4 10.34,5.08 9.71,5.71C9.08,6.34 8,5.89 8,5A1,1 0 0,1 9,4M15,4C15.89,4 16.34,5.08 15.71,5.71C15.08,6.34 14,5.89 14,5A1,1 0 0,1 15,4M2,12V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V12H13V20H11V12H2Z"
						/>
					</svg>
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
