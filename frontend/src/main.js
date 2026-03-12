import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 移除默认的 style.css，因为我们会自己写样式
// import './style.css'

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

app.mount('#app')