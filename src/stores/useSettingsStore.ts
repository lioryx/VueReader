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

export interface ReaderUiPalette {
  accent: string
  accentText: string
  accentSoft: string
  accentStrong: string
  chromeBg: string
  chromeText: string
  chromeBorder: string
  pillBg: string
  pillText: string
  pillBorder: string
  markBg: string
  markText: string
  sliderColor: string
}

export interface AppUiPalette {
  pageBg: string
  headerBg: string
  surfaceBg: string
  surfaceMuted: string
  border: string
  text: string
  textSecondary: string
  textMuted: string
  primaryBg: string
  primaryText: string
  primarySoftBg: string
  primarySoftText: string
  inputBg: string
  inputBorder: string
  shadow: string
}

export const presetThemes: CustomTheme[] = [
  { id: 'light', label: '日间', bg: '#ffffff', text: '#1f2937', dark: false },
  { id: 'dark', label: '夜间', bg: '#111827', text: '#f3f4f6', dark: true },
  { id: 'sepia', label: '护眼', bg: '#f0fdf4', text: '#1f2937', dark: false },
]

const defaultTheme = presetThemes[0]!

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const safeHex = normalized.length === 6 ? normalized : 'ffffff'
  return {
    r: parseInt(safeHex.slice(0, 2), 16),
    g: parseInt(safeHex.slice(2, 4), 16),
    b: parseInt(safeHex.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')).join('')}`
}

function mixHex(from: string, to: string, amount: number) {
  const start = hexToRgb(from)
  const end = hexToRgb(to)
  return rgbToHex(
    start.r + (end.r - start.r) * amount,
    start.g + (end.g - start.g) * amount,
    start.b + (end.b - start.b) * amount,
  )
}

function grayscaleHex(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const gray = 0.299 * r + 0.587 * g + 0.114 * b
  return rgbToHex(gray, gray, gray)
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const normalize = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b)
}

function contrastRatio(bg: string, text: string) {
  const l1 = relativeLuminance(bg)
  const l2 = relativeLuminance(text)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function toEinkTheme(theme: CustomTheme): CustomTheme {
  const paperTone = theme.dark ? '#1f1e1a' : '#f3efe3'
  const inkTone = theme.dark ? '#f4efe6' : '#1f1d18'

  let bg = mixHex(grayscaleHex(theme.bg), paperTone, 0.58)
  let text = mixHex(grayscaleHex(theme.text), inkTone, 0.78)

  if (contrastRatio(bg, text) < 8) {
    bg = mixHex(bg, paperTone, 0.22)
    text = inkTone
  }

  return {
    ...theme,
    bg,
    text,
  }
}

function buildUiPalette(theme: CustomTheme, einkMode: boolean): ReaderUiPalette {
  if (einkMode) {
    return theme.dark
      ? {
          accent: '#ebe5da',
          accentText: '#161512',
          accentSoft: 'rgba(235, 229, 218, 0.14)',
          accentStrong: 'rgba(235, 229, 218, 0.22)',
          chromeBg: 'rgba(28, 27, 24, 0.96)',
          chromeText: '#f4efe6',
          chromeBorder: 'rgba(205, 198, 186, 0.22)',
          pillBg: 'rgba(34, 32, 29, 0.96)',
          pillText: '#f4efe6',
          pillBorder: 'rgba(205, 198, 186, 0.22)',
          markBg: 'rgba(235, 229, 218, 0.18)',
          markText: '#f4efe6',
          sliderColor: '#ebe5da',
        }
      : {
          accent: '#2f2b24',
          accentText: '#f6f1e7',
          accentSoft: 'rgba(47, 43, 36, 0.10)',
          accentStrong: 'rgba(47, 43, 36, 0.16)',
          chromeBg: 'rgba(249, 246, 238, 0.96)',
          chromeText: '#1f1d18',
          chromeBorder: 'rgba(97, 91, 79, 0.20)',
          pillBg: 'rgba(246, 242, 232, 0.98)',
          pillText: '#1f1d18',
          pillBorder: 'rgba(97, 91, 79, 0.20)',
          markBg: 'rgba(47, 43, 36, 0.12)',
          markText: '#1f1d18',
          sliderColor: '#2f2b24',
        }
  }

  return theme.dark
    ? {
        accent: '#6366f1',
        accentText: '#ffffff',
        accentSoft: 'rgba(99, 102, 241, 0.18)',
        accentStrong: 'rgba(99, 102, 241, 0.4)',
        chromeBg: 'rgba(17, 24, 39, 0.92)',
        chromeText: '#f9fafb',
        chromeBorder: 'rgba(75, 85, 99, 0.65)',
        pillBg: 'rgba(31, 41, 55, 0.94)',
        pillText: '#f9fafb',
        pillBorder: 'rgba(75, 85, 99, 0.7)',
        markBg: 'rgba(99, 102, 241, 0.22)',
        markText: '#e0e7ff',
        sliderColor: '#a5b4fc',
      }
    : {
        accent: '#4f46e5',
        accentText: '#ffffff',
        accentSoft: 'rgba(79, 70, 229, 0.08)',
        accentStrong: 'rgba(79, 70, 229, 0.12)',
        chromeBg: 'rgba(255, 255, 255, 0.94)',
        chromeText: '#111827',
        chromeBorder: 'rgba(229, 231, 235, 0.95)',
        pillBg: 'rgba(255, 255, 255, 0.96)',
        pillText: '#111827',
        pillBorder: 'rgba(229, 231, 235, 0.95)',
        markBg: '#fde68a',
        markText: '#111827',
        sliderColor: '#4338ca',
      }
}

function buildAppPalette(theme: CustomTheme, einkMode: boolean): AppUiPalette {
  if (einkMode) {
    return theme.dark
      ? {
          pageBg: '#1c1b18',
          headerBg: '#22201d',
          surfaceBg: '#26231f',
          surfaceMuted: '#2d2924',
          border: 'rgba(212, 204, 190, 0.14)',
          text: '#f4efe6',
          textSecondary: '#d7d0c4',
          textMuted: '#a39a8c',
          primaryBg: '#ebe5da',
          primaryText: '#161512',
          primarySoftBg: 'rgba(235, 229, 218, 0.14)',
          primarySoftText: '#f4efe6',
          inputBg: '#2c2924',
          inputBorder: 'rgba(212, 204, 190, 0.16)',
          shadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
        }
      : {
          pageBg: '#f3efe3',
          headerBg: '#f8f4ea',
          surfaceBg: '#fbf8f0',
          surfaceMuted: '#f1ebdd',
          border: 'rgba(88, 80, 67, 0.14)',
          text: '#1f1d18',
          textSecondary: '#4f493f',
          textMuted: '#877e70',
          primaryBg: '#2f2b24',
          primaryText: '#f6f1e7',
          primarySoftBg: 'rgba(47, 43, 36, 0.08)',
          primarySoftText: '#2f2b24',
          inputBg: '#f1ebdd',
          inputBorder: 'rgba(88, 80, 67, 0.16)',
          shadow: '0 6px 16px rgba(58, 51, 39, 0.08)',
        }
  }

  return {
    pageBg: '#f9fafb',
    headerBg: '#ffffff',
    surfaceBg: '#ffffff',
    surfaceMuted: '#f9fafb',
    border: '#f3f4f6',
    text: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    primaryBg: '#4f46e5',
    primaryText: '#ffffff',
    primarySoftBg: 'rgba(79, 70, 229, 0.08)',
    primarySoftText: '#4f46e5',
    inputBg: '#f3f4f6',
    inputBorder: '#e5e7eb',
    shadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = useLocalStorage<string>('jd-theme', 'light')
  const customThemes = useLocalStorage<CustomTheme[]>('jd-custom-themes', [])
  const fontSize = useLocalStorage<number>('jd-font-size', 18)
  const lineHeight = useLocalStorage<number>('jd-line-height', 1.8)
  const fontFamily = useLocalStorage<'system' | 'serif' | 'mono'>('jd-font-family', 'system')
  const pageMode = useLocalStorage<'scroll' | 'page'>('jd-page-mode', 'scroll')
  const ttsRate = useLocalStorage<number>('jd-tts-rate', 1.2)
  const themeMode = useLocalStorage<'standard' | 'eink'>('jd-theme-mode', 'standard')
  const tocRule = useLocalStorage<string>('jd-toc-rule', '^第.{1,9}(章|节|卷|回)')
  const replaceRules = useLocalStorage<string>('jd-replace-rules', '')
  const dictionaryRules = useLocalStorage<string>('jd-dictionary-rules', '')

  const availableThemes = computed(() => [...presetThemes, ...customThemes.value])

  const selectedTheme = computed(() =>
    availableThemes.value.find((item) => item.id === theme.value) ?? defaultTheme,
  )

  const currentTheme = computed(() =>
    themeMode.value === 'eink' ? toEinkTheme(selectedTheme.value) : selectedTheme.value,
  )

  const isEink = computed(() => themeMode.value === 'eink')
  const isDark = computed(() => currentTheme.value.dark)
  const uiPalette = computed(() => buildUiPalette(currentTheme.value, isEink.value))
  const appPalette = computed(() => buildAppPalette(currentTheme.value, isEink.value))

  return {
    theme,
    customThemes,
    availableThemes,
    selectedTheme,
    currentTheme,
    isEink,
    isDark,
    uiPalette,
    appPalette,
    fontSize,
    lineHeight,
    fontFamily,
    pageMode,
    ttsRate,
    themeMode,
    tocRule,
    replaceRules,
    dictionaryRules,
  }
})
