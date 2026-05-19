<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { db, type Book, type Bookmark, type Chapter } from '@/db'

interface BookmarkRow {
  id: number
  note: string
  bookTitle: string
  chapterTitle: string
  createdAt: Date
}

const bookmarks = ref<BookmarkRow[]>([])
const empty = computed(() => bookmarks.value.length === 0)

onMounted(async () => {
  const [allBookmarks, allBooks, allChapters] = await Promise.all([
    db.bookmarks.toArray(),
    db.books.toArray(),
    db.chapters.toArray(),
  ])

  const bookMap = new Map<number, Book>(allBooks.filter((book) => book.id !== undefined).map((book) => [book.id!, book]))
  const chapterMap = new Map<string, Chapter>(allChapters.map((chapter) => [`${chapter.bookId}-${chapter.index}`, chapter]))

  bookmarks.value = allBookmarks
    .filter((bookmark): bookmark is Bookmark & { id: number } => bookmark.id !== undefined)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((bookmark) => ({
      id: bookmark.id,
      note: bookmark.note || '书签',
      bookTitle: bookMap.get(bookmark.bookId)?.title ?? '未知书籍',
      chapterTitle: chapterMap.get(`${bookmark.bookId}-${bookmark.chapterIndex}`)?.title ?? `第 ${bookmark.chapterIndex + 1} 章`,
      createdAt: new Date(bookmark.createdAt),
    }))
})

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function removeBookmark(id: number) {
  await db.bookmarks.delete(id)
  bookmarks.value = bookmarks.value.filter((bookmark) => bookmark.id !== id)
}
</script>

<template>
  <SettingsPageShell title="书签" subtitle="所有书签">
    <div v-if="empty" class="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-sm">还没有书签</div>
    <div v-else class="space-y-3">
      <div v-for="bookmark in bookmarks" :key="bookmark.id" class="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 truncate">{{ bookmark.note }}</p>
          <p class="mt-1 text-sm text-gray-500 truncate">{{ bookmark.bookTitle }} · {{ bookmark.chapterTitle }}</p>
          <p class="mt-2 text-xs text-gray-400">{{ formatDate(bookmark.createdAt) }}</p>
        </div>
        <button class="text-sm text-red-500" @click="removeBookmark(bookmark.id)">删除</button>
      </div>
    </div>
  </SettingsPageShell>
</template>
