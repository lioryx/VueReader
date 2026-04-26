<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { db, type Book, type BookContent, type Chapter, type Progress, type Bookmark } from '@/db'

const router = useRouter()
const settings = useSettingsStore()

const themes = [
  { value: 'light', label: '日间' },
  { value: 'dark', label: '夜间' },
  { value: 'sepia', label: '护眼' },
]

const showAddTheme = ref(false)
const newTheme = ref({ label: '', bg: '#e8f5e9', text: '#1b5e20' })

function perceivedLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function saveCustomTheme() {
  if (!newTheme.value.label.trim()) return
  const id = `custom-${Date.now()}`
  settings.customThemes.push({
    id,
    label: newTheme.value.label.trim(),
    bg: newTheme.value.bg,
    text: newTheme.value.text,
    dark: perceivedLuminance(newTheme.value.bg) < 0.5,
  })
  settings.theme = id
  newTheme.value = { label: '', bg: '#e8f5e9', text: '#1b5e20' }
  showAddTheme.value = false
}

function deleteCustomTheme(id: string) {
  const idx = settings.customThemes.findIndex((t) => t.id === id)
  if (idx !== -1) settings.customThemes.splice(idx, 1)
  if (settings.theme === id) settings.theme = 'light'
}

function adjustFontSize(delta: number) {
  settings.fontSize = Math.min(28, Math.max(12, settings.fontSize + delta))
}

function adjustLineHeight(delta: number) {
  settings.lineHeight = Math.round(Math.min(3.0, Math.max(1.2, settings.lineHeight + delta)) * 10) / 10
}

function adjustTtsRate(delta: number) {
  settings.ttsRate = Math.round(Math.min(2.0, Math.max(0.5, settings.ttsRate + delta)) * 10) / 10
}

// ── Backup ──────────────────────────────────────────────────────────────────

interface BackupData {
  version: number
  exportedAt: string
  books: Book[]
  contents: BookContent[]
  chapters: Chapter[]
  progress: Progress[]
  bookmarks: Bookmark[]
}

// ── Reading stats ────────────────────────────────────────────────────────────
const totalReadSecs = ref(0)
const totalBooks = ref(0)

onMounted(async () => {
  const [allProgress, allBooks] = await Promise.all([db.progress.toArray(), db.books.toArray()])
  totalReadSecs.value = allProgress.reduce((s, p) => s + (p.totalSeconds ?? 0), 0)
  totalBooks.value = allBooks.length
})

function formatTime(secs: number): string {
  if (secs < 60) return '< 1 分钟'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h} 小时 ${m} 分钟` : `${m} 分钟`
}

// ── Backup ──────────────────────────────────────────────────────────────────

const exporting = ref(false)
const importing = ref(false)
const backupMessage = ref('')
const backupFileInput = ref<HTMLInputElement | null>(null)

async function exportBackup() {
  exporting.value = true
  backupMessage.value = ''
  try {
    const [books, contents, chapters, progress, bookmarks] = await Promise.all([
      db.books.toArray(),
      db.contents.toArray(),
      db.chapters.toArray(),
      db.progress.toArray(),
      db.bookmarks.toArray(),
    ])
    const data: BackupData = { version: 1, exportedAt: new Date().toISOString(), books, contents, chapters, progress, bookmarks }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jingdu-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    backupMessage.value = `已导出 ${books.length} 本书`
  } catch (e) {
    backupMessage.value = `导出失败: ${String(e)}`
  } finally {
    exporting.value = false
  }
}

function onBackupFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) void importBackup(file)
    ; (e.target as HTMLInputElement).value = ''
}

async function importBackup(file: File) {
  if (!confirm('导入备份将覆盖当前所有书架数据，是否继续？')) return
  importing.value = true
  backupMessage.value = ''
  try {
    const json = await file.text()
    const data = JSON.parse(json) as BackupData
    if (data.version !== 1 || !Array.isArray(data.books)) throw new Error('无效的备份文件格式')

    // Restore dates from ISO strings
    const books = data.books.map((b) => ({ ...b, importedAt: new Date(b.importedAt) }))
    const progress = data.progress.map((p) => ({ ...p, updatedAt: new Date(p.updatedAt) }))
    const bookmarks = data.bookmarks.map((bm) => ({ ...bm, createdAt: new Date(bm.createdAt) }))

    await db.transaction('rw', [db.books, db.contents, db.chapters, db.progress, db.bookmarks], async () => {
      await db.books.clear()
      await db.contents.clear()
      await db.chapters.clear()
      await db.progress.clear()
      await db.bookmarks.clear()
      if (books.length) await db.books.bulkPut(books)
      if (data.contents.length) await db.contents.bulkPut(data.contents)
      if (data.chapters.length) await db.chapters.bulkPut(data.chapters)
      if (progress.length) await db.progress.bulkPut(progress)
      if (bookmarks.length) await db.bookmarks.bulkPut(bookmarks)
    })
    backupMessage.value = `已恢复 ${books.length} 本书`
  } catch (e) {
    backupMessage.value = `导入失败: ${String(e)}`
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Navbar -->
    <div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
      <button class="p-1 -ml-1 text-gray-600" @click="router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-base font-semibold text-gray-800">设置</h1>
    </div>

    <!-- Settings list -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- Font size -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">字体大小</p>
        <div class="flex items-center gap-4">
          <button
            class="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200 disabled:opacity-40"
            :disabled="settings.fontSize <= 12" @click="adjustFontSize(-1)">
            −
          </button>
          <span class="flex-1 text-center text-xl font-semibold text-gray-800">{{ settings.fontSize }}px</span>
          <button
            class="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200 disabled:opacity-40"
            :disabled="settings.fontSize >= 28" @click="adjustFontSize(1)">
            +
          </button>
        </div>
        <p class="mt-3 text-gray-500" :style="{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }">
          预览文字效果，静读带你畅游书海。
        </p>
      </div>

      <!-- Line height -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">行间距</p>
        <div class="flex items-center gap-4">
          <button
            class="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200 disabled:opacity-40"
            :disabled="settings.lineHeight <= 1.2" @click="adjustLineHeight(-0.1)">
            −
          </button>
          <span class="flex-1 text-center text-xl font-semibold text-gray-800">{{ settings.lineHeight.toFixed(1)
            }}</span>
          <button
            class="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200 disabled:opacity-40"
            :disabled="settings.lineHeight >= 3.0" @click="adjustLineHeight(0.1)">
            +
          </button>
        </div>
      </div>

      <!-- Font family -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">字体风格</p>
        <div class="flex gap-2">
          <button
            v-for="f in [{ value: 'system' as const, label: '正文体' }, { value: 'serif' as const, label: '衬线体' }, { value: 'mono' as const, label: '等宽体' }]"
            :key="f.value" class="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all" :class="settings.fontFamily === f.value
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'
              " @click="settings.fontFamily = f.value">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Reading mode -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">翻页模式</p>
        <div class="flex gap-2">
          <button class="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all" :class="settings.pageMode === 'scroll'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
              : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'
            " @click="settings.pageMode = 'scroll'">
            滚动
          </button>
          <button class="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all" :class="settings.pageMode === 'page'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
              : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'
            " @click="settings.pageMode = 'page'">
            翻页
          </button>
        </div>
      </div>

      <!-- TTS rate -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">朗读速度</p>
        <div class="flex items-center gap-4">
          <button
            class="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200 disabled:opacity-40"
            :disabled="settings.ttsRate <= 0.5" @click="adjustTtsRate(-0.1)">
            −
          </button>
          <span class="flex-1 text-center text-xl font-semibold text-gray-800">{{ settings.ttsRate.toFixed(1) }}x</span>
          <button
            class="w-9 h-9 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200 disabled:opacity-40"
            :disabled="settings.ttsRate >= 2.0" @click="adjustTtsRate(0.1)">
            +
          </button>
        </div>
      </div>

      <!-- Theme -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">阅读主题</p>
        <div class="flex flex-wrap gap-2">
          <!-- Built-in themes -->
          <button v-for="t in themes" :key="t.value"
            class="py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all"
            :class="settings.theme === t.value ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'"
            @click="settings.theme = t.value">
            {{ t.label }}
          </button>
          <!-- Custom themes -->
          <div v-for="t in settings.customThemes" :key="t.id" class="relative">
            <button class="py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5"
              :class="settings.theme === t.id ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'"
              @click="settings.theme = t.id">
              <span class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                :style="{ backgroundColor: t.bg }" />
              {{ t.label }}
            </button>
            <button
              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-400 text-white text-[10px] flex items-center justify-center leading-none"
              @click.stop="deleteCustomTheme(t.id)">×</button>
          </div>
          <!-- Add custom theme -->
          <button
            class="py-2 px-3 rounded-lg text-sm border-2 border-dashed border-gray-300 text-gray-400 active:bg-gray-50 transition-colors"
            @click="showAddTheme = !showAddTheme">＋</button>
        </div>

        <!-- Add theme form -->
        <div v-if="showAddTheme" class="mt-3 p-3 rounded-lg border border-gray-200 space-y-3">
          <input v-model="newTheme.label" type="text" placeholder="主题名称"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
          <div class="flex items-center gap-5">
            <label class="flex items-center gap-2 text-sm text-gray-600">
              背景色
              <input type="color" v-model="newTheme.bg" class="w-8 h-8 cursor-pointer rounded border-0" />
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-600">
              文字色
              <input type="color" v-model="newTheme.text" class="w-8 h-8 cursor-pointer rounded border-0" />
            </label>
          </div>
          <div class="rounded-lg p-2 text-sm border border-gray-200 transition-colors"
            :style="{ backgroundColor: newTheme.bg, color: newTheme.text }">
            预览：在静读中享受阅读的乐趣。
          </div>
          <div class="flex gap-2">
            <button
              class="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium active:bg-indigo-700 transition-colors"
              @click="saveCustomTheme">保存</button>
            <button
              class="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm active:bg-gray-200 transition-colors"
              @click="showAddTheme = false">取消</button>
          </div>
        </div>

        <!-- Theme preview -->
        <div class="mt-3 rounded-lg p-3 text-sm border transition-colors" :class="!settings.activeCustomTheme && {
          'bg-white text-gray-800 border-gray-200': settings.theme === 'light',
          'bg-gray-900 text-gray-100 border-gray-700': settings.theme === 'dark',
          'bg-green-50 text-gray-800 border-green-200': settings.theme === 'sepia',
        }" :style="settings.activeCustomTheme
            ? { backgroundColor: settings.activeCustomTheme.bg, color: settings.activeCustomTheme.text, fontSize: `${settings.fontSize}px`, lineHeight: String(settings.lineHeight) }
            : { fontSize: `${settings.fontSize}px`, lineHeight: String(settings.lineHeight) }">
          预览：在静读中享受阅读的乐趣，文字的海洋等你来探索。
        </div>
      </div>

      <!-- Reading stats -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">阅读统计</p>
        <div class="flex gap-3">
          <div class="flex-1 bg-indigo-50 rounded-xl p-3 text-center">
            <p class="text-2xl font-bold text-indigo-600">{{ totalBooks }}</p>
            <p class="text-xs text-gray-500 mt-0.5">本书</p>
          </div>
          <div class="flex-1 bg-indigo-50 rounded-xl p-3 text-center">
            <p class="text-lg font-bold text-indigo-600 leading-tight">{{ formatTime(totalReadSecs) }}</p>
            <p class="text-xs text-gray-500 mt-0.5">总阅读时长</p>
          </div>
        </div>
      </div>

      <!-- Backup -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">数据备份</p>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 active:bg-indigo-100 disabled:opacity-60 transition-colors"
            :disabled="exporting" @click="exportBackup">
            {{ exporting ? '导出中…' : '导出备份' }}
          </button>
          <button
            class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 active:bg-gray-200 disabled:opacity-60 transition-colors"
            :disabled="importing" @click="backupFileInput?.click()">
            {{ importing ? '导入中…' : '导入备份' }}
          </button>
        </div>
        <input ref="backupFileInput" type="file" accept=".json" class="hidden" @change="onBackupFileChange" />
        <p v-if="backupMessage" class="mt-2 text-xs text-center"
          :class="backupMessage.includes('失败') ? 'text-red-500' : 'text-green-600'">
          {{ backupMessage }}
        </p>
        <p class="mt-2 text-xs text-gray-400 leading-relaxed">
          备份包含书籍内容、阅读进度和书签。iOS Safari 建议定期备份。
        </p>
      </div>
    </div>
  </div>
</template>
