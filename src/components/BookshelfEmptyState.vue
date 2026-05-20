<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

const textStyle = computed(() => ({
  color: settings.appPalette.textMuted,
}))
</script>

<template>
  <div class="mt-24 flex flex-col items-center justify-center px-6 text-center" :style="textStyle">
    <svg class="mb-4 h-16 w-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
    <p class="text-base font-medium">书架空空如也</p>
    <p class="mt-1 text-sm">点击左上角菜单导入 TXT 文件，或直接拖入窗口</p>
  </div>
</template>
