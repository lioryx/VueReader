<script setup lang="ts">
import { watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

watchEffect(() => {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.currentTheme.bg)
})
</script>

<template>
  <div class="h-screen overflow-hidden">
    <router-view />
  </div>
</template>
