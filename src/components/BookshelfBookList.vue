<script setup lang="ts">
import type { Book } from '@/db'
import BookshelfBookItem from '@/components/BookshelfBookItem.vue'

interface BookProgress {
  percent?: number
  totalSeconds?: number
}

interface BookChapterMeta {
  currentChapterTitle: string
  lastChapterTitle: string
  remainingChapters: number
}

const props = defineProps<{
  books: Book[]
  progressMap: Record<number, BookProgress>
  chapterMetaMap: Record<number, BookChapterMeta>
}>()

const emit = defineEmits<{
  open: [bookId: number | undefined]
  openDetail: [bookId: number | undefined]
}>()

function getProgress(bookId: number | undefined) {
  if (bookId === undefined) return undefined
  return props.progressMap[bookId]
}

function getChapterMeta(bookId: number | undefined) {
  if (bookId === undefined) return undefined
  return props.chapterMetaMap[bookId]
}
</script>

<template>
  <div class="px-4 py-3">
    <BookshelfBookItem
      v-for="book in props.books"
      :key="book.id"
      :book="book"
      :progress="getProgress(book.id)?.percent"
      :current-chapter-title="getChapterMeta(book.id)?.currentChapterTitle"
      :last-chapter-title="getChapterMeta(book.id)?.lastChapterTitle"
      :remaining-chapters="getChapterMeta(book.id)?.remainingChapters"
      @open="emit('open', $event)"
      @open-detail="emit('openDetail', $event)"
    />
  </div>
</template>
