import { CLICK_EVENT } from '../constants'

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
