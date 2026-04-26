import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type Book } from '@/db'
import type { ParseResult } from '@/workers/parser.worker'

function runParser(buffer: ArrayBuffer): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<ParseResult>) => { worker.terminate(); resolve(e.data) }
    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message)) }
    worker.postMessage(buffer, [buffer])
  })
}

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])
  const importing = ref(false)
  const importError = ref('')

  async function loadBooks() {
    books.value = await db.books.orderBy('importedAt').reverse().toArray()
  }

  async function importBook(file: File) {
    importing.value = true
    importError.value = ''
    try {
      const buffer = await file.arrayBuffer()
      const { encoding, text, chapters: parsed } = await runParser(buffer)

      await db.transaction('rw', db.books, db.contents, db.chapters, async () => {
        const id = (await db.books.add({
          title: file.name.replace(/\.txt$/i, ''),
          size: file.size,
          encoding,
          importedAt: new Date(),
          chapterCount: parsed.length,
        })) as number

        await db.contents.add({ bookId: id, text })

        await db.chapters.bulkAdd(
          parsed.map((ch, i) => ({
            bookId: id,
            index: i,
            title: ch.title,
            offset: ch.offset,
            length: ch.length,
          })),
        )
      })

      await loadBooks()
    } catch (e) {
      importError.value = String(e)
    } finally {
      importing.value = false
    }
  }

  async function deleteBook(bookId: number) {
    await db.transaction('rw', [db.books, db.contents, db.chapters, db.progress, db.bookmarks], async () => {
      await Promise.all([
        db.books.delete(bookId),
        db.contents.where('bookId').equals(bookId).delete(),
        db.chapters.where('bookId').equals(bookId).delete(),
        db.progress.where('bookId').equals(bookId).delete(),
        db.bookmarks.where('bookId').equals(bookId).delete(),
      ])
    })
    await loadBooks()
  }

  return { books, importing, importError, loadBooks, importBook, deleteBook }
})
