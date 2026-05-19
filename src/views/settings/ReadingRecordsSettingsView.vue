<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { db, type Book, type Progress } from '@/db'

interface RecordRow {
  bookId: number
  title: string
  percent: number
  totalSeconds: number
  updatedAt: Date
}

const rows = ref<RecordRow[]>([])
const totalReadSecs = ref(0)
const totalBooks = ref(0)
const hasRows = computed(() => rows.value.length > 0)

onMounted(async () => {
  const [allProgress, allBooks] = await Promise.all([db.progress.toArray(), db.books.toArray()])
  const bookMap = new Map<number, Book>(allBooks.filter((book) => book.id !== undefined).map((book) => [book.id!, book]))

  rows.value = allProgress
    .filter((progress): progress is Progress & { bookId: number } => progress.bookId !== undefined)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((progress) => ({
      bookId: progress.bookId,
      title: bookMap.get(progress.bookId)?.title ?? '未知书籍',
      percent: progress.percent,
      totalSeconds: progress.totalSeconds ?? 0,
      updatedAt: new Date(progress.updatedAt),
    }))

  totalReadSecs.value = rows.value.reduce((sum, row) => sum + row.totalSeconds, 0)
  totalBooks.value = rows.value.length
})

function formatTime(secs: number) {
  if (secs < 60) return '< 1 分钟'
  const hours = Math.floor(secs / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  return hours > 0 ? `${hours} 小时 ${mins} 分钟` : `${mins} 分钟`
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <SettingsPageShell title="阅读记录" subtitle="阅读时间记录">
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-base font-bold text-indigo-600">{{ totalBooks }}</p>
        <p class="mt-1 text-sm text-gray-500">有记录书籍</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-base font-bold text-indigo-600">{{ formatTime(totalReadSecs) }}</p>
        <p class="mt-1 text-sm text-gray-500">总阅读时长</p>
      </div>
    </div>

    <div v-if="!hasRows" class="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-sm">还没有阅读记录</div>
    <div v-else class="space-y-3">
      <div v-for="row in rows" :key="row.bookId" class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ row.title }}</p>
            <p class="mt-1 text-sm text-gray-500">最后阅读：{{ formatDate(row.updatedAt) }}</p>
          </div>
          <p class="text-sm font-medium text-indigo-600">{{ Math.round(row.percent * 100) }}%</p>
        </div>
        <p class="mt-3 text-sm text-gray-500">累计阅读 {{ formatTime(row.totalSeconds) }}</p>
      </div>
    </div>
  </SettingsPageShell>
</template>
