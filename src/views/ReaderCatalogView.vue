<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

type CatalogTab = 'chapters' | 'bookmarks'

const route = useRoute()
const router = useRouter()
const reader = useReaderStore()
const settings = useSettingsStore()

const filter = ref('')
const showSearch = ref(false)
const activeTab = ref<CatalogTab>((route.query['tab'] === 'bookmarks' ? 'bookmarks' : 'chapters'))

onMounted(async () => {
  const bookId = Number(route.params['bookId'])
  if (Number.isNaN(bookId)) {
    void router.replace('/')
    return
  }
  if (reader.book?.id !== bookId || reader.chapters.length === 0) {
    await reader.openBook(bookId)
  }
})

watch(activeTab, (tab) => {
  filter.value = ''
  void router.replace({ query: tab === 'bookmarks' ? { tab } : {} })
})

const pageStyle = computed(() => ({
  backgroundColor: settings.appPalette.pageBg,
  color: settings.appPalette.text,
}))

const headerStyle = computed(() => ({
  backgroundColor: settings.appPalette.headerBg,
  borderColor: settings.appPalette.border,
  color: settings.appPalette.text,
}))

const listStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
}))

const dividerStyle = computed(() => ({
  borderColor: settings.appPalette.border,
}))

const inputStyle = computed(() => ({
  backgroundColor: settings.appPalette.inputBg,
  borderColor: settings.appPalette.inputBorder,
  color: settings.appPalette.text,
}))

const activeTabStyle = computed(() => ({
  color: settings.appPalette.text,
  borderColor: settings.appPalette.text,
}))

const inactiveTabStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const activeItemStyle = computed(() => ({
  color: settings.appPalette.text,
  backgroundColor: settings.isEink ? settings.appPalette.surfaceMuted : settings.appPalette.primarySoftBg,
}))

const subTextStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const mutedTextStyle = computed(() => ({
  color: settings.appPalette.textMuted,
}))

const iconButtonStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const bottomBarStyle = computed(() => ({
  backgroundColor: settings.appPalette.headerBg,
  borderColor: settings.appPalette.border,
  color: settings.appPalette.text,
}))

const actionButtonStyle = computed(() => ({
  color: settings.appPalette.textSecondary,
}))

const filteredChapters = computed(() => {
  const keyword = filter.value.trim()
  if (!keyword) return reader.chapters
  return reader.chapters.filter((chapter) => chapter.title.includes(keyword))
})

const filteredBookmarks = computed(() => {
  const keyword = filter.value.trim()
  if (!keyword) return reader.bookmarks
  return reader.bookmarks.filter((bookmark) => {
    const title = bookmark.note || chapterTitle(bookmark.chapterIndex)
    return title.includes(keyword) || chapterTitle(bookmark.chapterIndex).includes(keyword)
  })
})

function chapterTitle(index: number) {
  return reader.chapters[index]?.title ?? `第 ${index + 1} 章`
}

function formatDate(date: Date) {
  const value = new Date(date)
  return `${value.getMonth() + 1}/${value.getDate()} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

function backToReader() {
  const bookId = Number(route.params['bookId'])
  if (window.history.length > 1) {
    void router.back()
    return
  }
  void router.replace(`/reader/${bookId}`)
}

function openChapter(index: number) {
  reader.goToChapter(index)
  backToReader()
}

function moveChapter(step: -1 | 1) {
  const nextIndex = reader.chapterIndex + step
  if (nextIndex < 0 || nextIndex >= reader.chapters.length) return
  reader.goToChapter(nextIndex)
}

async function addBookmark() {
  const input = window.prompt('书签备注（可选）', reader.currentChapter?.title ?? '')
  if (input === null) return
  await reader.addBookmark(input.trim() || undefined)
  activeTab.value = 'bookmarks'
}

async function removeBookmark(id: number | undefined) {
  if (id === undefined) return
  await reader.removeBookmark(id)
}

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) filter.value = ''
}

const currentChapterLabel = computed(() =>
  `${chapterTitle(reader.chapterIndex)}(${reader.chapterIndex + 1}/${Math.max(reader.chapters.length, 1)})`,
)
</script>

<template>
  <div class="h-screen flex flex-col" :style="pageStyle">
    <div class="border-b" :style="headerStyle">
      <div class="px-4 pt-4" style="padding-top: calc(env(safe-area-inset-top) + 0.75rem)">
        <div class="flex items-center gap-2">
          <button class="p-2 -ml-2" :style="iconButtonStyle" @click="backToReader">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="flex-1 flex items-center justify-center gap-8">
            <button class="relative px-1 py-2 text-base font-medium"
              :style="activeTab === 'chapters' ? activeTabStyle : inactiveTabStyle"
              @click="activeTab = 'chapters'">
              目录
              <span v-if="activeTab === 'chapters'" class="absolute inset-x-0 bottom-0 h-1 rounded-full"
                :style="{ backgroundColor: settings.appPalette.text }" />
            </button>
            <button class="relative px-1 py-2 text-base font-medium"
              :style="activeTab === 'bookmarks' ? activeTabStyle : inactiveTabStyle"
              @click="activeTab = 'bookmarks'">
              书签
              <span v-if="activeTab === 'bookmarks'" class="absolute inset-x-0 bottom-0 h-1 rounded-full"
                :style="{ backgroundColor: settings.appPalette.text }" />
            </button>
          </div>

          <button class="p-2" :style="iconButtonStyle" @click="toggleSearch">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
          </button>

          <button v-if="activeTab === 'bookmarks'" class="p-2" :style="iconButtonStyle" @click="addBookmark">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button v-else class="p-2" :style="iconButtonStyle" @click="filter = ''">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="showSearch" class="px-4 pb-3 pt-2">
        <div class="flex items-center gap-2 rounded-xl border px-3 py-2" :style="inputStyle">
          <svg class="w-4 h-4 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input v-model="filter" type="search"
            :placeholder="activeTab === 'chapters' ? '搜索章节…' : '搜索书签…'"
            class="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
          <button v-if="filter" class="opacity-40 text-base leading-none" @click="filter = ''">✕</button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto" :style="listStyle">
      <template v-if="activeTab === 'chapters'">
        <p v-if="filteredChapters.length === 0" class="px-6 py-10 text-center text-sm" :style="mutedTextStyle">无匹配章节</p>
        <button v-for="chapter in filteredChapters" :key="chapter.index"
          class="w-full flex items-center gap-4 border-b px-6 py-5 text-left"
          :style="[dividerStyle, chapter.index === reader.chapterIndex ? activeItemStyle : undefined]"
          @click="openChapter(chapter.index)">
          <span class="min-w-0 flex-1 truncate text-lg">{{ chapter.title }}</span>
          <svg v-if="chapter.index === reader.chapterIndex" class="w-5 h-5 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 12l5 5L20 7" />
          </svg>
        </button>
      </template>

      <template v-else>
        <div v-if="filteredBookmarks.length === 0" class="px-6 py-10 text-center text-sm" :style="mutedTextStyle">暂无书签</div>

        <button v-for="bookmark in filteredBookmarks" :key="bookmark.id"
          class="w-full border-b px-6 py-4 text-left" :style="dividerStyle"
          @click="openChapter(bookmark.chapterIndex)">
          <div class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-medium">{{ bookmark.note || chapterTitle(bookmark.chapterIndex) }}</p>
              <p class="mt-1 truncate text-sm" :style="subTextStyle">{{ chapterTitle(bookmark.chapterIndex) }} · {{ formatDate(bookmark.createdAt) }}</p>
            </div>
            <button class="shrink-0 text-sm opacity-45" @click.stop="removeBookmark(bookmark.id)">删除</button>
          </div>
        </button>
      </template>
    </div>

    <div class="border-t px-4 py-3" :style="bottomBarStyle" style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)">
      <div class="flex items-center gap-3">
        <p class="min-w-0 flex-1 truncate text-sm">{{ currentChapterLabel }}</p>
        <button class="p-1.5 disabled:opacity-30" :style="actionButtonStyle" :disabled="reader.chapterIndex <= 0" @click="moveChapter(-1)">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L6.586 10l4.707-4.707a1 1 0 111.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="p-1.5 disabled:opacity-30" :style="actionButtonStyle" :disabled="reader.chapterIndex >= reader.chapters.length - 1" @click="moveChapter(1)">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 5.293a1 1 0 011.414 0L13.414 10l-4.707 4.707a1 1 0 01-1.414-1.414L10.586 10 7.293 6.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
