<script setup lang="ts"></script>

<template>
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
