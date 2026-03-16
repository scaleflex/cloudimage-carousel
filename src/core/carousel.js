import screenfull from 'screenfull'

import {
  ACTIVE_CLASS,
  CI_CAROUSEL_BULLETS_CONTAINER_CLASS,
  CI_CAROUSEL_BULLET_CLASS,
  CI_CAROUSEL_CONTROLS_CLASS,
  CI_CAROUSEL_FULLSCREEN_CLASS,
  CI_CAROUSEL_IMAGES_CONTAINER_CLASS,
  CI_CAROUSEL_IMAGE_CLASS,
  CI_CAROUSEL_IMAGE_WRAPPER_CLASS,
  CI_CAROUSEL_MAIN_CLASS,
  CI_CAROUSEL_THUMBNAILS_CLASS,
  CI_HOST_CONTAINER_CLASS,
} from '../constants/classes.constants'
import { CLICK_EVENT } from '../constants/events.constants'
import { ICONS } from '../constants/icons.contants'
import { CarouselControls } from '../controls/controls'
import { SwipeControls } from '../controls/swipe.controls'
import { ZoomPanControls } from '../controls/zoom-pan.controls'
import { getFilenameWithoutExtension } from '../utils/image.utils'

import { mergeConfig, parseDataAttributes, validateConfig } from './config'

/**
 * Normalizes an image source entry to { src, alt } object.
 * Accepts strings or objects with src/alt properties.
 * @param {string|Object} entry
 * @param {number} index
 * @returns {{ src: string, alt: string }}
 */
function normalizeImage(entry, index) {
  if (typeof entry === 'string') {
    return { src: entry, alt: `Image ${index + 1}` }
  }
  return {
    src: entry.src || '',
    alt: entry.alt || `Image ${index + 1}`,
  }
}

class CloudImageCarousel {
  /**
   * @param {string|HTMLElement} container - The container element or selector
   * @param {Object} options - Configuration options
   * @throws {Error} If container is null, undefined, or not found in DOM
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container parameter is required')
    }

    this.container = typeof container === 'string' ? document.querySelector(container) : container

    if (!this.container || !(this.container instanceof HTMLElement)) {
      throw new Error(
        `Invalid container: ${
          typeof container === 'string' ? `Element "${container}" not found` : 'Container must be a valid HTML element'
        }`,
      )
    }

    // Config: defaults → data attributes → JS options (immutable merge)
    const dataConfig = parseDataAttributes(this.container)
    this.options = mergeConfig(dataConfig, options)
    validateConfig(this.options)

    this.currentIndex = 0
    this.images = []
    this.isFullscreen = false
    this.isDestroyed = false
    this.isAutoplayPaused = false

    // Cleanup stack — collect teardown functions, destroy() calls all (hotspot pattern)
    this.cleanups = []
  }

  /** Main view which wraps all containers */
  mainView
  /** Image container */
  imagesContainer
  /** Thumbnails container */
  thumbnailsContainer
  /** Controls container */
  controlsContainer
  /** Bullets container */
  bulletsContainer

  /**
   * Initializes the carousel
   */
  init() {
    this.createStructure()
    this.loadImages(this.options.images)

    if (this.options.showControls) {
      this.controls = new CarouselControls(this)
      this.cleanups.push(() => this.controls.destroy())

      this.zoomPanControls = new ZoomPanControls(this)
      this.cleanups.push(() => this.zoomPanControls.destroy())
    }

    this.swipeControls = new SwipeControls(this)
    this.cleanups.push(() => this.swipeControls.destroy())

    this.setupFullscreenHandler()

    if (this.options.autoplay) {
      this.startAutoplay()
    }
  }

  createStructure() {
    // Main container
    this.container.setAttribute('role', 'region')
    this.container.classList.add(CI_HOST_CONTAINER_CLASS)
    this.container.setAttribute('aria-label', 'Image carousel')
    this.container.setAttribute('aria-roledescription', 'carousel')

    this.applyTheme()

    // Main view
    this.mainView = document.createElement('div')
    this.mainView.classList.add(CI_CAROUSEL_MAIN_CLASS)

    // Images container
    this.imagesContainer = document.createElement('div')
    this.imagesContainer.classList.add(CI_CAROUSEL_IMAGES_CONTAINER_CLASS)
    this.imagesContainer.setAttribute('role', 'list')
    this.imagesContainer.setAttribute('aria-label', 'Slides')

    this.mainView.appendChild(this.imagesContainer)

    // Controls overlay inside mainView
    if (this.options.showControls) {
      this.controlsContainer = document.createElement('div')
      this.controlsContainer.classList.add(CI_CAROUSEL_CONTROLS_CLASS)
      this.controlsContainer.classList.add(`ci-carousel-controls--${this.options.controlsPosition}`)
      this.container.classList.add('ci-carousel-has-controls')
      this.mainView.appendChild(this.controlsContainer)
    }

    this.container.appendChild(this.mainView)

    // Bottom container for thumbnails and bullets
    this.bottomContainer = document.createElement('div')
    this.bottomContainer.classList.add('ci-carousel-bottom-container')

    // Thumbnails
    if (this.options.showThumbnails) {
      this.container.classList.add('ci-carousel-has-thumbnails')
      this.thumbnailsContainer = document.createElement('div')
      this.thumbnailsContainer.classList.add(CI_CAROUSEL_THUMBNAILS_CLASS)
      this.thumbnailsContainer.setAttribute('role', 'group')
      this.thumbnailsContainer.setAttribute('aria-label', 'Slide thumbnails')
      this.bottomContainer.appendChild(this.thumbnailsContainer)
    }

    // Bullets
    if (this.options.showBullets) {
      this.bulletsContainer = document.createElement('div')
      this.bulletsContainer.classList.add(CI_CAROUSEL_BULLETS_CONTAINER_CLASS)
      this.bulletsContainer.setAttribute('role', 'group')
      this.bulletsContainer.setAttribute('aria-label', 'Slide indicators')
      this.container.classList.add('ci-carousel-has-bullets')
      this.bottomContainer.appendChild(this.bulletsContainer)
    }

    this.container.appendChild(this.bottomContainer)

    // Live region for screen reader announcements (WCAG 4.1.3)
    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('role', 'status')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.className = 'ci-carousel-sr-only'
    this.container.appendChild(this.liveRegion)

    // Hidden keyboard hints
    this.keyboardHints = document.createElement('div')
    this.keyboardHints.id = `ci-carousel-help-${Date.now()}`
    this.keyboardHints.className = 'ci-carousel-sr-only'
    this.keyboardHints.textContent = 'Use arrow keys to navigate slides. Escape to reset zoom.'
    this.container.appendChild(this.keyboardHints)
    this.container.setAttribute('aria-describedby', this.keyboardHints.id)
  }

  /**
   * Loads images into the carousel and initializes their loading state
   * @param {Array<string|Object>} sources - Image sources (strings or { src, alt } objects)
   */
  loadImages(sources) {
    if (!Array.isArray(sources) || sources.length === 0) return

    this.images = sources.map((entry, index) => ({
      ...normalizeImage(entry, index),
      loaded: false,
    }))
    this.renderImages()
  }

  renderImages() {
    this.imagesContainer.innerHTML = ''
    this.images.forEach((image, index) => {
      const wrapper = document.createElement('div')
      wrapper.classList.add(CI_CAROUSEL_IMAGE_WRAPPER_CLASS)
      wrapper.classList.add(this.options.transitionEffect)
      wrapper.style.display = index === this.currentIndex ? 'block' : 'none'

      wrapper.setAttribute('role', 'listitem')
      wrapper.setAttribute('aria-roledescription', 'slide')
      wrapper.setAttribute('aria-label', `Slide ${index + 1} of ${this.images.length}: ${image.alt}`)

      if (index === this.currentIndex) {
        wrapper.classList.add(ACTIVE_CLASS)
      }

      const img = new Image()
      img.classList.add(CI_CAROUSEL_IMAGE_CLASS)
      img.alt = image.alt
      img.dataset.src = image.src
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'
      img.loading = 'lazy'

      wrapper.appendChild(img)

      if (this.options.showFilenames) {
        const filename = document.createElement('div')
        filename.classList.add('ci-carousel-filename')
        filename.textContent = getFilenameWithoutExtension(image.src)
        wrapper.appendChild(filename)
      }

      this.imagesContainer.appendChild(wrapper)
    })

    if (this.options.showThumbnails) this.renderThumbnails()
    if (this.options.showBullets) this.renderBullets()
    this.setupLazyLoading()
  }

  setupLazyLoading() {
    if (this.observer) {
      this.observer.disconnect()
    }

    if (!('IntersectionObserver' in window)) {
      this.loadVisibleImages()
      return
    }

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          if (src) {
            img.src = src
            delete img.dataset.src
            observer.unobserve(img)
          }
        }
      })
    })

    this.cleanups.push(() => this.observer?.disconnect())

    const images = this.imagesContainer.querySelectorAll(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    images.forEach((img) => this.observer.observe(img))
  }

  loadVisibleImages() {
    const images = this.imagesContainer.querySelectorAll(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    images.forEach((img) => {
      const src = img.dataset.src
      if (src) {
        img.src = src
        delete img.dataset.src
      }
    })
  }

  renderThumbnails() {
    this.thumbnailsContainer.innerHTML = ''
    const fragment = document.createDocumentFragment()

    this.images.forEach((img, index) => {
      const thumb = document.createElement('button')
      thumb.classList.add('ci-carousel-thumbnail')
      thumb.dataset.index = index
      thumb.setAttribute('aria-label', `Go to slide ${index + 1}: ${img.alt}`)
      thumb.setAttribute('aria-pressed', index === this.currentIndex ? 'true' : 'false')

      if (index === this.currentIndex) {
        thumb.classList.add(ACTIVE_CLASS)
      }

      const thumbImg = new Image()
      thumbImg.src = img.src
      thumbImg.alt = ''
      thumbImg.setAttribute('aria-hidden', 'true')
      thumb.appendChild(thumbImg)
      fragment.appendChild(thumb)
    })

    this.thumbnailsContainer.appendChild(fragment)

    if (!this.thumbnailClickHandler) {
      this.thumbnailClickHandler = (e) => {
        const thumb = e.target.closest('.ci-carousel-thumbnail')
        if (thumb) {
          this.goToSlide(parseInt(thumb.dataset.index, 10))
        }
      }
      this.thumbnailsContainer.addEventListener(CLICK_EVENT, this.thumbnailClickHandler)
      this.cleanups.push(() =>
        this.thumbnailsContainer?.removeEventListener(CLICK_EVENT, this.thumbnailClickHandler),
      )
    }
  }

  renderBullets() {
    if (!this.options.showBullets || !this.bulletsContainer) return

    this.bulletsContainer.innerHTML = ''
    const fragment = document.createDocumentFragment()

    this.images.forEach((_, index) => {
      const bullet = document.createElement('button')
      bullet.classList.add(CI_CAROUSEL_BULLET_CLASS)
      bullet.dataset.index = index
      bullet.setAttribute('aria-label', `Go to slide ${index + 1}`)
      bullet.setAttribute('aria-pressed', index === this.currentIndex ? 'true' : 'false')

      if (index === this.currentIndex) {
        bullet.classList.add(ACTIVE_CLASS)
      }
      fragment.appendChild(bullet)
    })

    this.bulletsContainer.appendChild(fragment)

    if (!this.bulletClickHandler) {
      this.bulletClickHandler = (e) => {
        const bullet = e.target.closest(`.${CI_CAROUSEL_BULLET_CLASS}`)
        if (bullet) {
          this.goToSlide(parseInt(bullet.dataset.index, 10))
        }
      }
      this.bulletsContainer.addEventListener(CLICK_EVENT, this.bulletClickHandler)
      this.cleanups.push(() => this.bulletsContainer?.removeEventListener(CLICK_EVENT, this.bulletClickHandler))
    }
  }

  goToSlide(index) {
    if (this.images.length <= 1) return

    if (index < 0) {
      index = this.options.cycle ? this.images.length - 1 : 0
    } else if (index >= this.images.length) {
      index = this.options.cycle ? 0 : this.images.length - 1
    }

    if (index === this.currentIndex) return

    const prevIndex = this.currentIndex
    this.currentIndex = index

    if (this.options.autoplay) {
      this.resetAutoplay()
    }

    this.updateSlide(prevIndex)
  }

  updateSlide(prevIndex) {
    const slides = this.imagesContainer.children
    const prevSlide = slides[prevIndex]
    const currentSlide = slides[this.currentIndex]

    if (!prevSlide || !currentSlide) return

    prevSlide.classList.remove(ACTIVE_CLASS)
    currentSlide.classList.add(ACTIVE_CLASS)

    // Update thumbnails
    if (this.options.showThumbnails && this.thumbnailsContainer) {
      const thumbs = this.thumbnailsContainer.children
      if (thumbs[prevIndex] && thumbs[this.currentIndex]) {
        thumbs[prevIndex].classList.remove(ACTIVE_CLASS)
        thumbs[prevIndex].setAttribute('aria-pressed', 'false')
        thumbs[this.currentIndex].classList.add(ACTIVE_CLASS)
        thumbs[this.currentIndex].setAttribute('aria-pressed', 'true')
      }
    }

    // Update bullets
    if (this.options.showBullets && this.bulletsContainer) {
      const bullets = this.bulletsContainer.children
      if (bullets[prevIndex] && bullets[this.currentIndex]) {
        bullets[prevIndex].classList.remove(ACTIVE_CLASS)
        bullets[prevIndex].setAttribute('aria-pressed', 'false')
        bullets[this.currentIndex].classList.add(ACTIVE_CLASS)
        bullets[this.currentIndex].setAttribute('aria-pressed', 'true')
      }
    }

    // Announce slide change to screen readers (WCAG 4.1.3)
    if (this.liveRegion) {
      const image = this.images[this.currentIndex]
      this.liveRegion.textContent = `Slide ${this.currentIndex + 1} of ${this.images.length}: ${image.alt}`
    }

    // Reset zoom for new slide
    if (this.zoomPanControls) {
      this.zoomPanControls.resetZoom()
      this.zoomPanControls.initializeVisibleImage()
    }
  }

  next() {
    this.goToSlide(this.currentIndex + 1)
  }

  prev() {
    this.goToSlide(this.currentIndex - 1)
  }

  zoomIn() {
    this.zoomPanControls?.zoomIn()
  }

  zoomOut() {
    this.zoomPanControls?.zoomOut()
  }

  resetZoom() {
    this.zoomPanControls?.resetZoom()
  }

  applyTheme() {
    if (!this.container) return
    if (this.options.theme === 'dark') {
      this.container.classList.add('ci-carousel-theme-dark')
    } else {
      this.container.classList.remove('ci-carousel-theme-dark')
    }
  }

  /**
   * Switches theme at runtime.
   * @param {'light'|'dark'} theme
   */
  setTheme(theme) {
    this.options.theme = theme
    this.applyTheme()
  }

  setupFullscreenHandler() {
    if (!screenfull.isEnabled) return

    this.fullscreenHandler = () => {
      this.isFullscreen = screenfull.isFullscreen
      const btn = this.container?.querySelector(`.${CI_CAROUSEL_FULLSCREEN_CLASS}`)
      if (btn) {
        btn.innerHTML = this.isFullscreen ? ICONS.EXIT_FULLSCREEN : ICONS.FULLSCREEN
        btn.setAttribute('aria-label', this.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen')
      }
      this.container?.classList.toggle('is-fullscreen', this.isFullscreen)
    }
    screenfull.on('change', this.fullscreenHandler)
    this.cleanups.push(() => screenfull.off('change', this.fullscreenHandler))
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle(this.container)
    }
  }

  startAutoplay() {
    this.isAutoplayPaused = false
    this.autoplayInterval = setInterval(() => this.next(), this.options.autoplayInterval)
    this.cleanups.push(() => this.stopAutoplay())
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval)
      this.autoplayInterval = null
    }
  }

  pauseAutoplay() {
    this.isAutoplayPaused = true
    this.stopAutoplay()
  }

  resumeAutoplay() {
    if (this.isAutoplayPaused) {
      this.startAutoplay()
    }
  }

  resetAutoplay() {
    this.stopAutoplay()
    this.startAutoplay()
  }

  /**
   * Tears down all features via cleanup stack, then nulls references.
   * Mirrors hotspot's this.cleanups.forEach(fn => fn()) pattern.
   */
  destroy() {
    if (this.isDestroyed) return
    this.isDestroyed = true

    // Execute all cleanup functions
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []

    // Null DOM references
    this.images = []
    this.container = null
    this.mainView = null
    this.imagesContainer = null
    this.thumbnailsContainer = null
    this.controlsContainer = null
    this.bulletsContainer = null
    this.liveRegion = null
  }

  /**
   * Auto-discovers elements with data-ci-carousel-images attribute,
   * parses data attributes, creates and initializes instances.
   * Mirrors hotspot's CIHotspot.autoInit() pattern.
   * @param {HTMLElement} [root=document] - Scope to search within
   * @returns {CloudImageCarousel[]} Array of created instances
   */
  static autoInit(root) {
    const container = root || document
    const elements = container.querySelectorAll('[data-ci-carousel-images]')
    const instances = []

    elements.forEach((el) => {
      const instance = new CloudImageCarousel(el)
      instance.init()
      instances.push(instance)
    })

    return instances
  }
}

export { CloudImageCarousel }
