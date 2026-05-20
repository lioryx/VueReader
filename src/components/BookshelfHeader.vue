<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

type SortMode = 'date' | 'title' | 'progress'

const props = defineProps<{
  showMenu: boolean
  sortMode: SortMode
  sortLabels: Record<SortMode, string>
}>()

const emit = defineEmits<{
  toggleMenu: []
  closeMenu: []
  applySort: [mode: SortMode]
  openImport: []
}>()

const settings = useSettingsStore()

const groupBarStyle = computed(() => ({
  backgroundColor: settings.appPalette.headerBg,
  borderColor: settings.appPalette.border,
}))

const groupTabStyle = computed(() => ({
  color: settings.appPalette.text,
  borderColor: settings.appPalette.text,
}))

const menuButtonStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  borderColor: settings.appPalette.border,
  color: settings.appPalette.text,
  boxShadow: settings.appPalette.shadow,
}))

const menuPanelStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  borderColor: settings.appPalette.border,
  boxShadow: settings.appPalette.shadow,
}))

const menuItemStyle = computed(() => ({
  color: settings.appPalette.text,
}))

const menuItemMutedStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const activeSortStyle = computed(() => ({
  backgroundColor: settings.appPalette.primarySoftBg,
  color: settings.appPalette.primarySoftText,
}))

const menuModes: SortMode[] = ['date', 'title', 'progress']
</script>

<template>
  <div class="relative border-b px-4" :style="groupBarStyle">
    <div class="flex items-center justify-between gap-4" style="padding-top: calc(env(safe-area-inset-top) + 0.25rem)">
      <div class="flex flex-1 min-w-0 items-center gap-6 overflow-x-auto whitespace-nowrap">
        <button class="relative py-3 text-base font-medium" :style="groupTabStyle">
          本地
          <span class="absolute bottom-0 left-0 h-0.5 w-full rounded-full" :style="{ backgroundColor: settings.appPalette.text }" />
        </button>
      </div>

      <div class="relative shrink-0">
        <button
          class="flex h-10 w-10 items-center justify-center rounded-full border"
          :style="menuButtonStyle"
          @click="emit('toggleMenu')"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <Transition name="menu-pop">
          <div v-if="props.showMenu" class="absolute right-0 top-12 z-20 w-52 rounded-2xl border p-2" :style="menuPanelStyle">
            <button class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm" :style="menuItemStyle" @click="emit('openImport')">
              <span>导入书籍</span>
              <span class="text-xs" :style="menuItemMutedStyle">TXT</span>
            </button>
            <div class="px-3 pb-1 pt-3 text-xs font-medium" :style="menuItemMutedStyle">排序方式</div>
            <button
              v-for="mode in menuModes"
              :key="mode"
              class="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm"
              :style="props.sortMode === mode ? activeSortStyle : menuItemStyle"
              @click="emit('applySort', mode)"
            >
              <span>{{ props.sortLabels[mode] }}</span>
              <svg v-if="props.sortMode === mode" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 12l5 5L20 7" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <button v-if="props.showMenu" class="absolute inset-0 z-10 cursor-default" aria-label="关闭菜单" @click="emit('closeMenu')" />
  </div>
</template>

<style scoped>
.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
