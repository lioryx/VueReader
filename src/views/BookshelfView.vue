<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/db'
import { useBookStore } from '@/stores/useBookStore'
import BookCard from '@/components/BookCard.vue'

const router = useRouter()
const bookStore = useBookStore()
const fileInput = ref<HTMLInputElement | null>(null)
const progressMap = ref<Record<number, { percent: number; totalSeconds: number }>>({})
const dragging = ref(false)
const showInstallBanner = ref(false)
let deferredInstallPrompt: Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null = null

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredInstallPrompt = e as typeof deferredInstallPrompt
  showInstallBanner.value = true
}

async function installApp() {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  const { outcome } = await deferredInstallPrompt.userChoice
  if (outcome === 'accepted') showInstallBanner.value = false
  deferredInstallPrompt = null
}

const sortMode = ref<'date' | 'title' | 'progress'>('date')

const sortLabels: Record<typeof sortMode.value, string> = { date: '最新', title: '书名', progress: '进度' }

const sortedBooks = computed(() => {
  const books = [...bookStore.books]
  if (sortMode.value === 'title') {
    books.sort((a, b) => a.title.localeCompare(b.title, 'zh'))
  } else if (sortMode.value === 'progress') {
    books.sort((a, b) => {
      const pa = a.id !== undefined ? (progressMap.value[a.id]?.percent ?? 0) : 0
      const pb = b.id !== undefined ? (progressMap.value[b.id]?.percent ?? 0) : 0
      return pb - pa
    })
  }
  return books
})

function cycleSortMode() {
  const modes: Array<typeof sortMode.value> = ['date', 'title', 'progress']
  const idx = modes.indexOf(sortMode.value)
  sortMode.value = modes[(idx + 1) % modes.length] ?? 'date'
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  await bookStore.loadBooks()
  await loadProgressMap()
})

async function loadProgressMap() {
  const all = await db.progress.toArray()
  const map: Record<number, { percent: number; totalSeconds: number }> = {}
  for (const p of all) map[p.bookId] = { percent: p.percent, totalSeconds: p.totalSeconds ?? 0 }
  progressMap.value = map
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) void handleImportFiles(Array.from(files))
  ;(e.target as HTMLInputElement).value = ''
}

async function handleImportFiles(files: File[]) {
  const txts = files.filter((f) => f.name.toLowerCase().endsWith('.txt'))
  if (txts.length === 0) { alert('请选择 TXT 文件'); return }
  for (const file of txts) {
    await bookStore.importBook(file)
  }
  await loadProgressMap()
}

function openBook(bookId: number | undefined) {
  if (bookId === undefined) return
  void router.push(`/reader/${bookId}`)
}

async function deleteBook(bookId: number) {
  if (!confirm('确定删除这本书吗？')) return
  await bookStore.deleteBook(bookId)
  delete progressMap.value[bookId]
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  const files = e.dataTransfer?.files
  if (files) await handleImportFiles(Array.from(files))
}
</script>

<template>
  <div
    class="h-screen flex flex-col bg-gray-50"
    :class="dragging ? 'ring-2 ring-indigo-400 ring-inset' : ''"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Navbar -->
    <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100" style="padding-top: calc(env(safe-area-inset-top) + 0.75rem)">
      <h1 class="text-lg font-bold text-gray-900">书架</h1>
      <div class="flex items-center gap-3">
        <button
          class="text-xs text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg font-medium"
          @click="cycleSortMode"
        >
          {{ sortLabels[sortMode] }}
        </button>
        <button class="text-indigo-600 text-sm font-medium" @click="router.push('/settings')">设置</button>
      </div>
    </div>

    <!-- PWA install banner -->
    <Transition name="slide-down">
      <div v-if="showInstallBanner" class="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white text-sm">
        <div class="flex-1">
          <p class="font-medium">安装到主屏幕</p>
          <p class="text-xs opacity-80 mt-0.5">离线阅读，体验更佳</p>
        </div>
        <button class="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-semibold" @click="installApp">安装</button>
        <button class="opacity-60" @click="showInstallBanner = false">✕</button>
      </div>
    </Transition>

    <!-- Book list -->
    <div class="flex-1 overflow-y-auto pb-24">
      <!-- Error -->
      <div v-if="bookStore.importError" class="mx-4 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
        {{ bookStore.importError }}
      </div>

      <!-- Importing indicator -->
      <div v-if="bookStore.importing" class="flex items-center justify-center gap-3 py-6 text-gray-500">
        <div class="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <span class="text-sm">正在导入，请稍候…</span>
      </div>

      <!-- Empty state -->
      <div v-if="bookStore.books.length === 0 && !bookStore.importing" class="flex flex-col items-center justify-center mt-24 text-gray-400">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <p class="text-base font-medium">书架空空如也</p>
        <p class="text-sm mt-1">点击下方按钮或拖入 TXT 文件</p>
      </div>

      <!-- Books -->
      <div class="p-4 space-y-3">
        <div
          v-for="book in sortedBooks"
          :key="book.id"
          class="cursor-pointer active:scale-[0.98] transition-transform"
          @click="openBook(book.id)"
        >
          <BookCard
            :book="book"
            :progress="book.id !== undefined ? progressMap[book.id]?.percent : undefined"
            :total-seconds="book.id !== undefined ? progressMap[book.id]?.totalSeconds : undefined"
            @delete="deleteBook"
          />
        </div>
      </div>
    </div>

    <!-- Import button -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
      <input ref="fileInput" type="file" accept=".txt" multiple class="hidden" @change="onFileChange" />
      <button
        class="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-base active:bg-indigo-700 transition-colors disabled:opacity-60"
        :disabled="bookStore.importing"
        @click="fileInput?.click()"
      >
        + 导入书籍
      </button>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.25s ease, opacity 0.25s ease;
  overflow: hidden;
  max-height: 80px;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
