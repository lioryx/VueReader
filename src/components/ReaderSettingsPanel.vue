<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{
  opened: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const settings = useSettingsStore()

const fontOptions = [
  { value: 'system', label: '正文' },
  { value: 'serif', label: '衬线' },
  { value: 'mono', label: '等宽' },
] as const

const modeOptions = [
  { value: 'page', label: '翻页' },
  { value: 'scroll', label: '滚动' },
] as const

const panelStyle = computed(() => ({
  backgroundColor: settings.uiPalette.chromeBg,
  color: settings.uiPalette.chromeText,
  borderColor: settings.uiPalette.chromeBorder,
}))

const buttonClass = computed(() =>
  settings.isDark ? 'border-gray-600 text-gray-100 bg-gray-800/80' : 'border-gray-300 text-gray-800 bg-white',
)

const inactiveButtonClass = computed(() =>
  settings.isDark ? 'border-gray-600 text-gray-200 bg-gray-900/40' : 'border-gray-400 text-gray-700 bg-white',
)

const sliderClass = computed(() =>
  settings.isEink
    ? (settings.isDark ? 'text-stone-200' : 'text-stone-800')
    : (settings.isDark ? 'text-indigo-300' : 'text-indigo-700'),
)

const selectedButtonClass = computed(() =>
  settings.isEink
    ? (settings.isDark ? 'border-stone-200 bg-stone-200 text-stone-900' : 'border-stone-800 bg-stone-800 text-stone-50')
    : 'border-indigo-600 bg-indigo-600 text-white',
)

const activeThemeBorderStyle = computed(() => ({
  borderColor: settings.uiPalette.accent,
}))

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function adjustFontSize(delta: number) {
  settings.fontSize = clamp(settings.fontSize + delta, 12, 28)
}

function adjustLineHeight(delta: number) {
  settings.lineHeight = Math.round(clamp(settings.lineHeight + delta, 1.2, 3) * 10) / 10
}

function onFontSizeInput(e: Event) {
  settings.fontSize = Number((e.target as HTMLInputElement).value)
}

function onLineHeightInput(e: Event) {
  settings.lineHeight = Number((e.target as HTMLInputElement).value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="reader-settings">
      <div v-if="props.opened" class="fixed inset-0 z-[60] flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/35" @click="emit('close')" />
        <div class="relative rounded-t-[2rem] border-t px-4 pb-6 pt-3 shadow-[0_-18px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl"
          :style="panelStyle">
          <div class="mx-auto mb-4 h-1.5 w-10 rounded-full" :class="settings.isDark ? 'bg-gray-600' : 'bg-gray-300'" />

          <div class="grid grid-cols-3 gap-3 text-center text-sm">
            <button v-for="option in fontOptions" :key="option.value" class="rounded-xl border py-2.5 transition-colors"
              :class="settings.fontFamily === option.value ? selectedButtonClass : inactiveButtonClass"
              @click="settings.fontFamily = option.value">
              {{ option.label }}
            </button>
          </div>

          <div class="mt-5 space-y-4">
            <div class="flex items-center gap-3 text-sm">
              <span class="w-10 shrink-0">字号</span>
              <button class="w-8 text-2xl leading-none" @click="adjustFontSize(-1)">−</button>
              <input class="reader-slider flex-1 appearance-none bg-transparent" :class="sliderClass" type="range" min="12"
                max="28" step="1" :value="settings.fontSize" @input="onFontSizeInput" />
              <button class="w-8 text-2xl leading-none" @click="adjustFontSize(1)">+</button>
              <span class="w-10 text-right tabular-nums">{{ settings.fontSize }}</span>
            </div>

            <div class="flex items-center gap-3 text-sm">
              <span class="w-10 shrink-0">行距</span>
              <button class="w-8 text-2xl leading-none" @click="adjustLineHeight(-0.1)">−</button>
              <input class="reader-slider flex-1 appearance-none bg-transparent" :class="sliderClass" type="range"
                min="1.2" max="3" step="0.1" :value="settings.lineHeight" @input="onLineHeightInput" />
              <button class="w-8 text-2xl leading-none" @click="adjustLineHeight(0.1)">+</button>
              <span class="w-10 text-right tabular-nums">{{ settings.lineHeight.toFixed(1) }}</span>
            </div>
          </div>

          <div class="mt-5 border-t pt-4" :class="settings.isDark ? 'border-gray-700' : 'border-gray-200'">
            <p class="mb-3 text-sm opacity-70">翻页模式</p>
            <div class="grid grid-cols-2 gap-3">
              <button v-for="option in modeOptions" :key="option.value" class="rounded-xl border py-2.5 text-sm transition-colors"
                :class="settings.pageMode === option.value ? selectedButtonClass : inactiveButtonClass"
                @click="settings.pageMode = option.value">
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="mt-5 border-t pt-4" :class="settings.isDark ? 'border-gray-700' : 'border-gray-200'">
            <div class="mb-3 flex items-center justify-between text-sm">
              <p class="opacity-70">文字颜色和背景</p>
              <button class="rounded-lg border px-3 py-1 text-xs" :class="buttonClass" @click="emit('close')">完成</button>
            </div>
            <div class="flex flex-wrap gap-4">
              <button v-for="theme in settings.availableThemes" :key="theme.id" class="flex flex-col items-center gap-1.5"
                @click="settings.theme = theme.id">
                <span class="flex h-16 w-16 items-center justify-center rounded-full border-2 text-sm"
                  :class="settings.theme === theme.id ? '' : 'border-transparent'"
                  :style="[
                    { backgroundColor: theme.bg, color: theme.text },
                    settings.theme === theme.id ? activeThemeBorderStyle : undefined,
                  ]">
                  文字
                </span>
                <span class="text-xs opacity-75">{{ theme.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.reader-settings-enter-active,
.reader-settings-leave-active {
  transition: opacity 0.2s ease;
}

.reader-settings-enter-from,
.reader-settings-leave-to {
  opacity: 0;
}

.reader-settings-enter-active > :last-child {
  animation: readerSettingsUp 0.22s ease;
}

.reader-settings-leave-active > :last-child {
  animation: readerSettingsDown 0.18s ease;
}

@keyframes readerSettingsUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes readerSettingsDown {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(100%);
  }
}

.reader-slider::-webkit-slider-runnable-track {
  height: 0.2rem;
  border-radius: 9999px;
  background: color-mix(in srgb, currentColor 30%, transparent);
}

.reader-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: -0.5rem;
  border-radius: 9999px;
  background: currentColor;
}

.reader-slider::-moz-range-track {
  height: 0.2rem;
  border-radius: 9999px;
  background: color-mix(in srgb, currentColor 30%, transparent);
}

.reader-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border: 0;
  border-radius: 9999px;
  background: currentColor;
}
</style>
