<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Chapter } from '@/db'

const props = defineProps<{
  opened: boolean
  chapters: Chapter[]
  currentIndex: number
}>()

const emit = defineEmits<{ close: []; select: [index: number] }>()

const listEl = ref<HTMLElement | null>(null)
const filter = ref('')

const filteredChapters = computed(() =>
  filter.value.trim()
    ? props.chapters.filter((ch) => ch.title.includes(filter.value.trim()))
    : props.chapters,
)

watch(() => props.opened, async (v) => {
  if (!v) { filter.value = ''; return }
  await nextTick()
  const active = listEl.value?.querySelector<HTMLElement>('[data-active="true"]')
  active?.scrollIntoView({ block: 'center', behavior: 'instant' })
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="opened" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="sheet-content relative bg-white rounded-t-2xl max-h-[75vh] flex flex-col z-10">
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-8 h-1 bg-gray-300 rounded-full" />
          </div>
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 class="text-base font-semibold text-gray-800">目录</h2>
            <button class="text-gray-400 p-1" @click="emit('close')">✕</button>
          </div>
          <!-- Filter input -->
          <div class="px-3 py-2 border-b border-gray-100">
            <div class="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
              <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                v-model="filter"
                type="search"
                placeholder="搜索章节…"
                class="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
              />
              <button v-if="filter" class="text-gray-400 text-base leading-none" @click="filter = ''">✕</button>
            </div>
          </div>
          <div ref="listEl" class="overflow-y-auto flex-1">
            <p v-if="filteredChapters.length === 0" class="text-center text-gray-400 text-sm py-8">无匹配章节</p>
            <button
              v-for="ch in filteredChapters"
              :key="ch.index"
              class="w-full text-left px-4 py-3 text-sm border-b border-gray-50 transition-colors"
              :class="ch.index === currentIndex ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'"
              :data-active="ch.index === currentIndex && !filter ? 'true' : undefined"
              @click="emit('select', ch.index)"
            >
              {{ ch.title }}
            </button>
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
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes slideDown {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}
</style>
