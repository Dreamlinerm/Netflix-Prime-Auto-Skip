import { afterEach, expect, it } from "vitest"
import { isPlaybackShortcut } from "../../utils/playbackKeyboard"

afterEach(() => document.body.replaceChildren())

function dispatch(target: EventTarget, init: KeyboardEventInit = {}) {
	const event = new KeyboardEvent("keydown", { key: "s", bubbles: true, composed: true, cancelable: true, ...init })
	let accepted = false
	target.addEventListener(
		"keydown",
		(e) => {
			accepted = isPlaybackShortcut(e as KeyboardEvent)
		},
		{ once: true },
	)
	target.dispatchEvent(event)
	return accepted
}

it.each(["s", "d"])("accepts the playback key %s outside an editor", (key) => {
	expect(dispatch(document.body, { key })).toBe(true)
	expect(dispatch(document, { key })).toBe(true)
})
it.each(["x", "S", "ArrowUp", "Enter"])("leaves other keys alone: %s", (key) => {
	expect(dispatch(document.body, { key })).toBe(false)
})
it.each(["ctrlKey", "metaKey", "altKey", "shiftKey", "isComposing"])(
	"leaves %s shortcuts and input composition alone",
	(flag) => {
		expect(dispatch(document.body, { [flag]: true })).toBe(false)
	},
)
it("respects a previously consumed event", () => {
	const event = new KeyboardEvent("keydown", { key: "d", cancelable: true })
	event.preventDefault()
	expect(isPlaybackShortcut(event)).toBe(false)
})
it.each(["input", "textarea", "select"])("never changes playback while editing a %s", (tag) => {
	const node = document.createElement(tag)
	document.body.append(node)
	expect(dispatch(node)).toBe(false)
})
it("handles editable descendants, inherited editability and explicitly noneditable islands", () => {
	document.body.innerHTML = '<div contenteditable><span>text</span></div><div contenteditable="false"></div>'
	expect(dispatch(document.querySelector("span")!)).toBe(false)
	expect(dispatch(document.querySelectorAll("div")[1])).toBe(true)
	const editable = document.createElement("div")
	Object.defineProperty(editable, "isContentEditable", { value: true })
	expect(dispatch(editable)).toBe(false)
})
it("detects text inputs inside a shadow root from the composed event path", () => {
	const host = document.createElement("div")
	document.body.append(host)
	const shadow = host.attachShadow({ mode: "open" })
	const input = document.createElement("input")
	shadow.append(input)
	let accepted = true
	document.addEventListener(
		"keydown",
		(event) => {
			accepted = isPlaybackShortcut(event)
		},
		{ once: true },
	)
	input.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true, composed: true }))
	expect(accepted).toBe(false)
})
