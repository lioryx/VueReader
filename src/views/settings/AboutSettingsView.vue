<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { db } from '@/db'

const bookCount = ref(0)
const bookmarkCount = ref(0)
const buildInfo = computed(() => import.meta.env.MODE)

onMounted(async () => {
  const [books, bookmarks] = await Promise.all([db.books.count(), db.bookmarks.count()])
  bookCount.value = books
  bookmarkCount.value = bookmarks
})
</script>

<template>
  <SettingsPageShell title="关于">
    <div class="space-y-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="text-base font-semibold">静读</h2>
        <p class="mt-2 text-sm text-gray-500">一个专注本地 TXT 阅读体验的轻量阅读器。</p>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm space-y-3 text-sm text-gray-600">
        <div class="flex items-center justify-between"><span>运行模式</span><span>{{ buildInfo }}</span></div>
        <div class="flex items-center justify-between"><span>书籍数量</span><span>{{ bookCount }}</span></div>
        <div class="flex items-center justify-between"><span>书签数量</span><span>{{ bookmarkCount }}</span></div>
        <div class="flex items-center justify-between"><span>数据存储</span><span>IndexedDB</span></div>
      </div>
    </div>
  </SettingsPageShell>
</template>
