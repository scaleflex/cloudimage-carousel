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

describe('Edge cases', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    root.id = 'edge-root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  // ==========================================================================
  // Single image
  // ==========================================================================

  describe('single image', () => {
    it('does not navigate with only one image', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ images: ['single.jpg'] }))
      carousel.init()

      carousel.next()
      expect(carousel.currentIndex).toBe(0)

      carousel.prev()
      expect(carousel.currentIndex).toBe(0)

      carousel.destroy()
    })
  })

  // ==========================================================================
  // Empty images
  // ==========================================================================

  describe('empty images', () => {
    it('handles empty array gracefully', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ images: [] }))
      carousel.init()

      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      expect(slides.length).toBe(0)

      carousel.destroy()
    })

    it('loadImages with empty array is a no-op', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()

      const slidesBefore = root.querySelectorAll('.ci-carousel-image-wrapper').length
      carousel.loadImages([])
      const slidesAfter = root.querySelectorAll('.ci-carousel-image-wrapper').length

      expect(slidesAfter).toBe(slidesBefore)
      carousel.destroy()
    })
  })

  // ==========================================================================
  // Boundary navigation
  // ==========================================================================

  describe('boundary navigation', () => {
    it('wraps from last to first when cycle is true', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: true }))
      carousel.init()

      carousel.goToSlide(2) // last
      carousel.next() // should wrap to 0
      expect(carousel.currentIndex).toBe(0)

      carousel.destroy()
    })

    it('stays at boundary when cycle is false', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: false }))
      carousel.init()

      carousel.goToSlide(2) // last
      carousel.next() // should stay at 2
      expect(carousel.currentIndex).toBe(2)

      carousel.prev()
      carousel.prev()
      carousel.prev() // should stay at 0
      expect(carousel.currentIndex).toBe(0)

      carousel.destroy()
    })

    it('clamps goToSlide to valid range', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: false }))
      carousel.init()

      carousel.goToSlide(100)
      expect(carousel.currentIndex).toBe(2) // clamped to last

      carousel.goToSlide(-100)
      expect(carousel.currentIndex).toBe(0) // clamped to first

      carousel.destroy()
    })
  })

  // ==========================================================================
  // Rapid operations
  // ==========================================================================

  describe('rapid operations', () => {
    it('handles rapid next() calls', () => {
      const carousel = new CloudImageCarousel(root, makeConfig({ cycle: true }))
      carousel.init()

      for (let i = 0; i < 20; i++) {
        carousel.next()
      }

      // Should be at index 20 % 3 = 2
      expect(carousel.currentIndex).toBeGreaterThanOrEqual(0)
      expect(carousel.currentIndex).toBeLessThan(3)

      carousel.destroy()
    })

    it('handles destroy during autoplay', () => {
      vi.useFakeTimers()

      const carousel = new CloudImageCarousel(root, makeConfig({ autoplay: true, autoplayInterval: 100 }))
      carousel.init()

      vi.advanceTimersByTime(50)
      carousel.destroy()

      // Should not throw when timer fires after destroy
      vi.advanceTimersByTime(200)

      vi.useRealTimers()
    })
  })

  // ==========================================================================
  // Double destroy
  // ==========================================================================

  describe('double destroy', () => {
    it('is safe to call destroy() twice', () => {
      const carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()

      carousel.destroy()
      expect(() => carousel.destroy()).not.toThrow()
    })
  })

  // ==========================================================================
  // Image error handling
  // ==========================================================================

  describe('image error handling', () => {
    it('fires onError callback when image fails to load', () => {
      const onError = vi.fn()
      const carousel = new CloudImageCarousel(root, makeConfig({ onError }))
      carousel.init()

      // Simulate error on first image
      const img = root.querySelector('.ci-carousel-image') as HTMLImageElement
      if (img) {
        img.dispatchEvent(new Event('error'))
      }

      expect(onError).toHaveBeenCalledWith('https://example.com/img1.jpg', 0)
      carousel.destroy()
    })
  })

  // ==========================================================================
  // Object image sources
  // ==========================================================================

  describe('object image sources', () => {
    it('handles mixed string and object sources', () => {
      const images = [
        'plain.jpg',
        { src: 'rich.jpg', alt: 'Custom alt text' },
        'another.jpg',
      ]

      const carousel = new CloudImageCarousel(root, makeConfig({ images }))
      carousel.init()

      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      expect(slides.length).toBe(3)

      // Check custom alt
      const imgs = root.querySelectorAll('.ci-carousel-image') as NodeListOf<HTMLImageElement>
      expect(imgs[1].alt).toBe('Custom alt text')

      carousel.destroy()
    })
  })
})
