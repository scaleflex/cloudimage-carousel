import { describe, it, expect } from 'vitest'

import { isBrowser, createButton } from '../src/utils/dom.utils'

describe('isBrowser', () => {
  it('returns true in jsdom environment', () => {
    expect(isBrowser()).toBe(true)
  })
})

describe('createButton', () => {
  it('creates a button with the correct class', () => {
    const btn = createButton('my-class', '<span>Icon</span>', 'Click me', () => {})
    expect(btn.tagName).toBe('BUTTON')
    expect(btn.classList.contains('ci-carousel-btn')).toBe(true)
    expect(btn.classList.contains('my-class')).toBe(true)
  })

  it('sets aria-label', () => {
    const btn = createButton('cls', '', 'My label', () => {})
    expect(btn.getAttribute('aria-label')).toBe('My label')
  })

  it('sets innerHTML', () => {
    const btn = createButton('cls', '<svg></svg>', 'label', () => {})
    expect(btn.innerHTML).toBe('<svg></svg>')
  })

  it('calls onClick when clicked', () => {
    let clicked = false
    const btn = createButton('cls', '', 'label', () => {
      clicked = true
    })
    btn.click()
    expect(clicked).toBe(true)
  })

  it('stops event propagation on click', () => {
    const btn = createButton('cls', '', 'label', () => {})
    const parent = document.createElement('div')
    parent.appendChild(btn)

    let parentClicked = false
    parent.addEventListener('click', () => {
      parentClicked = true
    })

    btn.click()
    expect(parentClicked).toBe(false)
  })
})
