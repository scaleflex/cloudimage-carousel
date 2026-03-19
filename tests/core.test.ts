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
    showControls: false,
    ...overrides,
  }
}

describe('CloudImageCarousel', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    root.id = 'test-root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('constructor', () => {
    it('throws when container is empty string', () => {
      expect(() => new CloudImageCarousel('', makeConfig())).toThrow('Container parameter is required')
    })

    it('throws when container is null', () => {
      expect(() => new CloudImageCarousel(null as any, makeConfig())).toThrow('Container parameter is required')
    })

    it('throws when selector does not match any element', () => {
      expect(() => new CloudImageCarousel('#nonexistent', makeConfig())).toThrow('not found')
    })

    it('accepts an HTMLElement directly', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      expect(carousel).toBeDefined()
      carousel.destroy()
    })

    it('accepts a CSS selector string', () => {
      const carousel = new CloudImageCarousel('#test-root', makeConfig())
      expect(carousel).toBeDefined()
      carousel.destroy()
    })
  })

  // ==========================================================================
  // Initialization & DOM structure
  // ==========================================================================

  describe('init', () => {
    it('creates main view container', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-main')).toBeTruthy()
      carousel.destroy()
    })

    it('creates images container with role="list"', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const container = root.querySelector('.ci-carousel-images-container')
      expect(container).toBeTruthy()
      expect(container?.getAttribute('role')).toBe('list')
      carousel.destroy()
    })

    it('renders correct number of slides', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      expect(slides.length).toBe(3)
      carousel.destroy()
    })

    it('sets first slide as active', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      expect(slides[0].classList.contains('active')).toBe(true)
      expect(slides[1].classList.contains('active')).toBe(false)
      carousel.destroy()
    })

    it('creates thumbnails when showThumbnails is true', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true }))
      carousel.init()
      expect(root.querySelector('.ci-carousel-thumbnails')).toBeTruthy()
      carousel.destroy()
    })

    it('does not create thumbnails when showThumbnails is false', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: false }))
      carousel.init()
      expect(root.querySelector('.ci-carousel-thumbnails')).toBeNull()
      carousel.destroy()
    })

    it('creates bullets when showBullets is true', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showBullets: true }))
      carousel.init()
      const bullets = root.querySelectorAll('.ci-carousel-bullet')
      expect(bullets.length).toBe(3)
      carousel.destroy()
    })

    it('creates controls when showControls is true', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showControls: true }))
      carousel.init()
      expect(root.querySelector('.ci-carousel-controls')).toBeTruthy()
      expect(root.querySelector('.ci-carousel-prev')).toBeTruthy()
      expect(root.querySelector('.ci-carousel-next')).toBeTruthy()
      carousel.destroy()
    })
  })

  // ==========================================================================
  // Navigation
  // ==========================================================================

  describe('navigation', () => {
    it('next() advances to the next slide', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(carousel.currentIndex).toBe(0)
      carousel.next()
      expect(carousel.currentIndex).toBe(1)
      carousel.destroy()
    })

    it('prev() goes to the previous slide', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.next()
      carousel.prev()
      expect(carousel.currentIndex).toBe(0)
      carousel.destroy()
    })

    it('goToSlide() navigates to specific index', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.goToSlide(2)
      expect(carousel.currentIndex).toBe(2)
      carousel.destroy()
    })

    it('cycles from last to first when cycle is true', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: true }))
      carousel.init()
      carousel.goToSlide(2)
      carousel.next()
      expect(carousel.currentIndex).toBe(0)
      carousel.destroy()
    })

    it('stays on last slide when cycle is false', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: false }))
      carousel.init()
      carousel.goToSlide(2)
      carousel.next()
      expect(carousel.currentIndex).toBe(2)
      carousel.destroy()
    })

    it('cycles from first to last when going prev with cycle true', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: true }))
      carousel.init()
      carousel.prev()
      expect(carousel.currentIndex).toBe(2)
      carousel.destroy()
    })

    it('stays on first slide when going prev with cycle false', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: false }))
      carousel.init()
      carousel.prev()
      expect(carousel.currentIndex).toBe(0)
      carousel.destroy()
    })

    it('does not navigate with single image', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ images: ['single.jpg'] }))
      carousel.init()
      carousel.next()
      expect(carousel.currentIndex).toBe(0)
      carousel.destroy()
    })

    it('fires onSlideChange callback', () => {
      const onChange = vi.fn()
      const carousel = new CloudImageCarousel(root, makeConfig({ onSlideChange: onChange }))
      carousel.init()
      carousel.next()
      expect(onChange).toHaveBeenCalledWith(1)
      carousel.destroy()
    })
  })

  // ==========================================================================
  // loadImages
  // ==========================================================================

  describe('loadImages', () => {
    it('replaces images and resets to index 0', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.goToSlide(2)
      carousel.loadImages(['new1.jpg', 'new2.jpg'])
      expect(carousel.currentIndex).toBe(0)
      expect(root.querySelectorAll('.ci-carousel-image-wrapper').length).toBe(2)
      carousel.destroy()
    })

    it('does nothing with empty array', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const initialCount = root.querySelectorAll('.ci-carousel-image-wrapper').length
      carousel.loadImages([])
      expect(root.querySelectorAll('.ci-carousel-image-wrapper').length).toBe(initialCount)
      carousel.destroy()
    })

    it('accepts object image sources', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.loadImages([{ src: 'photo.jpg', alt: 'A photo' }])
      const slide = root.querySelector('.ci-carousel-image-wrapper')
      expect(slide?.getAttribute('aria-label')).toContain('A photo')
      carousel.destroy()
    })
  })

  // ==========================================================================
  // Theme
  // ==========================================================================

  describe('theme', () => {
    it('applies dark theme class', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ theme: 'dark' }))
      carousel.init()
      expect(root.classList.contains('ci-carousel-theme-dark')).toBe(true)
      carousel.destroy()
    })

    it('setTheme switches theme at runtime', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ theme: 'light' }))
      carousel.init()
      expect(root.classList.contains('ci-carousel-theme-dark')).toBe(false)
      carousel.setTheme('dark')
      expect(root.classList.contains('ci-carousel-theme-dark')).toBe(true)
      carousel.destroy()
    })
  })

  // ==========================================================================
  // Autoplay
  // ==========================================================================

  describe('autoplay', () => {
    it('starts autoplay on init when configured', () => {
      vi.useFakeTimers()
      const carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true, autoplayInterval: 1000 }))
      carousel.init()
      expect(carousel.currentIndex).toBe(0)
      vi.advanceTimersByTime(1000)
      expect(carousel.currentIndex).toBe(1)
      carousel.destroy()
      vi.useRealTimers()
    })

    it('stopAutoplay stops auto-advancement', () => {
      vi.useFakeTimers()
      const carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true, autoplayInterval: 1000 }))
      carousel.init()
      carousel.stopAutoplay()
      vi.advanceTimersByTime(5000)
      expect(carousel.currentIndex).toBe(0)
      carousel.destroy()
      vi.useRealTimers()
    })

    it('pauseAutoplay sets isAutoplayPaused', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true }))
      carousel.init()
      carousel.pauseAutoplay()
      expect(carousel.isAutoplayPaused).toBe(true)
      carousel.destroy()
    })

    it('resumeAutoplay resumes after pause', () => {
      vi.useFakeTimers()
      const carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true, autoplayInterval: 1000 }))
      carousel.init()
      carousel.pauseAutoplay()
      carousel.resumeAutoplay()
      vi.advanceTimersByTime(1000)
      expect(carousel.currentIndex).toBe(1)
      carousel.destroy()
      vi.useRealTimers()
    })
  })

  // ==========================================================================
  // Destroy
  // ==========================================================================

  describe('destroy', () => {
    it('clears container innerHTML', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.destroy()
      expect(root.innerHTML).toBe('')
    })

    it('removes ARIA attributes from container', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.destroy()
      expect(root.getAttribute('role')).toBeNull()
      expect(root.getAttribute('aria-label')).toBeNull()
      expect(root.getAttribute('aria-roledescription')).toBeNull()
    })

    it('removes carousel classes from container', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ showControls: true }))
      carousel.init()
      carousel.destroy()
      expect(root.classList.contains('ci-carousel')).toBe(false)
      expect(root.classList.contains('ci-carousel-has-controls')).toBe(false)
    })

    it('is idempotent — second destroy does nothing', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.destroy()
      expect(() => carousel.destroy()).not.toThrow()
    })
  })

  // ==========================================================================
  // autoInit
  // ==========================================================================

  describe('autoInit', () => {
    it('discovers and initializes elements with data-ci-carousel-images', () => {
      const el = document.createElement('div')
      el.setAttribute('data-ci-carousel-images', JSON.stringify(TEST_IMAGES))
      document.body.appendChild(el)

      const instances = CloudImageCarousel.autoInit()
      expect(instances.length).toBe(1)
      expect(el.querySelector('.ci-carousel-main')).toBeTruthy()

      instances.forEach((i) => i.destroy())
      el.remove()
    })

    it('scopes search to provided root element', () => {
      const scope = document.createElement('div')
      const el = document.createElement('div')
      el.setAttribute('data-ci-carousel-images', JSON.stringify(TEST_IMAGES))
      scope.appendChild(el)
      document.body.appendChild(scope)

      const instances = CloudImageCarousel.autoInit(scope)
      expect(instances.length).toBe(1)

      instances.forEach((i) => i.destroy())
      scope.remove()
    })

    it('returns empty array when no matching elements', () => {
      const instances = CloudImageCarousel.autoInit()
      expect(instances).toEqual([])
    })
  })
})
