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

export const presetThemes: CustomTheme[] = [
  { id: 'light', label: '日间', bg: '#ffffff', text: '#1f2937', dark: false },
  { id: 'dark', label: '夜间', bg: '#111827', text: '#f3f4f6', dark: true },
  { id: 'sepia', label: '护眼', bg: '#f0fdf4', text: '#1f2937', dark: false },
]

const defaultTheme = presetThemes[0]!

export const useSettingsStore = defineStore('settings', () => {
  const theme = useLocalStorage<string>('jd-theme', 'light')
  const customThemes = useLocalStorage<CustomTheme[]>('jd-custom-themes', [])
  const fontSize = useLocalStorage<number>('jd-font-size', 18)
  const lineHeight = useLocalStorage<number>('jd-line-height', 1.8)
  const fontFamily = useLocalStorage<'system' | 'serif' | 'mono'>('jd-font-family', 'system')
  const pageMode = useLocalStorage<'scroll' | 'page'>('jd-page-mode', 'scroll')
  const ttsRate = useLocalStorage<number>('jd-tts-rate', 1.2)

  const availableThemes = computed(() => [...presetThemes, ...customThemes.value])

  const currentTheme = computed(() =>
    availableThemes.value.find((item) => item.id === theme.value) ?? defaultTheme,
  )

  const isDark = computed(() => currentTheme.value.dark)

  return {
    theme,
    customThemes,
    availableThemes,
    currentTheme,
    isDark,
    fontSize,
    lineHeight,
    fontFamily,
    pageMode,
    ttsRate,
  }
})
