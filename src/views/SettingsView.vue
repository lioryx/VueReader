<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'

const router = useRouter()
const settings = useSettingsStore()

const themeModeLabel = computed(() =>
  settings.themeMode === 'eink' ? 'E-Ink(墨水屏)' : '标准模式',
)

const pageStyle = computed(() => ({
  '--settings-page-bg': settings.appPalette.pageBg,
  '--settings-header-bg': settings.appPalette.headerBg,
  '--settings-surface-bg': settings.appPalette.surfaceBg,
  '--settings-surface-muted': settings.appPalette.surfaceMuted,
  '--settings-border': settings.appPalette.border,
  '--settings-text': settings.appPalette.text,
  '--settings-text-secondary': settings.appPalette.textSecondary,
  '--settings-text-muted': settings.appPalette.textMuted,
  '--settings-primary-bg': settings.appPalette.primaryBg,
  '--settings-primary-text': settings.appPalette.primaryText,
  '--settings-primary-soft-bg': settings.appPalette.primarySoftBg,
  '--settings-primary-soft-text': settings.appPalette.primarySoftText,
}))

function open(path: string) {
  void router.push(path)
}
</script>

<template>
  <div class="settings-home h-screen flex flex-col" :style="pageStyle">
    <div class="px-4 pb-4 pt-6 border-b" style="padding-top: calc(env(safe-area-inset-top) + 1rem)">
      <div class="flex items-center gap-3">
        <button class="p-1 -ml-1 text-gray-600" @click="router.back()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-semibold">设置</h1>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <section class="bg-white px-4 py-2">
        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/rules/toc')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21.5v-16z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7h8M8 11h8" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">TXT 目录规则</span>
            <span class="block mt-2 text-sm text-gray-400">配置 TXT 目录规则</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/rules/replace')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900 font-semibold text-base">A↔B</span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">替换净化</span>
            <span class="block mt-2 text-sm text-gray-400">配置替换净化规则</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/rules/dictionary')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900 font-semibold text-base">文A</span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">字典规则</span>
            <span class="block mt-2 text-sm text-gray-400">配置字典规则</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/theme-mode')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 4h6l1 3h3v13H5V7h3l1-3z" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">主题模式</span>
            <span class="block mt-2 text-sm text-gray-400">选择主题模式</span>
          </span>
          <span class="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700">{{ themeModeLabel }}</span>
        </button>
      </section>

      <section class="mt-4 bg-white px-4 py-2">
        <h2 class="py-3 text-base font-semibold">设置</h2>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/backup')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">备份与恢复</span>
            <span class="block mt-2 text-sm text-gray-400">WebDav 设置/导入旧版本数据</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/theme')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 4h6l1 3h3v13H5V7h3l1-3z" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">主题设置</span>
            <span class="block mt-2 text-sm text-gray-400">与界面/颜色相关的一些设置</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/other')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6v12M6 12h12" />
              <circle cx="12" cy="12" r="9" stroke-width="1.8" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">其它设置</span>
            <span class="block mt-2 text-sm text-gray-400">与功能相关的一些设置</span>
          </span>
        </button>
      </section>

      <section class="mt-4 bg-white px-4 py-2 pb-8">
        <h2 class="py-3 text-base font-semibold">其它</h2>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/bookmarks')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 4h10v16l-5-3-5 3V4z" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">书签</span>
            <span class="block mt-2 text-sm text-gray-400">所有书签</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/records')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="1.8" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 7v5l3 2" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">阅读记录</span>
            <span class="block mt-2 text-sm text-gray-400">阅读时间记录</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/files')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">文件管理</span>
            <span class="block mt-2 text-sm text-gray-400">管理私有文件夹的文件</span>
          </span>
        </button>

        <button class="w-full flex items-center gap-4 py-4 text-left" @click="open('/settings/about')">
          <span class="w-8 h-8 flex items-center justify-center text-gray-900">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="1.8" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 10v6M12 7h.01" />
            </svg>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-base leading-none">关于</span>
          </span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-home {
  background: var(--settings-page-bg);
  color: var(--settings-text);
}

.settings-home > :first-child {
  background: var(--settings-header-bg);
  border-color: var(--settings-border);
}

.settings-home :deep(.bg-white) {
  background: var(--settings-surface-bg) !important;
}

.settings-home :deep(.bg-gray-200) {
  background: var(--settings-surface-muted) !important;
}

.settings-home :deep(.border-gray-100) {
  border-color: var(--settings-border) !important;
}

.settings-home :deep(.text-gray-900),
.settings-home :deep(.text-gray-700) {
  color: var(--settings-text) !important;
}

.settings-home :deep(.text-gray-600),
.settings-home :deep(.text-gray-500) {
  color: var(--settings-text-secondary) !important;
}

.settings-home :deep(.text-gray-400) {
  color: var(--settings-text-muted) !important;
}
</style>
