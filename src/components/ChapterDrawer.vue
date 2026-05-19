<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Chapter } from '@/db'

const props = defineProps<{
  opened: boolean
  chapters: Chapter[]
  currentIndex: number
}>()

const emit = defineEmits<{ close: []; select: [index: number] }>()

const settings = useSettingsStore()

const listEl = ref<HTMLElement | null>(null)
const filter = ref('')

const filteredChapters = computed(() =>
  filter.value.trim()
    ? props.chapters.filter((ch) => ch.title.includes(filter.value.trim()))
    : props.chapters,
)

const sheetStyle = computed(() =>
  ({ backgroundColor: settings.currentTheme.bg, color: settings.currentTheme.text }),
)

const borderClass = computed(() =>
  settings.isDark ? 'border-gray-700' : 'border-gray-100',
)

const handleClass = computed(() =>
  settings.isDark ? 'bg-gray-600' : 'bg-gray-300',
)

const inputBgClass = computed(() =>
  settings.isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800',
)

const activeItemClass = computed(() =>
  settings.isDark ? 'text-indigo-300 font-medium bg-indigo-500/20' : 'text-indigo-600 font-medium bg-indigo-50',
)

const itemClass = computed(() =>
  settings.isDark ? 'text-gray-200' : 'text-gray-700',
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
        <div class="sheet-content relative rounded-t-2xl max-h-[75vh] flex flex-col z-10" :style="sheetStyle">
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-8 h-1 rounded-full" :class="handleClass" />
          </div>
          <div class="flex items-center justify-between px-4 py-3 border-b" :class="borderClass">
            <h2 class="text-base font-semibold">目录</h2>
            <button class="p-1 opacity-40" @click="emit('close')">✕</button>
          </div>
          <!-- Filter input -->
          <div class="px-3 py-2 border-b" :class="borderClass">
            <div class="flex items-center gap-2 rounded-lg px-3 py-1.5" :class="inputBgClass">
              <svg class="w-3.5 h-3.5 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                v-model="filter"
                type="search"
                placeholder="搜索章节…"
                class="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              />
              <button v-if="filter" class="opacity-40 text-base leading-none" @click="filter = ''">✕</button>
            </div>
          </div>
          <div ref="listEl" class="overflow-y-auto flex-1">
            <p v-if="filteredChapters.length === 0" class="text-center opacity-40 text-sm py-8">无匹配章节</p>
            <button
              v-for="ch in filteredChapters"
              :key="ch.index"
              class="w-full text-left px-4 py-3 text-sm border-b transition-colors"
              :class="[borderClass, ch.index === currentIndex ? activeItemClass : itemClass]"
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
