<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwipe, useResizeObserver, useWakeLock } from '@vueuse/core'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { paginateText, type PageConfig, type PageLine } from '@/utils/pagination'
import ReaderBottomBar from '@/components/ReaderBottomBar.vue'
import ChapterDrawer from '@/components/ChapterDrawer.vue'
import BookmarkDrawer from '@/components/BookmarkDrawer.vue'
import ReaderSettingsPanel from '@/components/ReaderSettingsPanel.vue'
import ReaderTopBar from '@/components/ReaderTopBar.vue'
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
const showReaderSettings = ref(false)
const toast = ref('')
// contentEl: the full-screen scrollable/page container
const contentEl = ref<HTMLElement | null>(null)
// pageTextAreaEl: the flex-1 area inside page mode where text actually lives
const pageTextAreaEl = ref<HTMLElement | null>(null)
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
  if (showChapterDrawer.value || showBookmarkDrawer.value || showSearch.value || showReaderSettings.value) {
    if (e.key === 'Escape' && showReaderSettings.value) showReaderSettings.value = false
    return
  }
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
  nextTick(updatePageConfig)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
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
function toggleUI() {
  showUI.value = !showUI.value
}

function onContentClick(e: MouseEvent) {
  if (swipeEnded || showChapterDrawer.value || showBookmarkDrawer.value || showSearch.value || showReaderSettings.value) return
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

const bgStyle = computed(() =>
  ({ backgroundColor: settings.currentTheme.bg, color: settings.currentTheme.text }),
)

const chromeStyle = computed(() =>
  ({
    backgroundColor: settings.uiPalette.chromeBg,
    color: settings.uiPalette.chromeText,
    borderColor: settings.uiPalette.chromeBorder,
  }),
)

const pillStyle = computed(() =>
  ({
    backgroundColor: settings.uiPalette.pillBg,
    color: settings.uiPalette.pillText,
    borderColor: settings.uiPalette.pillBorder,
  }),
)

const activeReadingStyle = computed(() =>
  ({ backgroundColor: settings.uiPalette.accentSoft }),
)

const chapterDividerStyle = computed(() =>
  ({ backgroundColor: settings.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(17, 24, 39, 0.12)' }),
)

const nextChapterButtonStyle = computed(() =>
  ({ backgroundColor: settings.uiPalette.accent, color: settings.uiPalette.accentText }),
)

const ttsPulseStyle = computed(() =>
  ({ backgroundColor: settings.uiPalette.accent }),
)

const wakeLockActiveStyle = computed(() =>
  ({ color: settings.uiPalette.accent, backgroundColor: settings.uiPalette.accentSoft }),
)

const progressBarStyle = computed(() =>
  ({ backgroundColor: settings.uiPalette.accent }),
)

const pageSliderValue = computed(() =>
  settings.pageMode === 'page' ? pageIndex.value : 0,
)

const pageSliderMax = computed(() =>
  settings.pageMode === 'page' ? Math.max(pages.value.length - 1, 0) : 0,
)

function onPageSliderInput(e: Event) {
  if (settings.pageMode !== 'page') return
  const nextIndex = Number((e.target as HTMLInputElement).value)
  if (Number.isNaN(nextIndex) || nextIndex === pageIndex.value) return
  pageIndex.value = Math.min(Math.max(nextIndex, 0), pageSliderMax.value)
  void reader.saveProgress()
}

function nextChapterFromBar() {
  if (reader.chapterIndex >= reader.chapters.length - 1) return
  resetToChapter(reader.chapterIndex + 1)
}

function prevChapterFromBar() {
  if (reader.chapterIndex <= 0) return
  resetToChapter(reader.chapterIndex - 1)
}

function openReaderSettings() {
  showReaderSettings.value = true
}

function closeReaderSettings() {
  showReaderSettings.value = false
}

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
  <div class="relative h-screen overflow-hidden" :style="bgStyle">

    <!-- ── Content: fills the full screen ─────────────────────────────────── -->
    <div ref="contentEl" class="absolute inset-0"
      :class="settings.pageMode === 'page' ? 'select-none' : 'overflow-y-auto'" @click="onContentClick">
      <!-- Scroll mode -->
      <template v-if="settings.pageMode === 'scroll'">
        <div class="max-w-2xl mx-auto px-5 pb-40" style="padding-top: calc(env(safe-area-inset-top) + 5.5rem)">
          <h2 v-if="reader.currentChapter" class="text-center text-sm font-semibold mb-6 opacity-50">
            {{ reader.currentChapter.title }}
          </h2>
          <p v-for="(para, i) in displayParas" :key="i" class="mb-4 rounded transition-colors duration-300"
            :style="[
              { fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight, textIndent: '2em', fontFamily: fontFamilyStyle },
              speaking && ttsParaIdx === i ? activeReadingStyle : undefined,
            ]">
            {{ para }}
          </p>
          <div v-if="displayParas.length === 0" class="flex justify-center items-center h-32 opacity-40 text-sm">暂无内容
          </div>
          <!-- End of chapter navigation -->
          <div class="py-10 flex flex-col items-center gap-4">
            <div class="w-16 h-px" :style="chapterDividerStyle" />
            <p class="text-xs opacity-40">本章完</p>
            <button v-if="reader.chapterIndex < reader.chapters.length - 1"
              class="px-7 py-2.5 rounded-full text-sm font-medium transition-colors"
              :style="nextChapterButtonStyle"
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
                    :style="[
                      { fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight, textIndent: line.isParaStart ? '2em' : '0', marginBottom: line.isParaEnd ? '12px' : '0', fontFamily: fontFamilyStyle },
                      speaking && ttsParaIdx === line.paraIndex ? activeReadingStyle : undefined,
                    ]">
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

    <!-- ── Reader chrome ──────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showUI" class="absolute inset-0 z-20 pointer-events-none" style="padding-top: env(safe-area-inset-top)">
        <ReaderTopBar
          :chrome-style="chromeStyle"
          :book-title="reader.book?.title"
          :chapter-title="reader.currentChapter?.title"
          :chapter-index="reader.chapterIndex"
          :reading-percent="readingPercent"
          :wake-lock-supported="wakeLockSupported"
          :wake-lock-active="wakeLockActive"
          :wake-lock-active-style="wakeLockActiveStyle"
          :progress-style="progressBarStyle"
          @back="router.back()"
          @search="showSearch = true"
          @toggle-wake-lock="toggleWakeLock"
        />

        <Transition name="fade">
          <div v-if="speaking"
            class="pointer-events-auto mx-4 mt-3 flex items-center gap-3 rounded-full border px-4 py-2 text-sm shadow-md backdrop-blur-xl"
            :style="pillStyle">
            <div class="flex gap-0.5">
              <span v-for="i in 3" :key="i" class="w-0.5 rounded-full bg-indigo-500 animate-pulse"
                :style="[ttsPulseStyle, { height: '12px', animationDelay: `${i * 0.15}s` }]" />
            </div>
            <span class="flex-1 text-xs">朗读中{{ ttsPaused ? '（已暂停）' : '' }}</span>
            <button class="text-xs font-medium opacity-80" @click="toggleTTS">{{ ttsPaused ? '继续' : '暂停' }}</button>
            <button class="text-xs font-medium opacity-50" @click="stopTTS">停止</button>
          </div>
        </Transition>

        <ReaderBottomBar
          :chrome-style="chromeStyle"
          :page-mode="settings.pageMode"
          :page-slider-value="pageSliderValue"
          :page-slider-max="pageSliderMax"
          :can-go-prev="reader.chapterIndex > 0"
          :can-go-next="reader.chapterIndex < reader.chapters.length - 1"
          :slider-disabled="settings.pageMode !== 'page' || pages.length <= 1"
          @prev="prevChapterFromBar"
          @next="nextChapterFromBar"
          @slider-input="onPageSliderInput"
          @open-chapter-drawer="showChapterDrawer = true"
          @toggle-t-t-s="toggleTTS"
          @open-reader-settings="openReaderSettings"
          @open-settings-page="router.push('/settings')"
        />
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

    <ReaderSettingsPanel :opened="showReaderSettings" @close="closeReaderSettings" />
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
