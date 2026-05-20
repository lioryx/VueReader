<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  install: []
  close: []
}>()

const settings = useSettingsStore()

const installBannerStyle = computed(() => ({
  backgroundColor: settings.appPalette.primaryBg,
  color: settings.appPalette.primaryText,
}))

const installButtonStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  color: settings.appPalette.primarySoftText,
}))
</script>

<template>
  <Transition name="slide-down">
    <div v-if="props.visible" class="flex items-center gap-3 px-4 py-3 text-sm" :style="installBannerStyle">
      <div class="flex-1">
        <p class="font-medium">安装到主屏幕</p>
        <p class="mt-0.5 text-xs opacity-80">离线阅读，体验更佳</p>
      </div>
      <button class="rounded-lg px-3 py-1.5 text-xs font-semibold" :style="installButtonStyle" @click="emit('install')">安装</button>
      <button class="opacity-60" @click="emit('close')">✕</button>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.25s ease, opacity 0.25s ease;
  overflow: hidden;
  max-height: 80px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
