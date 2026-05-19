<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Chapter } from '@/db'

interface SearchResult {
  chapter: Chapter
  before: string
  match: string
  after: string
}

const props = defineProps<{
  opened: boolean
  chapters: Chapter[]
  fullText: string
}>()

const emit = defineEmits<{ close: []; select: [chapterIndex: number] }>()

const settings = useSettingsStore()
const query = ref('')
const debouncedQuery = refDebounced(query, 300)
const inputEl = ref<HTMLInputElement | null>(null)

watch(() => props.opened, (v) => {
  if (v) {
    query.value = ''
    setTimeout(() => inputEl.value?.focus(), 150)
  }
})

const results = computed<SearchResult[]>(() => {
  const q = debouncedQuery.value.trim()
  if (q.length < 1) return []
  const found: SearchResult[] = []
  for (const ch of props.chapters) {
    if (found.length >= 50) break
    const text = props.fullText.substring(ch.offset, ch.offset + ch.length)
    const idx = text.indexOf(q)
    if (idx >= 0) {
      const start = Math.max(0, idx - 15)
      const end = Math.min(text.length, idx + q.length + 50)
      found.push({
        chapter: ch,
        before: (start > 0 ? '…' : '') + text.substring(start, idx),
        match: text.substring(idx, idx + q.length),
        after: text.substring(idx + q.length, end) + (end < text.length ? '…' : ''),
      })
    }
  }
  return found
})

const bgStyle = computed(() =>
  ({ backgroundColor: settings.currentTheme.bg, color: settings.currentTheme.text }),
)

const borderClass = computed(() =>
  settings.isDark ? 'border-gray-700' : 'border-gray-100',
)

const inputBgClass = computed(() =>
  settings.isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800',
)

const itemHoverClass = computed(() =>
  settings.isEink
    ? (settings.isDark ? 'active:bg-stone-900/60' : 'active:bg-stone-900/5')
    : (settings.isDark ? 'active:bg-gray-800' : 'active:bg-gray-50'),
)

const markClass = computed(() =>
  settings.isEink
    ? (settings.isDark ? 'bg-stone-100/15 text-stone-100' : 'bg-stone-900/12 text-stone-900')
    : (settings.isDark ? 'bg-indigo-500/40 text-indigo-200' : 'bg-yellow-200 text-gray-900'),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="search-slide">
      <div v-if="opened" class="fixed inset-0 z-50 flex flex-col" :style="bgStyle">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b" :class="borderClass">
          <button class="p-1 -ml-1 opacity-70" @click="emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" :class="inputBgClass">
            <svg class="w-4 h-4 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input ref="inputEl" v-model="query" type="search" placeholder="搜索书中内容…"
              class="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
            <button v-if="query" class="opacity-40 text-base leading-none" @click="query = ''">✕</button>
          </div>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto">
          <p v-if="!query" class="text-center opacity-40 text-sm mt-16">输入关键词开始搜索</p>

          <div v-else-if="results.length === 0 && debouncedQuery === query"
            class="flex flex-col items-center justify-center mt-16 opacity-40">
            <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm">未找到"{{ query }}"</p>
          </div>

          <template v-else>
            <p v-if="results.length >= 50" class="text-center opacity-40 text-xs py-2 border-b" :class="borderClass">
              仅显示前 50 条结果</p>
            <button v-for="r in results" :key="r.chapter.id"
              class="w-full text-left px-4 py-3 border-b transition-colors" :class="[borderClass, itemHoverClass]"
              @click="emit('select', r.chapter.index)">
              <p class="text-sm font-semibold mb-1 truncate opacity-80">{{ r.chapter.title }}</p>
              <p class="text-xs leading-relaxed line-clamp-2 opacity-60">
                {{ r.before }}<mark class="rounded px-0.5 not-italic" :class="markClass">{{ r.match }}</mark>{{ r.after
                }}
              </p>
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-slide-enter-active,
.search-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.search-slide-enter-from,
.search-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
