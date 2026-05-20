import { createRouter, createWebHistory } from 'vue-router'
import BookshelfView from '@/views/BookshelfView.vue'
import BookDetailView from '@/views/BookDetailView.vue'
import ReaderCatalogView from '@/views/ReaderCatalogView.vue'
import ReaderView from '@/views/ReaderView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AboutSettingsView from '@/views/settings/AboutSettingsView.vue'
import BackupSettingsView from '@/views/settings/BackupSettingsView.vue'
import BookmarksSettingsView from '@/views/settings/BookmarksSettingsView.vue'
import FileManagementSettingsView from '@/views/settings/FileManagementSettingsView.vue'
import OtherSettingsView from '@/views/settings/OtherSettingsView.vue'
import ReadingRecordsSettingsView from '@/views/settings/ReadingRecordsSettingsView.vue'
import RuleSettingsView from '@/views/settings/RuleSettingsView.vue'
import ThemeModeSettingsView from '@/views/settings/ThemeModeSettingsView.vue'
import ThemeSettingsView from '@/views/settings/ThemeSettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: BookshelfView },
    { path: '/books/:bookId', component: BookDetailView },
    { path: '/reader/:bookId', component: ReaderView },
    { path: '/reader/:bookId/catalog', component: ReaderCatalogView },
    { path: '/settings', component: SettingsView },
    { path: '/settings/theme', component: ThemeSettingsView },
    { path: '/settings/other', component: OtherSettingsView },
    { path: '/settings/backup', component: BackupSettingsView },
    { path: '/settings/bookmarks', component: BookmarksSettingsView },
    { path: '/settings/records', component: ReadingRecordsSettingsView },
    { path: '/settings/files', component: FileManagementSettingsView },
    { path: '/settings/about', component: AboutSettingsView },
    { path: '/settings/theme-mode', component: ThemeModeSettingsView },
    { path: '/settings/rules/:kind', component: RuleSettingsView },
  ],
})

export default router
