console.log("virtual-cursor.js")
// virtual-cursor.js
if (!window.virtualCursor) {
	window.virtualCursor = {
		x: Math.floor(window.innerWidth / 2 - 12),
		y: Math.floor(window.innerHeight / 2 - 12),
		step: 40,
		cursor: null,
		init: function () {
			if (this.cursor) return
			// Recalculate center in case of resize or reload
			this.x = Math.floor(window.innerWidth / 2 - 12)
			this.y = Math.floor(window.innerHeight / 2 - 12)
			this.cursor = document.createElement("div")
			this.cursor.style.position = "fixed"
			this.cursor.style.width = "24px"
			this.cursor.style.height = "24px"
			this.cursor.style.background = "rgba(0,150,255,0.7)"
			this.cursor.style.borderRadius = "50%"
			this.cursor.style.zIndex = 999999
			this.cursor.style.pointerEvents = "none"
			this.cursor.style.left = this.x + "px"
			this.cursor.style.top = this.y + "px"
			document.body.appendChild(this.cursor)
		},
		move: function (dx, dy) {
			const viewportHeight = window.innerHeight
			const cursorBottom = this.y + 24
			const cursorTop = this.y
			const scrollStep = this.step

			// Check for vertical movement
			if (dy !== 0) {
				if (
					dy > 0 &&
					cursorBottom + this.step > viewportHeight // moving down, near bottom
				) {
					window.scrollBy(0, scrollStep)
					return
				}
				if (
					dy < 0 &&
					cursorTop - this.step < 0 // moving up, near top
				) {
					window.scrollBy(0, -scrollStep)
					return
				}
			}

			this.x += dx * this.step
			this.y += dy * this.step
			this.cursor.style.left = this.x + "px"
			this.cursor.style.top = this.y + "px"

			// Fire hover event on the element under the cursor
			const el = document.elementFromPoint(this.x + 12, this.y + 12)
			if (el) {
				const mouseOverEvent = new MouseEvent("mouseover", {
					bubbles: true,
					clientX: this.x + 12,
					clientY: this.y + 12
				})
				el.dispatchEvent(mouseOverEvent)
			}

			// Show cursor and reset hide timer
			this.cursor.style.display = "block"
			if (this._hideTimeout) clearTimeout(this._hideTimeout)
			this._hideTimeout = setTimeout(() => {
				this.cursor.style.display = "none"
			}, 1200)
		},
		click: function () {
			var el = document.elementFromPoint(this.x + 12, this.y + 12)
			//const childButton = el.closest("button");
			//if (childButton){
			//console.log("child", childButton)
			//childButton.click()}
			if (el) {
				console.log("el", el)
				el.click()
			}
		},
	}
	window.virtualCursor.init()
	console.log("window.virtualCursor initialized")
}
