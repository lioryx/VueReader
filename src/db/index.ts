import Dexie, { type Table } from 'dexie'

export interface Book {
  id?: number
  title: string
  size: number
  encoding: string
  importedAt: Date
  chapterCount: number
}

export interface BookContent {
  id?: number
  bookId: number
  text: string
}

export interface Chapter {
  id?: number
  bookId: number
  index: number
  title: string
  offset: number
  length: number
}

export interface Progress {
  id?: number
  bookId: number
  chapterIndex: number
  charOffset: number
  percent: number
  totalSeconds?: number
  updatedAt: Date
}

export interface Bookmark {
  id?: number
  bookId: number
  chapterIndex: number
  charOffset: number
  note?: string
  createdAt: Date
}

class ReaderDB extends Dexie {
  books!: Table<Book>
  contents!: Table<BookContent>
  chapters!: Table<Chapter>
  progress!: Table<Progress>
  bookmarks!: Table<Bookmark>

  constructor() {
    super('JingDuDB')
    this.version(1).stores({
      books: '++id, importedAt',
      contents: '++id, &bookId',
      chapters: '++id, [bookId+index], bookId',
      progress: '++id, &bookId',
      bookmarks: '++id, bookId',
    })
  }
}

export const db = new ReaderDB()
