<script setup lang="ts">
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

function adjustFontSize(delta: number) {
  settings.fontSize = Math.min(28, Math.max(12, settings.fontSize + delta))
}

function adjustLineHeight(delta: number) {
  settings.lineHeight = Math.round(Math.min(3, Math.max(1.2, settings.lineHeight + delta)) * 10) / 10
}

function adjustTtsRate(delta: number) {
  settings.ttsRate = Math.round(Math.min(2, Math.max(0.5, settings.ttsRate + delta)) * 10) / 10
}
</script>

<template>
  <SettingsPageShell title="其它设置" subtitle="与功能相关的一些设置">
    <div class="space-y-4">
      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">字体大小</p>
        <div class="flex items-center gap-4">
          <button class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-700 flex items-center justify-center" :disabled="settings.fontSize <= 12" @click="adjustFontSize(-1)">−</button>
          <span class="flex-1 text-center text-base font-semibold text-gray-800">{{ settings.fontSize }}px</span>
          <button class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-700 flex items-center justify-center" :disabled="settings.fontSize >= 28" @click="adjustFontSize(1)">+</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">行间距</p>
        <div class="flex items-center gap-4">
          <button class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-700 flex items-center justify-center" :disabled="settings.lineHeight <= 1.2" @click="adjustLineHeight(-0.1)">−</button>
          <span class="flex-1 text-center text-base font-semibold text-gray-800">{{ settings.lineHeight.toFixed(1) }}</span>
          <button class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-700 flex items-center justify-center" :disabled="settings.lineHeight >= 3.0" @click="adjustLineHeight(0.1)">+</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">字体风格</p>
        <div class="flex gap-2">
          <button v-for="font in [{ value: 'system' as const, label: '正文体' }, { value: 'serif' as const, label: '衬线体' }, { value: 'mono' as const, label: '等宽体' }]"
            :key="font.value" class="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all"
            :class="settings.fontFamily === font.value ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50'"
            @click="settings.fontFamily = font.value">
            {{ font.label }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">翻页模式</p>
        <div class="flex gap-2">
          <button class="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all"
            :class="settings.pageMode === 'scroll' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50'"
            @click="settings.pageMode = 'scroll'">滚动</button>
          <button class="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all"
            :class="settings.pageMode === 'page' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 bg-gray-50'"
            @click="settings.pageMode = 'page'">翻页</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <p class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">朗读速度</p>
        <div class="flex items-center gap-4">
          <button class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-700 flex items-center justify-center" :disabled="settings.ttsRate <= 0.5" @click="adjustTtsRate(-0.1)">−</button>
          <span class="flex-1 text-center text-base font-semibold text-gray-800">{{ settings.ttsRate.toFixed(1) }}x</span>
          <button class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-700 flex items-center justify-center" :disabled="settings.ttsRate >= 2.0" @click="adjustTtsRate(0.1)">+</button>
        </div>
      </div>
    </div>
  </SettingsPageShell>
</template>
