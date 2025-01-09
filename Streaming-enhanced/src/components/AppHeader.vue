<script setup lang="ts"></script>

<template>
	<div class="navbar bg-primary text-primary-content p-2">
		<div class="flex-1 pl-2">
			<RouterLink
				to="/"
				class="flex gap-2 items-center"
			>
				<img
					src="@assets/logo.png"
					alt="logo"
					class="h-8 w-auto"
				/>
				<div class="text-base font-semibold">Vite Vue 3 Chrome Extension</div>
			</RouterLink>
		</div>
		<div class="flex-none">
			<ul class="menu menu-horizontal menu-xs">
				<li>
					<LocaleSwitch />
				</li>
				<li><ThemeSwitch /></li>
			</ul>
		</div>
	</div>
</template>

<style scoped></style>
