<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwipe, useResizeObserver, useWakeLock } from '@vueuse/core'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { paginateText, type PageConfig, type PageLine } from '@/utils/pagination'
import ChapterDrawer from '@/components/ChapterDrawer.vue'
import BookmarkDrawer from '@/components/BookmarkDrawer.vue'
import SearchDrawer from '@/components/SearchDrawer.vue'

const route = useRoute()
const router = useRouter()
const reader = useReaderStore()
const settings = useSettingsStore()

// ── UI state ─────────────────────────────────────────────────────────────────
const showUI = ref(true)
const showChapterDrawer = ref(false)
const showBookmarkDrawer = ref(false)
const showSearch = ref(false)
const toast = ref('')
// contentEl: the full-screen scrollable/page container
const contentEl = ref<HTMLElement | null>(null)
// pageTextAreaEl: the flex-1 area inside page mode where text actually lives
const pageTextAreaEl = ref<HTMLElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | undefined
let swipeEnded = false

// ── Page mode ─────────────────────────────────────────────────────────────────
const pageIndex = ref(0)
const pageConfig = ref<PageConfig | null>(null)
const pageTransition = ref('slide-left')

// ── TTS ───────────────────────────────────────────────────────────────────────
const speaking = ref(false)
const ttsPaused = ref(false)
const ttsParaIdx = ref(-1)
const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
let ttsActive = false

// ── Wake lock ─────────────────────────────────────────────────────────────────
const { isSupported: wakeLockSupported, isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock()

// ── Reading time ──────────────────────────────────────────────────────────────
let sessionStart = 0

// ── Reading progress ──────────────────────────────────────────────────────────
const readingPercent = computed(() => {
  const ch = reader.currentChapter
  const total = reader.fullText.length
  if (!ch || total === 0) return 0
  const withinChapter = settings.pageMode === 'page' && pages.value.length > 1
    ? (pageIndex.value / pages.value.length) * ch.length
    : 0
  return Math.min(1, (ch.offset + withinChapter) / total)
})

// ── Keyboard navigation ───────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (showChapterDrawer.value || showBookmarkDrawer.value || showSearch.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault(); nextPage()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault(); prevPage()
  } else if (e.key === 'Escape') {
    void router.back()
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  const bookId = Number(route.params['bookId'])
  if (isNaN(bookId)) { void router.replace('/'); return }
  await reader.openBook(bookId)
  sessionStart = Date.now()
  scheduleHide()
  nextTick(updatePageConfig)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  clearTimeout(hideTimer)
  stopTTS()
  window.removeEventListener('keydown', onKeydown)
  if (wakeLockActive.value) void releaseWakeLock()
  const secs = Math.floor((Date.now() - sessionStart) / 1000)
  if (secs > 10 && sessionStart > 0) void reader.saveProgress(0, secs)
})

// ── Pagination ────────────────────────────────────────────────────────────────
function updatePageConfig() {
  if (settings.pageMode !== 'page') return
  const el = pageTextAreaEl.value ?? contentEl.value
  if (!el) return
  const { width, height } = el.getBoundingClientRect()
  if (!width || !height) return
  pageConfig.value = {
    visibleWidth: width - 40,   // px-5 padding (20px each side)
    visibleHeight: height - 40, // pt-3 (12px) + h2 title (~28px)
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    indentChars: 2,
    paraMarginPx: 12,
  }
}

useResizeObserver(contentEl, () => nextTick(updatePageConfig))

watch([() => settings.fontSize, () => settings.lineHeight, () => settings.pageMode], () => {
  pageIndex.value = 0
  nextTick(updatePageConfig)
})

watch(() => reader.chapterIndex, () => { pageIndex.value = 0 })

const pages = computed(() =>
  settings.pageMode === 'page' && pageConfig.value ? paginateText(reader.chapterText, pageConfig.value) : [],
)

const displayParas = computed(() =>
  reader.chapterText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
)

const currentPageLines = computed<PageLine[]>(() =>
  settings.pageMode === 'page' ? (pages.value[pageIndex.value] ?? []) : []
)

function nextPage() {
  pageTransition.value = 'slide-left'
  if (settings.pageMode === 'page') {
    if (pageIndex.value < pages.value.length - 1) {
      pageIndex.value++
      void reader.saveProgress()
    } else {
      reader.nextChapter()
    }
  } else {
    reader.nextChapter()
    contentEl.value?.scrollTo(0, 0)
  }
}

function prevPage() {
  pageTransition.value = 'slide-right'
  if (settings.pageMode === 'page') {
    if (pageIndex.value > 0) {
      pageIndex.value--
      void reader.saveProgress()
    } else if (reader.chapterIndex > 0) {
      reader.prevChapter()
      nextTick(() => { pageIndex.value = Math.max(0, pages.value.length - 1) })
    }
  } else {
    reader.prevChapter()
    contentEl.value?.scrollTo(0, 0)
  }
}

// ── Swipe ─────────────────────────────────────────────────────────────────────
useSwipe(contentEl, {
  threshold: 60,
  onSwipeEnd(_, direction) {
    swipeEnded = true
    setTimeout(() => { swipeEnded = false }, 80)
    if (direction === 'left') nextPage()
    else if (direction === 'right') prevPage()
  },
})

// ── UI toggle / tap zones ─────────────────────────────────────────────────────
function scheduleHide() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { showUI.value = false }, 3500)
}

function toggleUI() {
  showUI.value = !showUI.value
  if (showUI.value) scheduleHide()
}

function onContentClick(e: MouseEvent) {
  if (swipeEnded || showChapterDrawer.value || showBookmarkDrawer.value || showSearch.value) return
  const rect = contentEl.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left
  if (x < rect.width / 3) prevPage()
  else if (x > (rect.width * 2) / 3) nextPage()
  else toggleUI()
}

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2000)
}

// ── Theme / font ──────────────────────────────────────────────────────────────
const fontFamilyStyle = computed(() => {
  if (settings.fontFamily === 'serif') return "'Georgia', 'Noto Serif SC', 'STSong', serif"
  if (settings.fontFamily === 'mono') return "'Courier New', 'Noto Sans Mono CJK SC', monospace"
  return "system-ui, -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif"
})

const bgClass = computed(() => {
  if (settings.activeCustomTheme) return ''
  if (settings.isDark) return 'bg-gray-900 text-gray-100'
  if (settings.theme === 'sepia') return 'bg-green-50 text-gray-800'
  return 'bg-white text-gray-800'
})

const bgStyle = computed(() =>
  settings.activeCustomTheme
    ? { backgroundColor: settings.activeCustomTheme.bg, color: settings.activeCustomTheme.text }
    : {},
)

const overlayClass = computed(() =>
  settings.isDark ? 'bg-black/70 text-white' : 'bg-black/50 text-white',
)

// ── Wake lock ─────────────────────────────────────────────────────────────────
async function toggleWakeLock() {
  if (!wakeLockSupported.value) { showToast('当前浏览器不支持屏幕常亮'); return }
  if (wakeLockActive.value) { await releaseWakeLock(); showToast('已关闭屏幕常亮') }
  else { await requestWakeLock('screen'); showToast('屏幕常亮已开启') }
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────
async function onAddBookmark() {
  const input = window.prompt('书签备注（可选）', reader.currentChapter?.title ?? '')
  if (input === null) return
  await reader.addBookmark(input.trim() || undefined)
  showBookmarkDrawer.value = false
  showToast('书签已添加')
}

// ── Navigation helpers ────────────────────────────────────────────────────────
function resetToChapter(index: number) {
  reader.goToChapter(index)
  pageIndex.value = 0
  contentEl.value?.scrollTo(0, 0)
}

// ── TTS ───────────────────────────────────────────────────────────────────────
function startTTS() {
  if (!ttsSupported) { showToast('当前浏览器不支持朗读'); return }
  window.speechSynthesis.cancel()

  const paras = reader.chapterText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  let paraIdx = 0

  function speakNext() {
    if (!ttsActive) return
    if (paraIdx >= paras.length) {
      if (reader.chapterIndex < reader.chapters.length - 1) {
        reader.nextChapter()
        paraIdx = 0
        void nextTick(startTTS)
      } else {
        speaking.value = false
        ttsActive = false
      }
      return
    }
    const text = paras[paraIdx]
    if (!text) { paraIdx++; speakNext(); return }

    ttsParaIdx.value = paraIdx
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = settings.ttsRate
    u.onend = () => { if (ttsActive && !ttsPaused.value) { paraIdx++; speakNext() } }
    u.onerror = (ev) => { if (ev.error !== 'canceled') { speaking.value = false; ttsActive = false } }
    window.speechSynthesis.speak(u)
  }

  ttsActive = true
  speaking.value = true
  ttsPaused.value = false
  speakNext()
}

function toggleTTS() {
  if (!ttsSupported) { showToast('当前浏览器不支持朗读'); return }
  if (!speaking.value) {
    startTTS()
  } else if (ttsPaused.value) {
    window.speechSynthesis.resume()
    ttsPaused.value = false
  } else {
    window.speechSynthesis.pause()
    ttsPaused.value = true
  }
}

function stopTTS() {
  ttsActive = false
  if (ttsSupported) window.speechSynthesis.cancel()
  speaking.value = false
  ttsPaused.value = false
  ttsParaIdx.value = -1
}
</script>

<template>
  <!-- Outer: relative so absolute children are positioned against the viewport -->
  <div class="relative h-screen overflow-hidden" :class="bgClass" :style="bgStyle">

    <!-- ── Content: fills the full screen ─────────────────────────────────── -->
    <div ref="contentEl" class="absolute inset-0"
      :class="settings.pageMode === 'page' ? 'select-none' : 'overflow-y-auto'" @click="onContentClick">
      <!-- Scroll mode -->
      <template v-if="settings.pageMode === 'scroll'">
        <div class="max-w-2xl mx-auto px-5 pb-6" style="padding-top: calc(env(safe-area-inset-top) + 4rem)">
          <h2 v-if="reader.currentChapter" class="text-center text-sm font-semibold mb-6 opacity-50">
            {{ reader.currentChapter.title }}
          </h2>
          <p v-for="(para, i) in displayParas" :key="i" class="mb-4 rounded transition-colors duration-300"
            :class="speaking && ttsParaIdx === i ? (settings.isDark ? 'bg-indigo-900/40' : 'bg-indigo-50') : ''"
            :style="{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight, textIndent: '2em', fontFamily: fontFamilyStyle }">
            {{ para }}
          </p>
          <div v-if="displayParas.length === 0" class="flex justify-center items-center h-32 opacity-40 text-sm">暂无内容
          </div>
          <!-- End of chapter navigation -->
          <div class="py-10 flex flex-col items-center gap-4">
            <div class="w-16 h-px" :class="settings.isDark ? 'bg-gray-700' : 'bg-gray-200'" />
            <p class="text-xs opacity-40">本章完</p>
            <button v-if="reader.chapterIndex < reader.chapters.length - 1"
              class="px-7 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium active:bg-indigo-700 transition-colors"
              @click="nextPage()">
              下一章 →
            </button>
            <p v-else class="text-xs opacity-30">全书完</p>
          </div>
          <div class="h-20" />
        </div>
      </template>

      <!-- Page mode -->
      <!-- pt/pb reserve fixed space matching the floating bar heights so
           pagination is computed against the same area regardless of bar state -->
      <template v-else>
        <div class="absolute inset-0 flex flex-col" style="padding-top: env(safe-area-inset-top)">
          <!-- pageTextAreaEl: measured by updateCharsPerPage -->
          <div ref="pageTextAreaEl" class="relative flex-1 overflow-hidden">
            <Transition :name="pageTransition">
              <div :key="`${reader.chapterIndex}-${pageIndex}`"
                class="absolute inset-0 px-5 pt-3 overflow-hidden flex flex-col">
                <h2 v-if="reader.currentChapter"
                  class="text-center text-xs font-semibold mb-3 opacity-40 flex-shrink-0">
                  {{ reader.currentChapter.title }}
                </h2>
                <div class="flex-1 overflow-hidden">
                  <div v-for="(line, i) in currentPageLines" :key="i" class="rounded transition-colors duration-300"
                    :class="speaking && ttsParaIdx === line.paraIndex ? (settings.isDark ? 'bg-indigo-900/40' : 'bg-indigo-50') : ''"
                    :style="{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight, textIndent: line.isParaStart ? '2em' : '0', marginBottom: line.isParaEnd ? '12px' : '0', fontFamily: fontFamilyStyle }">
                    {{ line.text }}
                  </div>
                  <div v-if="currentPageLines.length === 0"
                    class="flex justify-center items-center h-full opacity-40 text-sm">暂无内容</div>
                </div>
              </div>
            </Transition>
          </div>
          <!-- Page indicator -->
          <div class="flex-shrink-0 flex items-center justify-center gap-4 py-1.5 text-xs opacity-40">
            <span>{{ reader.currentChapter?.title?.slice(0, 8) }}</span>
            <span>{{ pageIndex + 1 }} / {{ pages.length }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Top overlay: progress bar + top bar + TTS bar stacked ──────────── -->
    <div class="absolute top-0 inset-x-0 z-20 flex flex-col pointer-events-none" style="padding-top: env(safe-area-inset-top)">
      <!-- Progress bar: always visible -->
      <div class="h-0.5 w-full opacity-30 flex-shrink-0">
        <div class="h-full bg-indigo-500 transition-[width] duration-500"
          :style="{ width: `${readingPercent * 100}%` }" />
      </div>
      <!-- Top bar -->
      <Transition name="fade">
        <div v-if="showUI" class="pointer-events-auto flex items-center gap-2 px-4 py-3 backdrop-blur-sm"
          :class="overlayClass">
          <button class="p-1 -ml-1" @click="router.back()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ reader.book?.title }}</p>
            <p v-if="reader.currentChapter" class="text-xs opacity-70 truncate">{{ reader.currentChapter.title }}</p>
          </div>
          <button class="p-1 opacity-80" @click.stop="showSearch = true">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
          </button>
          <button v-if="wakeLockSupported" class="p-1.5 rounded-lg transition-colors"
            :class="wakeLockActive ? 'bg-yellow-400/30 text-yellow-300' : 'opacity-70'" @click.stop="toggleWakeLock">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clip-rule="evenodd" />
            </svg>
          </button>
          <button class="p-1 opacity-70" @click.stop="router.push('/settings')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </Transition>
      <!-- TTS active bar: stacks directly below top bar (or at top when bar hidden) -->
      <Transition name="fade">
        <div v-if="speaking"
          class="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-indigo-600 text-white text-sm">
          <div class="flex-1 flex items-center gap-2">
            <div class="flex gap-0.5">
              <span v-for="i in 3" :key="i" class="w-0.5 rounded-full bg-white/80 animate-pulse"
                :style="{ height: '12px', animationDelay: `${i * 0.15}s` }" />
            </div>
            <span class="text-xs">朗读中{{ ttsPaused ? '（已暂停）' : '' }}</span>
          </div>
          <button class="px-3 py-1 bg-white/20 rounded-lg text-xs" @click="toggleTTS">
            {{ ttsPaused ? '继续' : '暂停' }}
          </button>
          <button class="px-3 py-1 bg-white/20 rounded-lg text-xs" @click="stopTTS">停止</button>
        </div>
      </Transition>
    </div>

    <!-- ── Bottom bar ──────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showUI" class="absolute bottom-0 inset-x-0 z-20 flex items-center gap-1 px-3 py-3 backdrop-blur-sm"
        :class="overlayClass">
        <button
          class="flex-1 py-2 rounded-lg bg-white/20 text-xs disabled:opacity-40 active:bg-white/30 transition-colors"
          :disabled="reader.chapterIndex === 0 && pageIndex === 0" @click.stop="prevPage">
          上一{{ settings.pageMode === 'page' ? '页' : '章' }}
        </button>
        <button class="flex-1 py-2 rounded-lg bg-white/20 text-xs active:bg-white/30 transition-colors"
          @click.stop="showChapterDrawer = true">目录</button>
        <button class="flex-1 py-2 rounded-lg text-xs transition-colors"
          :class="speaking ? 'bg-indigo-500/60' : 'bg-white/20 active:bg-white/30'" @click.stop="toggleTTS">
          <span class="flex items-center justify-center gap-1">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                clip-rule="evenodd" />
            </svg>
            朗读
          </span>
        </button>
        <button class="flex-1 py-2 rounded-lg bg-white/20 text-xs active:bg-white/30 transition-colors"
          @click.stop="showBookmarkDrawer = true">书签</button>
        <button
          class="flex-1 py-2 rounded-lg bg-white/20 text-xs disabled:opacity-40 active:bg-white/30 transition-colors"
          :disabled="reader.chapterIndex >= reader.chapters.length - 1 && (settings.pageMode !== 'page' || pageIndex >= pages.length - 1)"
          @click.stop="nextPage">
          下一{{ settings.pageMode === 'page' ? '页' : '章' }}
        </button>
      </div>
    </Transition>

    <!-- ── Toast ──────────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="toast"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/70 text-white text-sm px-5 py-2.5 rounded-full pointer-events-none">
        {{ toast }}
      </div>
    </Transition>

    <ChapterDrawer :opened="showChapterDrawer" :chapters="reader.chapters" :current-index="reader.chapterIndex"
      @close="showChapterDrawer = false" @select="(i) => { resetToChapter(i); showChapterDrawer = false }" />

    <BookmarkDrawer :opened="showBookmarkDrawer" :bookmarks="reader.bookmarks" :chapters="reader.chapters"
      @close="showBookmarkDrawer = false" @add="onAddBookmark" @delete="reader.removeBookmark"
      @jump="(i) => { resetToChapter(i); showBookmarkDrawer = false }" />

    <SearchDrawer :opened="showSearch" :chapters="reader.chapters" :full-text="reader.fullText"
      @close="showSearch = false" @select="(i) => { resetToChapter(i); showSearch = false }" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.slide-left-enter-from {
  transform: translateX(40%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-40%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-40%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(40%);
  opacity: 0;
}
</style>
