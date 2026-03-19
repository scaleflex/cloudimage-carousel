import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { CloudImageCarousel } from '../src/core/carousel'
import type { CloudImageCarouselConfig } from '../src/core/types'

const TEST_IMAGES = [
  { src: 'https://example.com/img1.jpg', alt: 'First image' },
  { src: 'https://example.com/img2.jpg', alt: 'Second image' },
  { src: 'https://example.com/img3.jpg', alt: 'Third image' },
]

function makeConfig(overrides?: Partial<CloudImageCarouselConfig>): Partial<CloudImageCarouselConfig> {
  return {
    images: TEST_IMAGES,
    autoplay: false,
    showThumbnails: true,
    showBullets: true,
    showControls: false,
    ...overrides,
  }
}

describe('Accessibility', () => {
  let root: HTMLElement
  let carousel: CloudImageCarousel

  beforeEach(() => {
    root = document.createElement('div')
    root.id = 'a11y-root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    carousel?.destroy()
    root.remove()
  })

  // ==========================================================================
  // Container ARIA
  // ==========================================================================

  describe('container ARIA attributes', () => {
    it('sets role="region" on container', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.getAttribute('role')).toBe('region')
    })

    it('sets aria-label on container', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.getAttribute('aria-label')).toBe('Image carousel')
    })

    it('sets aria-roledescription="carousel"', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.getAttribute('aria-roledescription')).toBe('carousel')
    })

    it('has aria-describedby pointing to keyboard hints', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const describedBy = root.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      const hints = root.querySelector(`#${describedBy}`)
      expect(hints).toBeTruthy()
      expect(hints?.textContent).toContain('arrow keys')
    })
  })

  // ==========================================================================
  // Slides ARIA
  // ==========================================================================

  describe('slide ARIA attributes', () => {
    it('slides container has role="list"', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      expect(root.querySelector('.ci-carousel-images-container')?.getAttribute('role')).toBe('list')
    })

    it('each slide has role="listitem"', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      slides.forEach((slide) => {
        expect(slide.getAttribute('role')).toBe('listitem')
      })
    })

    it('each slide has aria-roledescription="slide"', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
      slides.forEach((slide) => {
        expect(slide.getAttribute('aria-roledescription')).toBe('slide')
      })
    })

    it('slides have descriptive aria-label with index and alt', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const firstSlide = root.querySelector('.ci-carousel-image-wrapper')
      expect(firstSlide?.getAttribute('aria-label')).toBe('Slide 1 of 3: First image')
    })
  })

  // ==========================================================================
  // Live region
  // ==========================================================================

  describe('live region', () => {
    it('creates a live region with role="status"', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      const region = root.querySelector('[role="status"]')
      expect(region).toBeTruthy()
      expect(region?.getAttribute('aria-live')).toBe('polite')
      expect(region?.getAttribute('aria-atomic')).toBe('true')
    })

    it('announces slide changes via live region', () => {
      carousel = new CloudImageCarousel(root, makeConfig())
      carousel.init()
      carousel.next()
      const region = root.querySelector('[role="status"]')
      expect(region?.textContent).toBe('Slide 2 of 3: Second image')
    })
  })

  // ==========================================================================
  // Thumbnails ARIA
  // ==========================================================================

  describe('thumbnails accessibility', () => {
    it('thumbnail container has role="group" and aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true }))
      carousel.init()
      const container = root.querySelector('.ci-carousel-thumbnails')
      expect(container?.getAttribute('role')).toBe('group')
      expect(container?.getAttribute('aria-label')).toBe('Slide thumbnails')
    })

    it('thumbnails are buttons with aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true }))
      carousel.init()
      const thumbs = root.querySelectorAll('.ci-carousel-thumbnail')
      expect(thumbs[0].tagName).toBe('BUTTON')
      expect(thumbs[0].getAttribute('aria-label')).toBe('Go to slide 1: First image')
    })

    it('active thumbnail has aria-pressed="true"', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true }))
      carousel.init()
      const thumbs = root.querySelectorAll('.ci-carousel-thumbnail')
      expect(thumbs[0].getAttribute('aria-pressed')).toBe('true')
      expect(thumbs[1].getAttribute('aria-pressed')).toBe('false')
    })

    it('thumbnail images are aria-hidden', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true }))
      carousel.init()
      const thumbImgs = root.querySelectorAll('.ci-carousel-thumbnail img')
      thumbImgs.forEach((img) => {
        expect(img.getAttribute('aria-hidden')).toBe('true')
      })
    })

    it('updates aria-pressed on slide change', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showThumbnails: true }))
      carousel.init()
      carousel.next()
      const thumbs = root.querySelectorAll('.ci-carousel-thumbnail')
      expect(thumbs[0].getAttribute('aria-pressed')).toBe('false')
      expect(thumbs[1].getAttribute('aria-pressed')).toBe('true')
    })
  })

  // ==========================================================================
  // Bullets ARIA
  // ==========================================================================

  describe('bullets accessibility', () => {
    it('bullet container has role="group" and aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showBullets: true }))
      carousel.init()
      const container = root.querySelector('.ci-carousel-bullets')
      expect(container?.getAttribute('role')).toBe('group')
      expect(container?.getAttribute('aria-label')).toBe('Slide indicators')
    })

    it('bullets are buttons with aria-label', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showBullets: true }))
      carousel.init()
      const bullets = root.querySelectorAll('.ci-carousel-bullet')
      expect(bullets[0].tagName).toBe('BUTTON')
      expect(bullets[0].getAttribute('aria-label')).toBe('Go to slide 1')
    })

    it('active bullet has aria-pressed="true" and tabindex="0"', () => {
      carousel = new CloudImageCarousel(root, makeConfig({ showBullets: true }))
      carousel.init()
      const bullets = root.querySelectorAll('.ci-carousel-bullet')
      expect(bullets[0].getAttribute('aria-pressed')).toBe('true')
      expect(bullets[0].getAttribute('tabindex')).toBe('0')
      expect(bullets[1].getAttribute('tabindex')).toBe('-1')
    })
  })
})
