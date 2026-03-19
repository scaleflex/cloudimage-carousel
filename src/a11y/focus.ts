/**
 * Focus management utilities for the carousel.
 *
 * Provides focus trap for fullscreen mode and roving tabindex helpers.
 */

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Query all focusable elements within a container. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

/**
 * Create a focus trap that keeps Tab navigation within the container.
 * Used in fullscreen mode to prevent focus from escaping behind the overlay.
 *
 * @param container - Element to trap focus within.
 * @param isActive - Optional guard function; trap only engages when it returns true.
 * @returns A cleanup function to remove the trap.
 */
export function createFocusTrap(container: HTMLElement, isActive?: () => boolean): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    if (isActive && !isActive()) return

    const focusable = getFocusableElements(container)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}
