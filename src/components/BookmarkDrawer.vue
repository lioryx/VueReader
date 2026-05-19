<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Bookmark, Chapter } from '@/db'

const props = defineProps<{
  opened: boolean
  bookmarks: Bookmark[]
  chapters: Chapter[]
}>()

const emit = defineEmits<{
  close: []
  add: []
  delete: [id: number]
  jump: [chapterIndex: number]
}>()

const settings = useSettingsStore()

const sheetStyle = computed(() =>
  ({ backgroundColor: settings.currentTheme.bg, color: settings.currentTheme.text }),
)

const borderClass = computed(() =>
  settings.isDark ? 'border-gray-700' : 'border-gray-100',
)

const handleClass = computed(() =>
  settings.isDark ? 'bg-gray-600' : 'bg-gray-300',
)

const addButtonClass = computed(() =>
  settings.isEink
    ? (settings.isDark ? 'text-stone-100 bg-stone-100/10 active:bg-stone-100/20' : 'text-stone-900 bg-stone-900/10 active:bg-stone-900/15')
    : 'text-indigo-500 bg-indigo-500/10 active:bg-indigo-500/20',
)

function chapterTitle(index: number): string {
  return props.chapters[index]?.title ?? `第 ${index + 1} 章`
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function onDelete(id: number | undefined) {
  if (id !== undefined) emit('delete', id)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="opened" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="sheet-content relative rounded-t-2xl max-h-[70vh] flex flex-col z-10" :style="sheetStyle">
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-8 h-1 rounded-full" :class="handleClass" />
          </div>
          <div class="flex items-center justify-between px-4 py-3 border-b" :class="borderClass">
            <h2 class="text-base font-semibold">书签</h2>
            <div class="flex items-center gap-3">
              <button
                class="text-sm font-medium px-2 py-1 rounded-lg transition-colors"
                :class="addButtonClass"
                @click="emit('add')">
                + 添加书签
              </button>
              <button class="opacity-40 p-1" @click="emit('close')">✕</button>
            </div>
          </div>
          <div class="overflow-y-auto flex-1">
            <div v-if="bookmarks.length === 0" class="flex flex-col items-center justify-center py-12 opacity-40">
              <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p class="text-sm">暂无书签</p>
            </div>
            <div v-for="bm in bookmarks" :key="bm.id" class="flex items-center px-4 py-3 border-b gap-3"
              :class="borderClass">
              <button class="flex-1 text-left min-w-0" @click="emit('jump', bm.chapterIndex)">
                <p class="text-sm font-medium truncate">{{ bm.note || chapterTitle(bm.chapterIndex) }}</p>
                <p class="text-xs opacity-40 mt-0.5 truncate">{{ chapterTitle(bm.chapterIndex) }} · {{
                  formatDate(bm.createdAt) }}</p>
              </button>
              <button class="p-1.5 opacity-30 hover:opacity-70 hover:text-red-400 transition-all"
                @click="onDelete(bm.id)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet-content {
  animation: slideUp 0.25s ease;
}

.sheet-leave-active .sheet-content {
  animation: slideDown 0.2s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(100%);
  }
}
</style>
