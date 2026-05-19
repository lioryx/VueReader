<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { db, type Book } from '@/db'

const books = ref<Book[]>([])
const totalSize = computed(() => books.value.reduce((sum, book) => sum + book.size, 0))

onMounted(async () => {
  books.value = await db.books.orderBy('importedAt').reverse().toArray()
})

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(date: Date) {
  const value = new Date(date)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <SettingsPageShell title="文件管理" subtitle="管理私有文件夹的文件">
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-base font-bold text-indigo-600">{{ books.length }}</p>
        <p class="mt-1 text-sm text-gray-500">已导入文件</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-base font-bold text-indigo-600">{{ formatSize(totalSize) }}</p>
        <p class="mt-1 text-sm text-gray-500">占用空间</p>
      </div>
    </div>

    <div v-if="books.length === 0" class="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-sm">还没有可管理的文件</div>
    <div v-else class="space-y-3">
      <div v-for="book in books" :key="book.id" class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="font-semibold truncate">{{ book.title }}</p>
        <p class="mt-1 text-sm text-gray-500">{{ book.chapterCount }} 章 · {{ formatSize(book.size) }}</p>
        <p class="mt-2 text-xs text-gray-400">导入时间：{{ formatDate(book.importedAt) }}</p>
      </div>
    </div>
  </SettingsPageShell>
</template>
