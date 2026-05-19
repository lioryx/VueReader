<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@/db'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{
  book: Book
  progress?: number
  totalSeconds?: number
}>()

const emit = defineEmits<{ delete: [id: number] }>()
const settings = useSettingsStore()

const cardStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  borderColor: settings.appPalette.border,
  color: settings.appPalette.text,
  boxShadow: settings.appPalette.shadow,
}))

const coverStyle = computed(() =>
  settings.isEink
    ? { background: `linear-gradient(135deg, ${settings.appPalette.primaryBg} 0%, ${settings.appPalette.textSecondary} 100%)`, color: settings.appPalette.primaryText }
    : undefined,
)

const metaStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const progressTrackStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceMuted,
}))

const progressFillStyle = computed(() => ({
  backgroundColor: settings.appPalette.primaryBg,
}))

const progressTextStyle = computed(() => ({
  color: settings.appPalette.textMuted,
}))

const deleteStyle = computed(() => ({
  color: settings.appPalette.textMuted,
}))

function onDelete() {
  if (props.book.id !== undefined) emit('delete', props.book.id)
}

function formatReadTime(secs: number): string {
  if (secs < 60) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}小时${m}分` : `${m}分钟`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <div class="flex items-start gap-3 p-4 rounded-xl border" :style="cardStyle">
    <div
      class="w-12 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
      :style="coverStyle ?? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"
    >
      TXT
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="font-semibold truncate">{{ book.title }}</h3>
      <p class="text-xs mt-0.5" :style="metaStyle">{{ book.chapterCount }} 章 · {{ formatSize(book.size) }} · {{ book.encoding }}</p>
      <div v-if="progress !== undefined" class="mt-2">
        <div class="h-1 rounded-full overflow-hidden" :style="progressTrackStyle">
          <div
            class="h-full rounded-full"
            :style="[progressFillStyle, { width: `${Math.round(progress * 100)}%` }]"
          />
        </div>
        <p class="text-xs mt-0.5" :style="progressTextStyle">
          已读 {{ Math.round(progress * 100) }}%
          <span v-if="totalSeconds && totalSeconds >= 60"> · {{ formatReadTime(totalSeconds) }}</span>
        </p>
      </div>
    </div>

    <button class="p-1.5 transition-colors" :style="deleteStyle" @click.stop="onDelete">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  </div>
</template>
