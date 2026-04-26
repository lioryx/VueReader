import { createRouter, createWebHistory } from 'vue-router'
import BookshelfView from '@/views/BookshelfView.vue'
import ReaderView from '@/views/ReaderView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: BookshelfView },
    { path: '/reader/:bookId', component: ReaderView },
    { path: '/settings', component: SettingsView },
  ],
})

export default router
