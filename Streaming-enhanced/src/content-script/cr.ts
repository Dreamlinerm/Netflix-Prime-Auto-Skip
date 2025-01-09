import { createApp } from "vue"
import { createPinia } from "pinia"
import { useOptionsStore } from "@/stores/options.store"

// Create a Vue app
const app = createApp({})

// Create a Pinia instance
const pinia = createPinia()

// Use Pinia with the Vue app
app.use(pinia)

// Mount the app to a DOM element if needed
// app.mount('#app')

// Now you can use the store
const optionsStore = useOptionsStore()

console.log("cr.ts")
console.log(optionsStore.settings)
