import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, type Book, type Bookmark, type Chapter } from '@/db'

export const useReaderStore = defineStore('reader', () => {
  const book = ref<Book | null>(null)
  const chapters = ref<Chapter[]>([])
  const chapterIndex = ref(0)
  const fullText = ref('')
  const bookmarks = ref<Bookmark[]>([])

  const currentChapter = computed<Chapter | undefined>(() => chapters.value[chapterIndex.value])

  const chapterText = computed(() => {
    const ch = currentChapter.value
    if (!ch) return ''
    return fullText.value.substring(ch.offset, ch.offset + ch.length)
  })

  async function openBook(bookId: number) {
    book.value = (await db.books.get(bookId)) ?? null
    chapters.value = await db.chapters.where('bookId').equals(bookId).sortBy('index')
    const stored = await db.contents.where('bookId').equals(bookId).first()
    fullText.value = stored?.text ?? ''

    const prog = await db.progress.where('bookId').equals(bookId).first()
    chapterIndex.value = prog?.chapterIndex ?? 0

    await loadBookmarks(bookId)
  }

  async function loadBookmarks(bookId: number) {
    bookmarks.value = await db.bookmarks.where('bookId').equals(bookId).sortBy('chapterIndex')
  }

  async function addBookmark(note?: string) {
    const bookId = book.value?.id
    if (bookId === undefined) return
    await db.bookmarks.add({
      bookId,
      chapterIndex: chapterIndex.value,
      charOffset: 0,
      note: note ?? currentChapter.value?.title ?? '书签',
      createdAt: new Date(),
    })
    await loadBookmarks(bookId)
  }

  async function removeBookmark(id: number) {
    const bookId = book.value?.id
    if (bookId === undefined) return
    await db.bookmarks.delete(id)
    await loadBookmarks(bookId)
  }

  async function saveProgress(charOffset = 0, sessionSeconds = 0) {
    const bookId = book.value?.id
    if (bookId === undefined) return
    const ch = currentChapter.value
    const total = fullText.value.length
    const percent = total > 0 && ch ? (ch.offset + charOffset) / total : 0

    const existing = await db.progress.where('bookId').equals(bookId).first()
    const prevSecs = existing?.totalSeconds ?? 0
    const record = {
      bookId,
      chapterIndex: chapterIndex.value,
      charOffset,
      percent,
      totalSeconds: prevSecs + sessionSeconds,
      updatedAt: new Date(),
    }
    if (existing?.id !== undefined) {
      await db.progress.update(existing.id, record)
    } else {
      await db.progress.add(record)
    }
  }

  function prevChapter() {
    if (chapterIndex.value > 0) {
      chapterIndex.value--
      void saveProgress()
    }
  }

  function nextChapter() {
    if (chapterIndex.value < chapters.value.length - 1) {
      chapterIndex.value++
      void saveProgress()
    }
  }

  function goToChapter(index: number) {
    if (index >= 0 && index < chapters.value.length) {
      chapterIndex.value = index
      void saveProgress()
    }
  }

  return {
    book, chapters, chapterIndex, currentChapter, chapterText, fullText,
    bookmarks, addBookmark, removeBookmark,
    openBook, saveProgress, prevChapter, nextChapter, goToChapter,
  }
})
