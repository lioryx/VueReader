<script setup lang="ts">
import type { Book } from '@/db'
import BookCard from '@/components/BookCard.vue'

const props = defineProps<{
  book: Book
  progress?: number
  currentChapterTitle?: string
  lastChapterTitle?: string
  remainingChapters?: number
}>()

const emit = defineEmits<{
  open: [bookId: number | undefined]
  openDetail: [bookId: number | undefined]
}>()

const longPressDelay = 450
let longPressTimer: number | null = null
let longPressTriggered = false

function startPress() {
  clearPress()
  if (props.book.id === undefined) return
  longPressTriggered = false
  longPressTimer = window.setTimeout(() => {
    longPressTriggered = true
    emit('openDetail', props.book.id)
  }, longPressDelay)
}

function clearPress() {
  if (longPressTimer !== null) {
    window.clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function finishPress() {
  if (props.book.id === undefined) return
  clearPress()
  if (longPressTriggered) {
    longPressTriggered = false
    return
  }
  emit('open', props.book.id)
}

</script>

<template>
  <div
    class="pressable-book-item cursor-pointer select-none transition-transform active:scale-[0.99]"
    @pointerdown="startPress"
    @pointerup="finishPress"
    @pointerleave="clearPress"
    @pointercancel="clearPress"
    @contextmenu.prevent
  >
    <BookCard
      :book="props.book"
      :progress="props.progress"
      :current-chapter-title="props.currentChapterTitle"
      :last-chapter-title="props.lastChapterTitle"
      :remaining-chapters="props.remainingChapters"
    />
  </div>
</template>

<style scoped>
.pressable-book-item {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
</style>
