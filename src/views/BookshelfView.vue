<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/db'
import { useBookStore } from '@/stores/useBookStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import BottomTabBar from '@/components/BottomTabBar.vue'
import BookshelfBookList from '@/components/BookshelfBookList.vue'
import BookshelfEmptyState from '@/components/BookshelfEmptyState.vue'
import BookshelfHeader from '@/components/BookshelfHeader.vue'
import BookshelfInstallBanner from '@/components/BookshelfInstallBanner.vue'

const router = useRouter()
const bookStore = useBookStore()
const settings = useSettingsStore()
const fileInput = ref<HTMLInputElement | null>(null)
const progressMap = ref<Record<number, { percent: number; totalSeconds: number }>>({})
const chapterMetaMap = ref<Record<number, { currentChapterTitle: string; lastChapterTitle: string; remainingChapters: number }>>({})
const dragging = ref(false)
const showInstallBanner = ref(false)
const showMenu = ref(false)
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

const viewStyle = computed(() => ({
  backgroundColor: settings.appPalette.pageBg,
  color: settings.appPalette.text,
}))

const importErrorStyle = computed(() =>
  settings.isEink
    ? {
        backgroundColor: settings.appPalette.primarySoftBg,
        color: settings.appPalette.text,
      }
    : undefined,
)

const dragStyle = computed(() =>
  dragging.value
    ? { boxShadow: `inset 0 0 0 2px ${settings.appPalette.primaryBg}` }
    : undefined,
)

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

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function closeMenu() {
  showMenu.value = false
}

function applySort(mode: typeof sortMode.value) {
  sortMode.value = mode
  closeMenu()
}

function openImportPicker() {
  closeMenu()
  fileInput.value?.click()
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  await bookStore.loadBooks()
  await loadBookshelfMeta()
})

onUnmounted(() => {
  closeMenu()
})

async function loadBookshelfMeta() {
  const [allProgress, allChapters] = await Promise.all([db.progress.toArray(), db.chapters.toArray()])
  const nextProgressMap: Record<number, { percent: number; totalSeconds: number }> = {}
  const nextChapterMetaMap: Record<number, { currentChapterTitle: string; lastChapterTitle: string; remainingChapters: number }> = {}

  const progressByBookId = new Map(allProgress.map((progress) => [progress.bookId, progress]))
  const chaptersByBookId = new Map<number, typeof allChapters>()

  for (const chapter of allChapters.sort((a, b) => a.bookId - b.bookId || a.index - b.index)) {
    const chapters = chaptersByBookId.get(chapter.bookId) ?? []
    chapters.push(chapter)
    chaptersByBookId.set(chapter.bookId, chapters)
  }

  for (const book of bookStore.books) {
    if (book.id === undefined) continue
    const progress = progressByBookId.get(book.id)
    const chapters = chaptersByBookId.get(book.id) ?? []
    const currentIndex = Math.max(0, progress?.chapterIndex ?? 0)
    const currentChapter = chapters[currentIndex]
    const lastChapter = chapters.at(-1)

    if (progress) {
      nextProgressMap[book.id] = { percent: progress.percent, totalSeconds: progress.totalSeconds ?? 0 }
    }

    nextChapterMetaMap[book.id] = {
      currentChapterTitle: currentChapter?.title ?? '暂无目录',
      lastChapterTitle: lastChapter?.title ?? '暂无目录',
      remainingChapters: Math.max(book.chapterCount - (progress ? progress.chapterIndex + 1 : 0), 0),
    }
  }

  progressMap.value = nextProgressMap
  chapterMetaMap.value = nextChapterMetaMap
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
  await loadBookshelfMeta()
}

function openBook(bookId: number | undefined) {
  if (bookId === undefined) return
  closeMenu()
  void router.push(`/reader/${bookId}`)
}

function openBookDetail(bookId: number | undefined) {
  if (bookId === undefined) return
  closeMenu()
  void router.push(`/books/${bookId}`)
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
    class="h-screen flex flex-col"
    :style="[viewStyle, dragStyle]"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <BookshelfHeader
      :show-menu="showMenu"
      :sort-mode="sortMode"
      :sort-labels="sortLabels"
      @toggle-menu="toggleMenu"
      @close-menu="closeMenu"
      @apply-sort="applySort"
      @open-import="openImportPicker"
    />

    <BookshelfInstallBanner
      :visible="showInstallBanner"
      @install="installApp"
      @close="showInstallBanner = false"
    />

    <!-- Book list -->
    <div class="flex-1 overflow-y-auto pb-2">
      <!-- Error -->
      <div v-if="bookStore.importError" class="mx-4 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl" :style="importErrorStyle">
        {{ bookStore.importError }}
      </div>

      <!-- Importing indicator -->
      <div v-if="bookStore.importing" class="flex items-center justify-center gap-3 py-6" :style="{ color: settings.appPalette.textSecondary }">
        <div class="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <span class="text-sm">正在导入，请稍候…</span>
      </div>

      <!-- Empty state -->
      <BookshelfEmptyState v-if="bookStore.books.length === 0 && !bookStore.importing" />

      <BookshelfBookList
        :books="sortedBooks"
        :chapter-meta-map="chapterMetaMap"
        :progress-map="progressMap"
        @open="openBook"
        @open-detail="openBookDetail"
      />
    </div>

    <BottomTabBar active="bookshelf" />

    <input ref="fileInput" type="file" accept=".txt" multiple class="hidden" @change="onFileChange" />
  </div>
</template>
