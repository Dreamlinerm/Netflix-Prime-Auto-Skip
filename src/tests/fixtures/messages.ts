// Real locale dictionaries, without the production build-time i18n plugin.
const modules = import.meta.glob("../../locales/*.json", { eager: true, import: "default" })
export default Object.fromEntries(
	Object.entries(modules).map(([path, messages]) => [path.split("/").at(-1)!.replace(".json", ""), messages]),
)
