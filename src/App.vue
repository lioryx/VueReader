<script setup lang="ts">
import { watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

watchEffect(() => {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.currentTheme.bg)
  document.documentElement.toggleAttribute('data-eink-mode', settings.isEink)
  document.body.toggleAttribute('data-eink-mode', settings.isEink)
})
</script>

<template>
  <div class="h-screen overflow-hidden">
    <router-view />
  </div>
</template>

<style>
:root[data-eink-mode] *,
body[data-eink-mode] * {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}

:root[data-eink-mode] *::before,
:root[data-eink-mode] *::after,
body[data-eink-mode] *::before,
body[data-eink-mode] *::after {
  animation: none !important;
  transition: none !important;
}
</style>
