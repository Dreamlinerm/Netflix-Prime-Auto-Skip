import { expect, it } from "vitest"
import { createAppRouter } from "../../utils/router"
import { routes } from "../fixtures/routes"
it.each([true, false])("creates an independent router with hot updates %s without mutating generated routes", (hot) => {
	const count = routes.length
	const router = createAppRouter(hot)
	expect(router.resolve("/options-page/Backup").matched).toHaveLength(1)
	expect(router.resolve("/unknown").matched[0].redirect).toBe("/")
	expect(routes).toHaveLength(count)
	router.options.history.destroy()
})
