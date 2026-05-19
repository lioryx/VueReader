<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { db, type Book, type BookContent, type Chapter, type Progress, type Bookmark } from '@/db'

interface BackupData {
  version: number
  exportedAt: string
  books: Book[]
  contents: BookContent[]
  chapters: Chapter[]
  progress: Progress[]
  bookmarks: Bookmark[]
}

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
  } catch (error) {
    backupMessage.value = `导出失败: ${String(error)}`
  } finally {
    exporting.value = false
  }
}

function onBackupFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) void importBackup(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function importBackup(file: File) {
  if (!confirm('导入备份将覆盖当前所有书架数据，是否继续？')) return
  importing.value = true
  backupMessage.value = ''
  try {
    const json = await file.text()
    const data = JSON.parse(json) as BackupData
    if (data.version !== 1 || !Array.isArray(data.books)) throw new Error('无效的备份文件格式')

    const books = data.books.map((book) => ({ ...book, importedAt: new Date(book.importedAt) }))
    const progress = data.progress.map((item) => ({ ...item, updatedAt: new Date(item.updatedAt) }))
    const bookmarks = data.bookmarks.map((bookmark) => ({ ...bookmark, createdAt: new Date(bookmark.createdAt) }))

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
  } catch (error) {
    backupMessage.value = `导入失败: ${String(error)}`
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <SettingsPageShell title="备份与恢复" subtitle="导出或导入书架、进度与书签">
    <div class="bg-white rounded-2xl p-4 shadow-sm">
      <div class="flex gap-2">
        <button class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 disabled:opacity-60" :disabled="exporting" @click="exportBackup">
          {{ exporting ? '导出中…' : '导出备份' }}
        </button>
        <button class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 disabled:opacity-60" :disabled="importing" @click="backupFileInput?.click()">
          {{ importing ? '导入中…' : '导入备份' }}
        </button>
      </div>
      <input ref="backupFileInput" type="file" accept=".json" class="hidden" @change="onBackupFileChange" />
      <p v-if="backupMessage" class="mt-3 text-sm" :class="backupMessage.includes('失败') ? 'text-red-500' : 'text-green-600'">{{ backupMessage }}</p>
      <p class="mt-3 text-sm text-gray-400 leading-relaxed">备份包含书籍内容、阅读进度和书签。导入会覆盖本地已有数据。</p>
    </div>
  </SettingsPageShell>
</template>
