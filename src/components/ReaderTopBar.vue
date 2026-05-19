<script setup lang="ts">
const props = defineProps<{
  chromeStyle: Record<string, string>
  wakeLockActiveStyle: Record<string, string>
  progressStyle: Record<string, string>
  bookTitle?: string
  chapterTitle?: string
  chapterIndex: number
  readingPercent: number
  wakeLockSupported: boolean
  wakeLockActive: boolean
}>()

const emit = defineEmits<{
  back: []
  search: []
  toggleWakeLock: []
}>()
</script>

<template>
  <div class="pointer-events-auto border shadow-lg backdrop-blur-xl"
    :style="props.chromeStyle">
    <div class="flex items-center gap-2 px-4 py-3">
      <button class="w-10 h-10 rounded-full flex items-center justify-center active:bg-black/5 transition-colors"
        @click="emit('back')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="min-w-0 flex-1">
        <p class="truncate text-xl leading-none font-semibold tracking-tight">{{ props.bookTitle }}</p>
        <p v-if="props.chapterTitle" class="mt-1 truncate text-sm opacity-55">第{{ props.chapterIndex + 1 }}章 {{ props.chapterTitle }}</p>
      </div>
      <button class="w-10 h-10 rounded-full flex items-center justify-center opacity-80 active:bg-black/5 transition-colors"
        @click="emit('search')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
      </button>
      <button
        class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        :class="props.wakeLockActive
          ? ''
          : props.wakeLockSupported
            ? 'opacity-80 active:bg-black/5'
            : 'opacity-50'"
        :style="props.wakeLockActive ? props.wakeLockActiveStyle : undefined"
        @click="emit('toggleWakeLock')">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div class="h-1 w-full overflow-hidden rounded-b-[1.75rem] opacity-75">
      <div class="h-full bg-indigo-500 transition-[width] duration-500"
        :style="[props.progressStyle, { width: `${props.readingPercent * 100}%` }]" />
    </div>
  </div>
</template>
