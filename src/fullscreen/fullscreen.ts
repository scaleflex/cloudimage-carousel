export interface FullscreenControlOptions {
  onChange?: (isFullscreen: boolean) => void
}

export interface FullscreenControl {
  isFullscreen: () => boolean
  toggle: () => void
  enter: () => void
  exit: () => void
  destroy: () => void
}

function isFullscreenEnabled(): boolean {
  return !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled)
}

function getFullscreenElement(): Element | null {
  return document.fullscreenElement || (document as any).webkitFullscreenElement || null
}

function requestFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) return el.requestFullscreen()
  if ((el as any).webkitRequestFullscreen) {
    ;(el as any).webkitRequestFullscreen()
    return Promise.resolve()
  }
  return Promise.reject(new Error('Fullscreen API not supported'))
}

function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) return document.exitFullscreen()
  if ((document as any).webkitExitFullscreen) {
    ;(document as any).webkitExitFullscreen()
    return Promise.resolve()
  }
  return Promise.reject(new Error('Fullscreen API not supported'))
}

/** Create a fullscreen control for the given container */
export function createFullscreenControl(
  container: HTMLElement,
  options: FullscreenControlOptions = {},
): FullscreenControl | null {
  if (!isFullscreenEnabled()) return null

  const cleanups: (() => void)[] = []

  function isActive(): boolean {
    return getFullscreenElement() === container
  }

  function syncState(): void {
    const fs = isActive()
    container.classList.toggle('is-fullscreen', fs)
    options.onChange?.(fs)
  }

  function toggle(): void {
    if (isActive()) {
      exitFullscreen().catch(() => {})
    } else {
      requestFullscreen(container).catch(() => {})
    }
  }

  function enter(): void {
    if (!isActive()) {
      requestFullscreen(container).catch(() => {})
    }
  }

  function exit(): void {
    if (isActive()) {
      exitFullscreen().catch(() => {})
    }
  }

  // Listen to fullscreenchange (standard + webkit)
  const onChange = () => syncState()
  document.addEventListener('fullscreenchange', onChange)
  cleanups.push(() => document.removeEventListener('fullscreenchange', onChange))
  document.addEventListener('webkitfullscreenchange', onChange)
  cleanups.push(() => document.removeEventListener('webkitfullscreenchange', onChange))

  function destroy(): void {
    if (isActive()) {
      exitFullscreen().catch(() => {})
    }
    container.classList.remove('is-fullscreen')
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  }

  return {
    isFullscreen: isActive,
    toggle,
    enter,
    exit,
    destroy,
  }
}
