<script setup lang="ts">
import { computed, ref } from 'vue'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { presetThemes, useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()
const themes = presetThemes
const showAddTheme = ref(false)
const newTheme = ref({ label: '', bg: '#e8f5e9', text: '#1b5e20' })

const themePreviewStyle = computed(() => ({
  backgroundColor: settings.currentTheme.bg,
  color: settings.currentTheme.text,
  borderColor: settings.isDark ? '#374151' : '#d1d5db',
}))

function perceivedLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function saveCustomTheme() {
  if (!newTheme.value.label.trim()) return
  const id = `custom-${Date.now()}`
  settings.customThemes.push({
    id,
    label: newTheme.value.label.trim(),
    bg: newTheme.value.bg,
    text: newTheme.value.text,
    dark: perceivedLuminance(newTheme.value.bg) < 0.5,
  })
  settings.theme = id
  newTheme.value = { label: '', bg: '#e8f5e9', text: '#1b5e20' }
  showAddTheme.value = false
}

function deleteCustomTheme(id: string) {
  const idx = settings.customThemes.findIndex((theme) => theme.id === id)
  if (idx !== -1) settings.customThemes.splice(idx, 1)
  if (settings.theme === id) settings.theme = 'light'
}
</script>

<template>
  <SettingsPageShell title="主题设置" subtitle="与界面/颜色相关的一些设置">
    <div class="space-y-4">
      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 mb-3">阅读主题</p>
        <div class="flex flex-wrap gap-2">
          <button v-for="theme in themes" :key="theme.id"
            class="py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5"
            :class="settings.theme === theme.id ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'"
            @click="settings.theme = theme.id">
            <span class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" :style="{ backgroundColor: theme.bg }" />
            {{ theme.label }}
          </button>

          <div v-for="theme in settings.customThemes" :key="theme.id" class="relative">
            <button class="py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5"
              :class="settings.theme === theme.id ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100'"
              @click="settings.theme = theme.id">
              <span class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" :style="{ backgroundColor: theme.bg }" />
              {{ theme.label }}
            </button>
            <button class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-400 text-white text-[10px] flex items-center justify-center leading-none"
              @click.stop="deleteCustomTheme(theme.id)">×</button>
          </div>

          <button class="py-2 px-3 rounded-lg text-sm border-2 border-dashed border-gray-300 text-gray-400 active:bg-gray-50 transition-colors"
            @click="showAddTheme = !showAddTheme">＋</button>
        </div>

        <div v-if="showAddTheme" class="mt-3 p-3 rounded-lg border border-gray-200 space-y-3">
          <input v-model="newTheme.label" type="text" placeholder="主题名称"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
          <div class="flex items-center gap-5">
            <label class="flex items-center gap-2 text-sm text-gray-600">背景色<input v-model="newTheme.bg" type="color" class="w-8 h-8 cursor-pointer rounded border-0" /></label>
            <label class="flex items-center gap-2 text-sm text-gray-600">文字色<input v-model="newTheme.text" type="color" class="w-8 h-8 cursor-pointer rounded border-0" /></label>
          </div>
          <div class="rounded-lg p-2 text-sm border border-gray-200" :style="{ backgroundColor: newTheme.bg, color: newTheme.text }">预览：在静读中享受阅读的乐趣。</div>
          <div class="flex gap-2">
            <button class="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium" @click="saveCustomTheme">保存</button>
            <button class="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm" @click="showAddTheme = false">取消</button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 mb-3">主题预览</p>
        <div class="rounded-xl border p-4 text-sm" :style="themePreviewStyle">
          预览：在静读中享受阅读的乐趣，文字的海洋等你来探索。
        </div>
      </div>
    </div>
  </SettingsPageShell>
</template>
