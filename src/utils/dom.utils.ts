import { CLICK_EVENT } from '../constants'

const STYLE_ID = 'ci-carousel-styles'

/** Check if code is running in browser environment */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/** Idempotent CSS style injection — only injects once per page */
export function injectStyles(css: string): void {
  if (!isBrowser()) return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}

/**
 * Typed event listener helper that returns a cleanup function.
 * Returns a cleanup function for easy integration with the cleanup stack.
 */
export function addListener<K extends keyof HTMLElementEventMap>(
  el: EventTarget,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void {
  el.addEventListener(event, handler as EventListener, options)
  return () => el.removeEventListener(event, handler as EventListener, options)
}

/**
 * Creates a button element with a click handler.
 * Returns [button, cleanup] — call cleanup() to remove the listener.
 */
export const createButton = (
  className: string,
  innerHTML: string,
  ariaLabel: string,
  onClick: (e: MouseEvent) => void,
): [HTMLButtonElement, () => void] => {
  const button = document.createElement('button')
  button.classList.add('ci-carousel-btn', className)
  button.setAttribute('aria-label', ariaLabel)
  button.innerHTML = innerHTML
  const handler = (e: MouseEvent) => {
    e.stopPropagation()
    onClick(e)
  }
  button.addEventListener(CLICK_EVENT, handler)
  const cleanup = () => button.removeEventListener(CLICK_EVENT, handler)
  return [button, cleanup]
}
