import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { CloudImageCarousel } from '../src/core/carousel'
import type { CloudImageCarouselConfig } from '../src/core/types'

const TEST_IMAGES = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg']

function makeConfig(overrides?: Partial<CloudImageCarouselConfig>): Partial<CloudImageCarouselConfig> {
  return {
    images: TEST_IMAGES,
    autoplay: false,
    showThumbnails: false,
    showBullets: false,
    showControls: true,
    ...overrides,
  }
}

describe('CarouselControls', () => {
  let root: HTMLElement
  let carousel: CloudImageCarousel

  beforeEach(() => {
    root = document.createElement('div')
    root.id = 'controls-root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    carousel?.destroy()
    root.remove()
  })

  // ==========================================================================
  // Navigation buttons
  // ==========================================================================

  describe('navigation buttons', () => {
    it('renders prev and next buttons', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-prev')).toBeTruthy()
      expect(root.querySelector('.ci-carousel-next')).toBeTruthy()
    })

    it('prev button has correct aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-prev')?.getAttribute('aria-label')).toBe('Previous slide')
    })

    it('next button has correct aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-next')?.getAttribute('aria-label')).toBe('Next slide')
    })

    it('clicking prev button navigates to previous slide', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.goToSlide(1)
      const prevBtn = root.querySelector('.ci-carousel-prev') as HTMLButtonElement
      prevBtn.click()
      expect(carousel.currentIndex).toBe(0)
    })

    it('clicking next button navigates to next slide', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const nextBtn = root.querySelector('.ci-carousel-next') as HTMLButtonElement
      nextBtn.click()
      expect(carousel.currentIndex).toBe(1)
    })
  })

  // ==========================================================================
  // Fullscreen button
  // ==========================================================================

  describe('fullscreen button', () => {
    it('renders fullscreen button', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-fullscreen')).toBeTruthy()
    })

    it('fullscreen button has correct aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-fullscreen')?.getAttribute('aria-label')).toBe('Enter fullscreen')
    })
  })

  // ==========================================================================
  // Keyboard controls
  // ==========================================================================

  describe('keyboard controls', () => {
    function pressKey(key: string) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    }

    it('ArrowRight navigates to next slide when container has focus', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      root.setAttribute('tabindex', '0')
      root.focus()
      pressKey('ArrowRight')
      expect(carousel.currentIndex).toBe(1)
    })

    it('ArrowLeft navigates to previous slide', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.goToSlide(1)
      root.setAttribute('tabindex', '0')
      root.focus()
      pressKey('ArrowLeft')
      expect(carousel.currentIndex).toBe(0)
    })

    it('does not navigate when focus is outside container', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      // Focus is on body, not inside container
      document.body.focus()
      pressKey('ArrowRight')
      expect(carousel.currentIndex).toBe(0)
    })
  })

  // ==========================================================================
  // Autoplay button
  // ==========================================================================

  describe('autoplay button', () => {
    it('renders autoplay button when autoplay is enabled', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true }))
      carousel.init()
      expect(root.querySelector('.ci-carousel-autoplay')).toBeTruthy()
    })

    it('does not render autoplay button when autoplay is disabled', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ autoplay: false }))
      carousel.init()
      expect(root.querySelector('.ci-carousel-autoplay')).toBeNull()
    })

    it('toggles autoplay on click', () => {
      vi.useFakeTimers()
      carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true, autoplayInterval: 1000 }))
      carousel.init()

      const btn = root.querySelector('.ci-carousel-autoplay') as HTMLButtonElement
      btn.click() // pause
      expect(carousel.isAutoplayPaused).toBe(true)
      expect(btn.getAttribute('aria-label')).toBe('Resume autoplay')

      btn.click() // resume
      expect(carousel.isAutoplayPaused).toBe(false)
      expect(btn.getAttribute('aria-label')).toBe('Pause autoplay')

      carousel.destroy()
      vi.useRealTimers()
    })
  })

  // ==========================================================================
  // Controls visibility
  // ==========================================================================

  describe('controls visibility', () => {
    it('controls position class is applied', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ controlsPosition: 'bottom' }))
      carousel.init()
      expect(root.querySelector('.ci-carousel-controls--bottom')).toBeTruthy()
    })

    it('container gets has-controls class', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.classList.contains('ci-carousel-has-controls')).toBe(true)
    })
  })
})
