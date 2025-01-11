<script setup lang="ts">
import { Notivue, Notification } from "notivue"
import { isFirefox } from "@/utils/helper"
const version = __VERSION__
const githubUrl = __GITHUB_URL__
const hash = ref(window.location.hash)
</script>
<template>
	<div
		class="flex"
		style="height: calc(min(100vh, 1800px))"
	>
		<div class="sidenav flex flex-col">
			<div class="flex justify-center items-center flex-col IconBox">
				<div class="flex justify-center items-center flex-row">
					<img
						class="Logo"
						src="@/assets/Logo/NetflixAmazon Auto-Skip.svg"
						alt="Logo"
					/>
					<div class="flex justify-center items-center flex-col">
						<h2 class="title">
							{{ $t("pageTitle") }}
						</h2>
						<p class="font text-base">{{ version }}</p>
					</div>
				</div>
				<a
					target="_blank"
					class="flex justify-center items-center flex-col text-center no-underline"
					:href="
						isFirefox
							? 'https://addons.mozilla.org/firefox/addon/netflix-prime-auto-skip/'
							: 'https://chrome.google.com/webstore/detail/netflixprime-auto-skip/akaimhgappllmlkadblbdknhbfghdgle'
					"
				>
					<p class="text-base">
						{{ $t("rateNow") }}
					</p>
					<img
						:src="
							isFirefox
								? 'https://img.shields.io/amo/stars/NetflixPrime@Autoskip.io?color=e60010'
								: 'https://img.shields.io/chrome-web-store/stars/akaimhgappllmlkadblbdknhbfghdgle?color=e60010'
						"
						alt="rating"
						class="w-24"
					/>
				</a>
			</div>
			<div class="flex flex-col MenuButtons flex-wrap">
				<RouterLink
					to="/options-page/SharedSettings"
					class="menuButton flex"
					:class="hash.endsWith('SharedSettings') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'SharedSettings'"
				>
					<i-mdi-transit-connection-variant class="icon" />
					<div>
						{{ $t("sharedSettings") }}
					</div>
				</RouterLink>
				<RouterLink
					to="/options-page/Amazon"
					class="menuButton flex"
					:class="hash.endsWith('Amazon') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Amazon'"
				>
					<img
						src="@/assets/MenuIcons/Amazon.svg"
						alt="Amazon"
						class="icon"
					/>
					<div>Prime Video</div>
				</RouterLink>
				<RouterLink
					to="/options-page/Netflix"
					class="menuButton flex"
					:class="hash.endsWith('Netflix') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Netflix'"
				>
					<img
						src="@/assets/MenuIcons/Netflix.svg"
						alt="Netflix"
						class="icon"
					/>
					<div>Netflix</div>
				</RouterLink>
				<RouterLink
					to="/options-page/Disney"
					class="menuButton flex"
					:class="hash.endsWith('Disney') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Disney'"
				>
					<img
						src="@/assets/MenuIcons/Disney.svg"
						alt="Disney"
						class="icon"
					/>
					<div>Disney+</div>
				</RouterLink>
				<RouterLink
					to="/options-page/Crunchyroll"
					class="menuButton flex"
					:class="hash.endsWith('Crunchyroll') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Crunchyroll'"
				>
					<img
						src="@/assets/MenuIcons/Crunchyroll.svg"
						alt="Crunchyroll"
						class="icon"
					/>
					<div>Crunchyroll</div>
				</RouterLink>
				<RouterLink
					to="/options-page/Backup"
					class="menuButton flex"
					:class="hash.endsWith('Backup') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Backup'"
				>
					<i-mdi-dots-horizontal class="icon" />
					<p>{{ $t("backup") }}</p>
				</RouterLink>
				<RouterLink
					to="/options-page/Statistics"
					class="menuButton flex"
					:class="hash.endsWith('Statistics') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Statistics'"
				>
					<i-mdi-chart-bar class="icon" />
					<p>{{ $t("statistics") }}</p>
				</RouterLink>
				<RouterLink
					to="/options-page/Changelog"
					class="menuButton flex"
					:class="hash.endsWith('Changelog') ? 'bg-netflix' : 'bg-primary'"
					draggable="false"
					@click="hash = 'Changelog'"
				>
					<i-mdi-format-list-bulleted class="icon" />
					<p>{{ $t("changelog") }}</p>
				</RouterLink>
			</div>
			<div class="mt-auto">
				<div class="flex flex-col mb-2 MenuButtons">
					<a
						class="btn btn-secondary rounded-2xl blueButtons m-[5px_15px]"
						:href="githubUrl"
						target="_blank"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							class="w-[2rem] h-[2rem] bg-transparent fill-primary-content text-primary-content flex justify-center items-center cursor-pointer"
						>
							<path
								d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
							/>
						</svg>
						Github
					</a>
					<a
						class="btn btn-secondary rounded-2xl blueButtons m-[5px_15px]"
						href="https://github.com/sponsors/Dreamlinerm"
						target="_blank"
					>
						<i-mdi-gift
							height="2rem"
							width="2rem"
						/>
						{{ $t("donate") }}
					</a>
				</div>
			</div>
		</div>
		<div class="content flex flex-col overflow-y-auto w-full">
			<div class="page">
				<div class="p-4 prose">
					<RouterView />
				</div>

				<Notivue v-slot="item">
					<Notification :item="item" />
				</Notivue>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* The side navigation menu */
.sidenav {
	@apply h-full bg-[#111] px-2.5 gap-5;
}
.menuButton {
	@apply rounded-[15px] m-[5px_15px] p-[13px_20px] max-w-[400px] no-underline whitespace-nowrap cursor-pointer text-primary-content text-[1.5rem] select-none items-center;
	/*TODO: change whitespace according language*/
}
/* When you mouse over the navigation links, change their color */
.menuButton:hover {
	background-color: #4d0000;
}
.IconBox {
	@apply p-5;
}
.Logo {
	@apply h-12;
}
.title {
	@apply py-0 text-primary-content;
}

.content {
	@apply min-w-[500px] min-h-[450px];
}
.page {
	@apply p-[80px_0_0_3%] w-[97%];
}

.icon {
	width: 2rem;
	height: 2rem;
	margin: 0 5px;
}

@media only screen and (max-width: 800px), only screen and (max-height: 600px) {
	.menuButton p,
	.menuButton div,
	.IconBox {
		display: none;
	}
	.MenuButtons {
		padding-top: 5px;
	}
}
@media only screen and (max-height: 800px), only screen and (max-width: 1000px) {
	.MenuButtons {
		flex-direction: row;
		justify-content: center;
	}
	.menuButton {
		margin: 5px;
		padding: 5px 10px;
	}
	.blueButtons {
		margin: 0 5px !important;
		font-size: 1em;
	}
	body {
		flex-direction: column;
	}
	.page {
		padding: 0px;
		margin: 0 15px 0 15px;
		width: calc(100% - 30px);
	}
	.IconBox {
		padding: 10px 0px 0px 0px;
		flex-direction: row;
	}
	.sidenav {
		height: auto;
		display: block;
	}
}
</style>
