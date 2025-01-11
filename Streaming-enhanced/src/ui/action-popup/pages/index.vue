<script setup lang="ts">
const githubUrl = __GITHUB_URL__
</script>

<template>
	<div class="w-[437px]">
		<div class="grid grid-cols-3 gap-4">
			<RouterLink
				to="/action-popup/SharedOptions"
				class="popupMenuButton flex"
				draggable="false"
			>
				<i-mdi-transit-connection-variant
					width="100%"
					height="100%"
				/>
			</RouterLink>
			<RouterLink
				to="/action-popup/Amazon"
				class="popupMenuButton flex"
				draggable="false"
			>
				<img
					src="@/assets/MenuIcons/Amazon.svg"
					alt="Amazon"
					class="icon"
				/>
			</RouterLink>
			<RouterLink
				to="/action-popup/Netflix"
				class="popupMenuButton flex"
				draggable="false"
			>
				<img
					src="@/assets/MenuIcons/Netflix.svg"
					alt="Netflix"
					class="icon"
				/>
			</RouterLink>
			<RouterLink
				to="/action-popup/Disney"
				class="popupMenuButton flex"
				draggable="false"
			>
				<img
					src="@/assets/MenuIcons/Disney.svg"
					alt="Disney"
					class="icon"
				/>
			</RouterLink>

			<RouterLink
				to="/action-popup/Crunchyroll"
				class="popupMenuButton flex"
				draggable="false"
			>
				<img
					src="@/assets/MenuIcons/Crunchyroll.svg"
					alt="Crunchyroll"
					class="icon"
				/>
			</RouterLink>
			<RouterLink
				to="/action-popup/Statistics"
				class="popupMenuButton flex"
				draggable="false"
			>
				<i-mdi-chart-bar
					width="100%"
					height="100%"
				/>
			</RouterLink>
		</div>
		<div class="grid grid-cols-2 gap-2 pt-2">
			<a
				class="btn btn-secondary rounded-2xl"
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
				class="btn btn-secondary rounded-2xl"
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
</template>

<style scoped>
/* When you mouse over the navigation links, change their color */
.menuButton:hover,
.popupMenuButton:hover {
	background-color: #4d0000;
}

.popupMenuButton {
	@apply rounded-[15px] p-5 bg-[#242424] cursor-pointer text-white flex items-center select-none;
}
.popupMenuButton .icon {
	@apply m-0 w-full h-auto;
}
.icon {
	@apply text-white fill-current;
}
</style>
>
