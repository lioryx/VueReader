<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{
  active: 'bookshelf' | 'settings'
}>()

const router = useRouter()
const settings = useSettingsStore()

const barStyle = computed(() => ({
  backgroundColor: settings.appPalette.headerBg,
  borderColor: settings.appPalette.border,
}))

const activeItemStyle = computed(() => ({
  color: settings.appPalette.text,
}))

const inactiveItemStyle = computed(() => ({
  color: settings.appPalette.textMuted,
}))

function goTo(path: '/' | '/settings') {
  void router.push(path)
}
</script>

<template>
  <div class="border-t px-6 pt-2" :style="barStyle">
    <div class="grid grid-cols-2" style="padding-bottom: max(env(safe-area-inset-bottom), 0.5rem)">
      <button
        class="flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium"
        :style="props.active === 'bookshelf' ? activeItemStyle : inactiveItemStyle"
        @click="goTo('/')"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M5 4.5A2.5 2.5 0 017.5 2H20v17.5H7.5A2.5 2.5 0 005 22V4.5z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M8.5 7H16M8.5 11H16M8.5 15H13" />
        </svg>
        <span>书架</span>
      </button>

      <button
        class="flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium"
        :style="props.active === 'settings' ? activeItemStyle : inactiveItemStyle"
        @click="goTo('/settings')"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.2" stroke-width="1.9" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M5 20c1.9-3.2 4.2-4.8 7-4.8s5.1 1.6 7 4.8" />
        </svg>
        <span>设置</span>
      </button>
    </div>
  </div>
</template>
