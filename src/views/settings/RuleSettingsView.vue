<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SettingsPageShell from '@/components/SettingsPageShell.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

type RuleKind = 'toc' | 'replace' | 'dictionary'

const route = useRoute()
const settings = useSettingsStore()

const kind = computed<RuleKind>(() => {
  const value = route.params['kind']
  if (value === 'replace' || value === 'dictionary') return value
  return 'toc'
})

const title = computed(() => ({ toc: 'TXT 目录规则', replace: '替换净化', dictionary: '字典规则' }[kind.value]))
const subtitle = computed(() => ({ toc: '配置 TXT 目录规则', replace: '配置替换净化规则', dictionary: '配置字典规则' }[kind.value]))
const placeholder = computed(() => ({
  toc: '一行一条规则，例如：^第.{1,9}(章|节|卷|回)',
  replace: '每行一条替换，格式：旧内容 => 新内容',
  dictionary: '每行一条词典映射，格式：词条 => 注释',
}[kind.value]))

const ruleText = computed({
  get() {
    if (kind.value === 'replace') return settings.replaceRules
    if (kind.value === 'dictionary') return settings.dictionaryRules
    return settings.tocRule
  },
  set(value: string) {
    if (kind.value === 'replace') settings.replaceRules = value
    else if (kind.value === 'dictionary') settings.dictionaryRules = value
    else settings.tocRule = value
  },
})
</script>

<template>
  <SettingsPageShell :title="title" :subtitle="subtitle">
    <div class="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <p class="text-sm text-gray-500">规则会保存在本地，后续可用于章节识别、文本替换和词典扩展。</p>
      <textarea v-model="ruleText" :placeholder="placeholder"
        class="w-full min-h-64 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-indigo-400" />
    </div>
  </SettingsPageShell>
</template>
