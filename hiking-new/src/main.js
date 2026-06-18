import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './styles/main.css'

console.log('[徒步中国] Starting app...')
const app = createApp(App)
console.log('[徒步中国] App created, installing router...')
app.use(router)
console.log('[徒步中国] Mounting...')
app.mount('#app')
console.log('[徒步中国] Mounted!')
