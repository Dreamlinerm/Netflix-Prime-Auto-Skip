import { createRouter, createWebHashHistory } from "vue-router"
import { handleHotUpdate, routes } from "vue-router/auto-routes"

/** Create an isolated router; hot updates are only enabled in development. */
export function createAppRouter(hotUpdates = Boolean(import.meta.hot)) {
	const router = createRouter({
		history: createWebHashHistory(import.meta.env.BASE_URL),
		routes: [...routes, { path: "/:catchAll(.*)*", redirect: "/" }],
	})
	if (hotUpdates) handleHotUpdate(router)
	return router
}

export const appRouter = createAppRouter()
