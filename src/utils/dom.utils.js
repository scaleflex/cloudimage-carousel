import { CLICK_EVENT } from '../constants'

/**
 * Creates a button element
 * @param {string} className - The class name of the button
 * @param {string} innerHTML - The inner HTML of the button
 * @param {function} onClick - The function to call when the button is clicked
 * @returns {HTMLButtonElement} - The created button element
 */
const createButton = (className, innerHTML, ariaLabel, onClick) => {
  const button = document.createElement('button')
  button.classList.add('ci-carousel-btn', className)
  button.setAttribute('aria-label', ariaLabel)
  button.innerHTML = innerHTML
  button.addEventListener(CLICK_EVENT, (e) => {
    e.stopPropagation()
    onClick(e)
  })
  return button
}

export { createButton }
