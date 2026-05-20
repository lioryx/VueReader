<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@/db'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{
  book: Book
  progress?: number
  currentChapterTitle?: string
  lastChapterTitle?: string
  remainingChapters?: number
}>()
const settings = useSettingsStore()

const coverStyle = computed(() =>
  settings.isEink
    ? { background: `linear-gradient(135deg, ${settings.appPalette.primaryBg} 0%, ${settings.appPalette.textSecondary} 100%)`, color: settings.appPalette.primaryText }
    : undefined,
)

const metaStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const badgeStyle = computed(() => ({
  backgroundColor: settings.isEink ? settings.appPalette.surfaceMuted : settings.appPalette.text,
  color: settings.isEink ? settings.appPalette.text : settings.appPalette.pageBg,
}))
</script>

<template>
  <div class="flex items-start gap-4 border-b py-4" :style="{ borderColor: settings.appPalette.border, color: settings.appPalette.text }">
    <div
      class="w-18 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
      :style="coverStyle ?? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"
    >
      TXT
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-start gap-3">
        <h3 class="flex-1 font-medium leading-8 line-clamp-2">{{ book.title }}</h3>
        <span class="shrink-0 rounded-full px-3 py-1 text-sm font-semibold" :style="badgeStyle">
          {{ props.remainingChapters ?? book.chapterCount }}
        </span>
      </div>
      <p class="mt-2 flex items-center gap-1 text-sm leading-6" :style="metaStyle">
        <span class="shrink-0">当前章节：</span>
        <span class="min-w-0 flex-1 truncate">{{ props.currentChapterTitle ?? '暂无目录' }}</span>
      </p>
      <p class="mt-1 flex items-center gap-1 text-sm leading-6" :style="metaStyle">
        <span class="shrink-0">最后章节：</span>
        <span class="min-w-0 flex-1 truncate">{{ props.lastChapterTitle ?? '暂无目录' }}</span>
      </p>
    </div>
  </div>
</template>
