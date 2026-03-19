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
 * Creates a button element with a click handler.
 */
export const createButton = (
  className: string,
  innerHTML: string,
  ariaLabel: string,
  onClick: (e: MouseEvent) => void,
): HTMLButtonElement => {
  const button = document.createElement('button')
  button.classList.add('ci-carousel-btn', className)
  button.setAttribute('aria-label', ariaLabel)
  button.innerHTML = innerHTML
  button.addEventListener(CLICK_EVENT, (e: MouseEvent) => {
    e.stopPropagation()
    onClick(e)
  })
  return button
}
