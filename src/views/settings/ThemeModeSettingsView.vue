<script setup lang="ts">
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()
</script>

<template>
  <SettingsPageShell title="主题模式" subtitle="选择主题模式">
    <div class="space-y-3">
      <button class="w-full rounded-2xl p-4 text-left shadow-sm border-2"
        :class="settings.themeMode === 'standard' ? 'border-indigo-500 bg-white' : 'border-transparent bg-white'"
        @click="settings.themeMode = 'standard'">
        <p class="text-base font-semibold">标准模式</p>
        <p class="mt-2 text-sm text-gray-500">保留彩色主题与完整对比度，适合手机和平板。</p>
      </button>
      <button class="w-full rounded-2xl p-4 text-left shadow-sm border-2"
        :class="settings.themeMode === 'eink' ? 'border-indigo-500 bg-white' : 'border-transparent bg-white'"
        @click="settings.themeMode = 'eink'">
        <p class="text-base font-semibold">E-Ink(墨水屏)</p>
        <p class="mt-2 text-sm text-gray-500">偏向低刺激和弱彩色显示，适合墨水屏设备的阅读习惯。</p>
      </button>
    </div>
  </SettingsPageShell>
</template>
