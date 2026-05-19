<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{
  title: string
  subtitle?: string
}>()

const router = useRouter()
const settings = useSettingsStore()

const shellStyle = computed(() => ({
  '--settings-page-bg': settings.appPalette.pageBg,
  '--settings-header-bg': settings.appPalette.headerBg,
  '--settings-surface-bg': settings.appPalette.surfaceBg,
  '--settings-surface-muted': settings.appPalette.surfaceMuted,
  '--settings-border': settings.appPalette.border,
  '--settings-text': settings.appPalette.text,
  '--settings-text-secondary': settings.appPalette.textSecondary,
  '--settings-text-muted': settings.appPalette.textMuted,
  '--settings-primary-bg': settings.appPalette.primaryBg,
  '--settings-primary-text': settings.appPalette.primaryText,
  '--settings-primary-soft-bg': settings.appPalette.primarySoftBg,
  '--settings-primary-soft-text': settings.appPalette.primarySoftText,
  '--settings-input-bg': settings.appPalette.inputBg,
  '--settings-input-border': settings.appPalette.inputBorder,
  '--settings-shadow': settings.appPalette.shadow,
}))
</script>

<template>
  <div class="settings-shell h-screen flex flex-col" :style="shellStyle">
    <div class="px-4 pb-4 pt-6 border-b" style="padding-top: calc(env(safe-area-inset-top) + 1rem)">
      <div class="flex items-center gap-3">
        <button class="p-1 -ml-1 text-gray-600" @click="router.back()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-lg font-semibold">{{ props.title }}</h1>
          <p v-if="props.subtitle" class="mt-1 text-sm text-gray-400">{{ props.subtitle }}</p>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.settings-shell {
  background: var(--settings-page-bg);
  color: var(--settings-text);
}

.settings-shell > :first-child {
  background: var(--settings-header-bg);
  border-color: var(--settings-border);
}

.settings-shell :deep(.bg-white) {
  background: var(--settings-surface-bg) !important;
}

.settings-shell :deep(.bg-gray-50),
.settings-shell :deep(.bg-gray-100),
.settings-shell :deep(.bg-gray-200) {
  background: var(--settings-surface-muted) !important;
}

.settings-shell :deep(.border-gray-100),
.settings-shell :deep(.border-gray-200),
.settings-shell :deep(.border-gray-300),
.settings-shell :deep(.border-gray-400) {
  border-color: var(--settings-border) !important;
}

.settings-shell :deep(.text-gray-900),
.settings-shell :deep(.text-gray-800),
.settings-shell :deep(.text-gray-700) {
  color: var(--settings-text) !important;
}

.settings-shell :deep(.text-gray-600),
.settings-shell :deep(.text-gray-500) {
  color: var(--settings-text-secondary) !important;
}

.settings-shell :deep(.text-gray-400),
.settings-shell :deep(.text-gray-300) {
  color: var(--settings-text-muted) !important;
}

.settings-shell :deep(.bg-indigo-600) {
  background: var(--settings-primary-bg) !important;
}

.settings-shell :deep(.bg-indigo-50) {
  background: var(--settings-primary-soft-bg) !important;
}

.settings-shell :deep(.text-indigo-600),
.settings-shell :deep(.text-indigo-500) {
  color: var(--settings-primary-soft-text) !important;
}

.settings-shell :deep(.border-indigo-500),
.settings-shell :deep(.border-indigo-400),
.settings-shell :deep(.border-indigo-600),
.settings-shell :deep(.focus\:border-indigo-400:focus) {
  border-color: var(--settings-primary-bg) !important;
}

.settings-shell :deep(.shadow-sm) {
  box-shadow: var(--settings-shadow) !important;
}

.settings-shell :deep(textarea),
.settings-shell :deep(input[type='text']),
.settings-shell :deep(input[type='search']) {
  background: var(--settings-input-bg);
  border-color: var(--settings-input-border);
  color: var(--settings-text);
}
</style>
