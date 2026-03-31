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

/** Vendor-prefixed fullscreen interfaces for Safari/older WebKit. */
interface WebkitDocument extends Document {
  webkitFullscreenEnabled?: boolean
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => void
}

interface WebkitHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => void
}

function isFullscreenEnabled(): boolean {
  const doc = document as WebkitDocument
  return !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)
}

function getFullscreenElement(): Element | null {
  const doc = document as WebkitDocument
  return doc.fullscreenElement || doc.webkitFullscreenElement || null
}

function requestFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) return el.requestFullscreen()
  const webkitEl = el as WebkitHTMLElement
  if (webkitEl.webkitRequestFullscreen) {
    webkitEl.webkitRequestFullscreen()
    return Promise.resolve()
  }
  return Promise.reject(new Error('Fullscreen API not supported'))
}

function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) return document.exitFullscreen()
  const doc = document as WebkitDocument
  if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen()
    return Promise.resolve()
  }
  return Promise.reject(new Error('Fullscreen API not supported'))
}

import { CI_CAROUSEL_IS_FULLSCREEN_CLASS } from '../constants/classes.constants'

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
    container.classList.toggle(CI_CAROUSEL_IS_FULLSCREEN_CLASS, fs)
    options.onChange?.(fs)
  }

  function logError(action: string) {
    return (err: Error) => console.warn(`[@cloudimage/carousel] Fullscreen ${action} failed:`, err.message)
  }

  function toggle(): void {
    if (isActive()) {
      exitFullscreen().catch(logError('exit'))
    } else {
      requestFullscreen(container).catch(logError('enter'))
    }
  }

  function enter(): void {
    if (!isActive()) {
      requestFullscreen(container).catch(logError('enter'))
    }
  }

  function exit(): void {
    if (isActive()) {
      exitFullscreen().catch(logError('exit'))
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
    container.classList.remove(CI_CAROUSEL_IS_FULLSCREEN_CLASS)
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
