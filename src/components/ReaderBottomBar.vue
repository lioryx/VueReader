<script setup lang="ts">
const props = defineProps<{
  chromeStyle: Record<string, string>
  pageMode: 'scroll' | 'page'
  pageSliderValue: number
  pageSliderMax: number
  canGoPrev: boolean
  canGoNext: boolean
  sliderDisabled: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  sliderInput: [event: Event]
  openChapterDrawer: []
  toggleTTS: []
  openReaderSettings: []
  openSettingsPage: []
}>()
</script>

<template>
  <div class="absolute bottom-0 inset-x-0 pointer-events-auto border-t px-5 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl"
    :style="[props.chromeStyle, { paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }]">
    <div class="flex items-center gap-4 text-sm">
      <button class="shrink-0 opacity-80 disabled:opacity-30" :disabled="!props.canGoPrev" @click="emit('prev')">
        上一章
      </button>
      <input
        class="chapter-slider h-2 flex-1 appearance-none bg-transparent"
        type="range"
        min="0"
        :max="props.pageSliderMax"
        :value="props.pageSliderValue"
        :disabled="props.sliderDisabled"
        @input="emit('sliderInput', $event)"
      />
      <button class="shrink-0 opacity-80 disabled:opacity-30" :disabled="!props.canGoNext" @click="emit('next')">
        下一章
      </button>
    </div>
    <div class="mt-3 grid grid-cols-4 gap-2 text-center">
      <button class="flex flex-col items-center gap-1.5 py-1" @click="emit('openChapterDrawer')">
        <svg class="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span class="text-xs">目录</span>
      </button>
      <button class="flex flex-col items-center gap-1.5 py-1" @click="emit('toggleTTS')">
        <svg class="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
            clip-rule="evenodd" />
        </svg>
        <span class="text-xs">朗读</span>
      </button>
      <button class="flex flex-col items-center gap-1.5 py-1" @click="emit('openReaderSettings')">
        <span class="flex h-6 w-6 items-center justify-center text-[1.375rem] leading-none opacity-80">Aa</span>
        <span class="text-xs">界面</span>
      </button>
      <button class="flex flex-col items-center gap-1.5 py-1" @click="emit('openSettingsPage')">
        <svg class="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-xs">设置</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chapter-slider::-webkit-slider-runnable-track {
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in srgb, currentColor 18%, transparent);
}

.chapter-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  margin-top: -0.3125rem;
  border-radius: 9999px;
  background: #111827;
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.chapter-slider::-moz-range-track {
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in srgb, currentColor 18%, transparent);
}

.chapter-slider::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: 3px solid rgba(255, 255, 255, 0.92);
  border-radius: 9999px;
  background: #111827;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.chapter-slider:disabled {
  opacity: 0.35;
}
</style>
