import type { RouteRecordRaw } from "vue-router"
// Mirror the production file-route convention while avoiding its directory watcher.
const pages = import.meta.glob("../../ui/*/pages/*.vue")
export const routes = Object.entries(pages).map(([path, component]) => ({
	path:
		"/" +
		path
			.replace("../../ui/", "")
			.replace("/pages/", "/")
			.replace(/\/index\.vue$/, "")
			.replace(/\.vue$/, ""),
	component,
})) as RouteRecordRaw[]
export const handleHotUpdate = () => {}
