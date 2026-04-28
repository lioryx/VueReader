<script setup lang="ts">
import { watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

watchEffect(() => {
  let color: string
  if (settings.activeCustomTheme) {
    color = settings.activeCustomTheme.bg
  } else if (settings.isDark) {
    color = '#111827' // gray-900
  } else if (settings.theme === 'sepia') {
    color = '#f0fdf4' // green-50
  } else {
    color = '#ffffff'
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
})
</script>

<template>
  <div class="h-screen overflow-hidden">
    <router-view />
  </div>
</template>
