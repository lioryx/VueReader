<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()
const showUpdateBanner = ref(false)
const isApplyingUpdate = ref(false)
let serviceWorkerRegistration: ServiceWorkerRegistration | undefined
let updateTimer: number | undefined

const updateBannerStyle = computed(() => ({
  backgroundColor: settings.appPalette.surfaceBg,
  color: settings.appPalette.text,
  borderColor: settings.appPalette.border,
  boxShadow: settings.appPalette.shadow,
}))

const updateButtonStyle = computed(() => ({
  backgroundColor: settings.appPalette.primaryBg,
  color: settings.appPalette.primaryText,
}))

const updateLaterStyle = computed(() => ({
  backgroundColor: settings.appPalette.primarySoftBg,
  color: settings.appPalette.primarySoftText,
}))

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onNeedRefresh() {
    showUpdateBanner.value = true
  },
  onRegisteredSW(_, registration) {
    serviceWorkerRegistration = registration
    if (!registration) return

    updateTimer = window.setInterval(() => {
      void registration.update()
    }, 5 * 60 * 1000)
  },
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void serviceWorkerRegistration?.update()
  }
}

async function refreshApp() {
  if (isApplyingUpdate.value) return

  isApplyingUpdate.value = true

  let didReload = false
  const reloadPage = () => {
    if (didReload) return
    didReload = true
    window.location.reload()
  }

  const handleControllerChange = () => {
    reloadPage()
  }

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true })

  try {
    serviceWorkerRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    await updateServiceWorker()

    window.setTimeout(() => {
      reloadPage()
    }, 1500)
  } catch (error) {
    console.error('Failed to apply app update', error)
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    isApplyingUpdate.value = false
  }
}

function dismissUpdate() {
  showUpdateBanner.value = false
}

watchEffect(() => {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.currentTheme.bg)
  document.documentElement.toggleAttribute('data-eink-mode', settings.isEink)
  document.body.toggleAttribute('data-eink-mode', settings.isEink)

  if (needRefresh.value) {
    showUpdateBanner.value = true
  }
})

document.addEventListener('visibilitychange', onVisibilityChange)

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)

  if (updateTimer !== undefined) {
    window.clearInterval(updateTimer)
  }
})
</script>

<template>
  <div class="h-full overflow-hidden">
    <Transition name="slide-up">
      <div
        v-if="showUpdateBanner"
        class="fixed inset-x-4 bottom-4 z-[90] rounded-2xl border px-4 py-3"
        :style="updateBannerStyle"
      >
        <div class="flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">发现新版本</p>
            <p class="mt-1 text-xs opacity-75">{{ isApplyingUpdate ? '正在切换到新版本…' : '更新后即可使用最新功能与修复。' }}</p>
          </div>
          <button class="rounded-lg px-3 py-1.5 text-xs font-semibold" :style="updateLaterStyle" :disabled="isApplyingUpdate" @click="dismissUpdate">稍后</button>
          <button class="rounded-lg px-3 py-1.5 text-xs font-semibold" :style="updateButtonStyle" :disabled="isApplyingUpdate" @click="refreshApp">{{ isApplyingUpdate ? '更新中…' : '立即更新' }}</button>
        </div>
      </div>
    </Transition>
    <router-view />
  </div>
</template>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

:root[data-eink-mode] *,
body[data-eink-mode] * {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
  box-shadow: none !important;
  text-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

:root[data-eink-mode] *::before,
:root[data-eink-mode] *::after,
body[data-eink-mode] *::before,
body[data-eink-mode] *::after {
  animation: none !important;
  transition: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
</style>
