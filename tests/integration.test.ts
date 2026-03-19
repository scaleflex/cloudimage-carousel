import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { CloudImageCarousel } from '../src/core/carousel'
import type { CloudImageCarouselConfig } from '../src/core/types'

const TEST_IMAGES = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg']

function makeConfig(overrides?: Partial<CloudImageCarouselConfig>): Partial<CloudImageCarouselConfig> {
  return {
    images: TEST_IMAGES,
    autoplay: false,
    ...overrides,
  }
}

describe('Integration tests', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    root.id = 'integration-root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  // ==========================================================================
  // Full lifecycle
  // ==========================================================================

  describe('full lifecycle', () => {
    it('initializes, navigates, and destroys cleanly', () => {
      const onSlideChange = vi.fn()
      const carousel = new CloudImageCarousel(root, makeConfig({ onSlideChange, showControls: true }))
      carousel.init()

      // Verify initial state
      expect(root.querySelector('.ci-carousel-main')).toBeTruthy()
      expect(carousel.currentIndex).toBe(0)

      // Navigate
      carousel.next()
      expect(carousel.currentIndex).toBe(1)
      expect(onSlideChange).toHaveBeenCalledWith(1)

      carousel.prev()
      expect(carousel.currentIndex).toBe(0)
      expect(onSlideChange).toHaveBeenCalledWith(0)

      // Destroy
      carousel.destroy()
      expect(root.innerHTML).toBe('')
      expect(root.getAttribute('role')).toBeNull()
    })

    it('supports goToSlide through the full range', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()

      carousel.goToSlide(2)
      expect(carousel.currentIndex).toBe(2)

      carousel.goToSlide(0)
      expect(carousel.currentIndex).toBe(0)

      carousel.destroy()
    })
  })

  // ==========================================================================
  // Thumbnails + Bullets together
  // ==========================================================================

  describe('thumbnails and bullets', () => {
    it('renders both when enabled', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true, showBullets: true }))
      carousel.init()

      const thumbnails = root.querySelectorAll('.ci-carousel-thumbnail')
      const bullets = root.querySelectorAll('.ci-carousel-bullet')

      expect(thumbnails.length).toBe(3)
      expect(bullets.length).toBe(3)

      carousel.destroy()
    })

    it('updates both on slide change', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true, showBullets: true }))
      carousel.init()

      carousel.goToSlide(1)

      const activeThumbnail = root.querySelector('.ci-carousel-thumbnail.active')
      const activeBullet = root.querySelector('.ci-carousel-bullet.active')

      expect(activeThumbnail).toBeTruthy()
      expect(activeThumbnail?.getAttribute('aria-pressed')).toBe('true')
      expect(activeBullet).toBeTruthy()
      expect(activeBullet?.getAttribute('aria-pressed')).toBe('true')

      carousel.destroy()
    })
  })

  // ==========================================================================
  // Theme switching
  // ==========================================================================

  describe('theme switching', () => {
    it('toggles between light and dark themes', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ theme: 'light' }))
      carousel.init()

      expect(root.classList.contains('ci-carousel-theme-dark')).toBe(false)

      carousel.setTheme('dark')
      expect(root.classList.contains('ci-carousel-theme-dark')).toBe(true)

      carousel.setTheme('light')
      expect(root.classList.contains('ci-carousel-theme-dark')).toBe(false)

      carousel.destroy()
    })
  })

  // ==========================================================================
  // loadImages replacement
  // ==========================================================================

  describe('loadImages replacement', () => {
    it('replaces images after init', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()

      const newImages = ['https://example.com/new1.jpg', 'https://example.com/new2.jpg']
      carousel.loadImages(newImages)

      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      expect(slides.length).toBe(2)
      expect(carousel.currentIndex).toBe(0)

      carousel.destroy()
    })
  })

  // ==========================================================================
  // autoInit with multiple containers
  // ==========================================================================

  describe('autoInit with multiple containers', () => {
    it('initializes multiple carousels from data attributes', () => {
      const el1 = document.createElement('div')
      el1.dataset.ciCarouselImages = JSON.stringify(['a.jpg', 'b.jpg'])
      document.body.appendChild(el1)

      const el2 = document.createElement('div')
      el2.dataset.ciCarouselImages = JSON.stringify(['c.jpg', 'd.jpg'])
      document.body.appendChild(el2)

      const instances = CloudImageCarousel.autoInit()
      expect(instances.length).toBe(2)

      instances.forEach((c) => c.destroy())
      el1.remove()
      el2.remove()
    })
  })
})
