import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export interface CustomTheme {
  id: string
  label: string
  bg: string    // hex color for background
  text: string  // hex color for text
  dark: boolean // true = use dark-style accessory colors (borders, handles)
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = useLocalStorage<string>('jd-theme', 'light')
  const customThemes = useLocalStorage<CustomTheme[]>('jd-custom-themes', [])
  const fontSize = useLocalStorage<number>('jd-font-size', 18)
  const lineHeight = useLocalStorage<number>('jd-line-height', 1.8)
  const fontFamily = useLocalStorage<'system' | 'serif' | 'mono'>('jd-font-family', 'system')
  const pageMode = useLocalStorage<'scroll' | 'page'>('jd-page-mode', 'scroll')
  const ttsRate = useLocalStorage<number>('jd-tts-rate', 1.2)

  const activeCustomTheme = computed(() =>
    customThemes.value.find((t) => t.id === theme.value) ?? null,
  )

  // true when a dark-style theme is active
  const isDark = computed(
    () => theme.value === 'dark' || (activeCustomTheme.value?.dark ?? false),
  )

  return { theme, customThemes, activeCustomTheme, isDark, fontSize, lineHeight, fontFamily, pageMode, ttsRate }
})
