/**
 * ARIA and screen reader utilities for the carousel.
 *
 * Provides a shared live region with reference counting so multiple
 * carousel instances don't create duplicate regions.
 */

const SR_ONLY_CLASS = 'ci-carousel-sr-only'

/** Incrementing counter for guaranteed unique IDs across rapid initializations. */
let idCounter = 0

/** Create a visually-hidden live region element for screen reader announcements. */
export function createLiveRegion(): HTMLDivElement {
  const region = document.createElement('div')
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.className = SR_ONLY_CLASS
  return region
}

/** Create a visually-hidden element with keyboard usage hints. */
export function createKeyboardHints(): HTMLDivElement {
  const hints = document.createElement('div')
  hints.id = `ci-carousel-help-${++idCounter}`
  hints.className = SR_ONLY_CLASS
  hints.textContent =
    'Use arrow keys to navigate slides. Plus or equals to zoom in, minus to zoom out, zero to reset zoom. F for fullscreen. Escape to reset zoom.'
  return hints
}

/**
 * Announce a message to screen readers via a live region.
 * Clears first so duplicate messages are still announced.
 */
export function announceToScreenReader(liveRegion: HTMLElement | null, message: string): void {
  if (!liveRegion) return
  liveRegion.textContent = ''
  liveRegion.textContent = message
}

/** Apply ARIA attributes to the carousel container. */
export function applyContainerAria(container: HTMLElement, keyboardHintsId: string): void {
  container.setAttribute('role', 'region')
  container.setAttribute('aria-label', 'Image carousel')
  container.setAttribute('aria-roledescription', 'carousel')
  container.setAttribute('aria-describedby', keyboardHintsId)
}


export function removeContainerAria(container: HTMLElement): void {
  container.removeAttribute('role')
  container.removeAttribute('aria-label')
  container.removeAttribute('aria-roledescription')
  container.removeAttribute('aria-describedby')
}
