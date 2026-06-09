<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, type Book, type Chapter, type Progress } from '@/db'
import { useBookStore } from '@/stores/useBookStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const settings = useSettingsStore()

const book = ref<Book | null>(null)
const progress = ref<Progress | null>(null)
const bookmarkCount = ref(0)
const lastChapter = ref<Chapter | null>(null)
const currentChapter = ref<Chapter | null>(null)
const previewText = ref('')
const loading = ref(true)

onMounted(async () => {
  const bookId = Number(route.params['bookId'])
  if (Number.isNaN(bookId)) {
    void router.replace('/')
    return
  }

  const [bookRecord, progressRecord, bookmarks, chapters, content] = await Promise.all([
    db.books.get(bookId),
    db.progress.get({ bookId }),
    db.bookmarks.where('bookId').equals(bookId).count(),
    db.chapters.where('bookId').equals(bookId).sortBy('index'),
    db.contents.get({ bookId }),
  ])

  if (!bookRecord) {
    void router.replace('/')
    return
  }

  book.value = bookRecord
  progress.value = progressRecord ?? null
  bookmarkCount.value = bookmarks
  lastChapter.value = chapters.at(-1) ?? null
  currentChapter.value = progressRecord ? (chapters[progressRecord.chapterIndex] ?? null) : null
  previewText.value = (content?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 180)
  loading.value = false
})

const pageStyle = computed(() => ({
  backgroundColor: settings.appPalette.pageBg,
  color: settings.appPalette.text,
}))

const headerStyle = computed(() => ({
  backgroundColor: settings.appPalette.headerBg,
  borderColor: settings.appPalette.border,
}))

const mutedTextStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const faintTextStyle = computed(() => ({
  color: settings.appPalette.textMuted,
}))

const coverStyle = computed(() => ({
  background: settings.isEink
    ? `linear-gradient(135deg, ${settings.appPalette.primaryBg} 0%, ${settings.appPalette.textSecondary} 100%)`
    : 'linear-gradient(160deg, #8f7a54 0%, #d7c8af 46%, #564834 100%)',
  color: settings.appPalette.primaryText,
  boxShadow: settings.appPalette.shadow,
}))

const statCardStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  borderColor: settings.appPalette.border,
  boxShadow: settings.appPalette.shadow,
}))

const infoRowStyle = computed(() => ({
  borderColor: settings.appPalette.border,
}))

const primaryButtonStyle = computed(() => ({
  backgroundColor: settings.appPalette.primaryBg,
  color: settings.appPalette.primaryText,
}))

const secondaryButtonStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  color: settings.appPalette.text,
  borderColor: settings.appPalette.border,
}))

const dangerButtonStyle = computed(() => ({
  backgroundColor: settings.isEink ? settings.appPalette.surfaceBg : settings.appPalette.primarySoftBg,
  color: settings.isEink ? settings.appPalette.text : '#b91c1c',
  borderColor: settings.appPalette.border,
}))

const progressWidth = computed(() => `${Math.round((progress.value?.percent ?? 0) * 100)}%`)

const detailRows = computed(() => {
  if (!book.value) return []
  return [
    { label: '章节数', value: `${book.value.chapterCount} 章` },
    { label: '文件大小', value: formatSize(book.value.size) },
    { label: '编码', value: book.value.encoding.toUpperCase() },
    { label: '导入时间', value: formatDateTime(book.value.importedAt) },
    { label: '阅读进度', value: `${Math.round((progress.value?.percent ?? 0) * 100)}%` },
    { label: '已读时长', value: formatReadTime(progress.value?.totalSeconds ?? 0) || '未记录' },
    { label: '当前位置', value: currentChapter.value?.title ?? '尚未开始阅读' },
    { label: '书签数量', value: `${bookmarkCount.value} 个` },
    { label: '末章标题', value: lastChapter.value?.title ?? '暂无目录' },
  ]
})

function openReader() {
  if (!book.value?.id) return
  void router.push(`/reader/${book.value.id}`)
}

function openCatalog() {
  if (!book.value?.id) return
  void router.push(`/reader/${book.value.id}/catalog`)
}

async function removeBook() {
  if (!book.value?.id) return
  if (!confirm('确定删除这本书吗？')) return
  await bookStore.deleteBook(book.value.id)
  void router.replace('/')
}

function goBack() {
  if (window.history.length > 1) {
    void router.back()
    return
  }
  void router.replace('/')
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(date: Date) {
  const value = new Date(date)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

function formatReadTime(secs: number) {
  if (secs < 60) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}小时${m}分` : `${m}分钟`
}
</script>

<template>
  <div class="h-full flex flex-col" :style="pageStyle">
    <div class="border-b px-4 pb-4" :style="headerStyle" style="padding-top: calc(env(safe-area-inset-top) + 0.75rem)">
      <div class="flex items-center gap-2 pt-1">
        <button class="p-2 -ml-2" :style="mutedTextStyle" @click="goBack">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-semibold">书籍信息</h1>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-sm" :style="faintTextStyle">
      正在加载书籍信息…
    </div>

    <div v-else-if="book" class="flex-1 overflow-y-auto px-5 pb-32 pt-6">
      <div class="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <div class="h-44 w-32 rounded-2xl flex items-center justify-center text-3xl font-bold tracking-[0.2em]" :style="coverStyle">
          TXT
        </div>
        <h2 class="mt-6 text-3xl font-semibold leading-tight">{{ book.title }}</h2>
        <p class="mt-3 text-sm" :style="mutedTextStyle">
          本地导入文本 · {{ book.encoding.toUpperCase() }}
        </p>

        <div class="mt-5 flex w-full items-center gap-2 text-sm">
          <span class="rounded-full px-3 py-1.5" :style="statCardStyle">{{ book.chapterCount }} 章</span>
          <span class="rounded-full px-3 py-1.5" :style="statCardStyle">{{ formatSize(book.size) }}</span>
          <span class="rounded-full px-3 py-1.5" :style="statCardStyle">{{ bookmarkCount }} 个书签</span>
        </div>
      </div>

      <div class="mt-8 rounded-3xl border p-5" :style="statCardStyle">
        <div class="flex items-center justify-between text-sm">
          <span :style="mutedTextStyle">阅读进度</span>
          <span class="font-medium">{{ Math.round((progress?.percent ?? 0) * 100) }}%</span>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full" :style="{ backgroundColor: settings.appPalette.surfaceMuted }">
          <div class="h-full rounded-full" :style="{ width: progressWidth, backgroundColor: settings.appPalette.primaryBg }" />
        </div>
        <p class="mt-3 text-sm leading-6" :style="mutedTextStyle">
          {{ currentChapter?.title ?? '尚未开始阅读' }}
          <span v-if="progress?.totalSeconds && progress.totalSeconds >= 60"> · {{ formatReadTime(progress.totalSeconds) }}</span>
        </p>
      </div>

      <div class="mt-5 rounded-3xl border px-5" :style="statCardStyle">
        <div v-for="row in detailRows" :key="row.label" class="flex items-start justify-between gap-4 border-b py-4 last:border-b-0" :style="infoRowStyle">
          <span class="shrink-0 text-sm" :style="mutedTextStyle">{{ row.label }}</span>
          <span class="text-right text-sm leading-6">{{ row.value }}</span>
        </div>
      </div>

      <div v-if="previewText" class="mt-5 rounded-3xl border p-5" :style="statCardStyle">
        <p class="text-sm" :style="mutedTextStyle">内容预览</p>
        <p class="mt-3 text-base leading-8" :style="faintTextStyle">{{ previewText }}</p>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 border-t px-4 pt-3" :style="[headerStyle, { paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }]">
      <div class="grid grid-cols-3 gap-3">
        <button class="rounded-2xl border px-4 py-3 text-base font-medium" :style="dangerButtonStyle" @click="removeBook">删除书籍</button>
        <button class="rounded-2xl border px-4 py-3 text-base font-medium" :style="secondaryButtonStyle" @click="openCatalog">查看目录</button>
        <button class="rounded-2xl px-4 py-3 text-base font-semibold" :style="primaryButtonStyle" @click="openReader">继续阅读</button>
      </div>
    </div>
  </div>
</template>
