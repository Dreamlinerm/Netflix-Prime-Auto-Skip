<script setup lang="ts">
import { Notivue, Notification } from "notivue"
const isFirefox = typeof browser !== "undefined"
const version = __VERSION__
const githubUrl = __GITHUB_URL__
const hash = ref(window.location.hash)
import { useFrontendStore } from "@/stores/options.store"
// wont sync without opening once
useFrontendStore()
</script>
<template>
	<div
		class="wrapper"
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
						<p class="font text-base text-white">{{ version }}</p>
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
					<p class="text-base text-white">
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
					<i-mdi-netflix class="icon" />
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
						<i-mdi-github class="icon" />
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
	@apply py-0 text-white;
}

.content {
	@apply min-w-[500px] min-h-[450px];
}
.page {
	@apply p-[80px_0_0_3%] w-[97%];
}

.icon {
	@apply w-8 h-8 mx-1.5;
}
.wrapper {
	@apply flex flex-row;
}

@media only screen and (max-width: 800px), only screen and (max-height: 600px) {
	.wrapper {
		@apply flex flex-col;
	}
	.menuButton p,
	.menuButton div,
	.IconBox {
		@apply hidden;
	}
	.MenuButtons {
		@apply pt-1.5;
	}
}

@media only screen and (max-height: 800px), only screen and (max-width: 1000px) {
	.wrapper {
		@apply flex flex-col;
	}
	.MenuButtons {
		@apply flex-row justify-center;
	}
	.menuButton {
		@apply m-1.5 px-2.5 py-1.5;
	}
	.blueButtons {
		@apply mx-1.5 text-base !important;
	}
	body {
		@apply flex-col;
	}
	.page {
		@apply p-0 mx-3.5 w-[calc(100%-30px)];
	}
	.IconBox {
		@apply pt-2.5 flex-row;
	}
	.sidenav {
		@apply h-auto block;
	}
}
</style>
