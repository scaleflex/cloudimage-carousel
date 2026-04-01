import {
  announceToScreenReader,
  applyContainerAria,
  createFocusTrap,
  createKeyboardHints,
  createLiveRegion,
  removeContainerAria,
} from '../a11y'
import {
  ACTIVE_CLASS,
  CI_CAROUSEL_BOTTOM_CONTAINER_CLASS,
  CI_CAROUSEL_BULLETS_CONTAINER_CLASS,
  CI_CAROUSEL_BULLET_CLASS,
  CI_CAROUSEL_CONTROLS_CLASS,
  CI_CAROUSEL_FILENAME_CLASS,
  CI_CAROUSEL_FULLSCREEN_CLASS,
  CI_CAROUSEL_HAS_BULLETS_CLASS,
  CI_CAROUSEL_HAS_CONTROLS_CLASS,
  CI_CAROUSEL_HAS_THUMBNAILS_CLASS,
  CI_CAROUSEL_IMAGE_CLASS,
  CI_CAROUSEL_IMAGE_ERROR_CLASS,
  CI_CAROUSEL_IMAGE_WRAPPER_CLASS,
  CI_CAROUSEL_IMAGES_CONTAINER_CLASS,
  CI_CAROUSEL_IS_FULLSCREEN_CLASS,
  CI_CAROUSEL_MAIN_CLASS,
  CI_CAROUSEL_THEME_DARK_CLASS,
  CI_CAROUSEL_THUMBNAIL_CLASS,
  CI_CAROUSEL_THUMBNAILS_CLASS,
  CI_HOST_CONTAINER_CLASS,
  EXITING_CLASS,
} from '../constants/classes.constants'
import { CLICK_EVENT } from '../constants/events.constants'
import { KEYBOARD_KEYS, PLACEHOLDER_SVG } from '../constants/controls.constants'
import { ICONS } from '../constants/icons.constants'
import { CarouselControls } from '../controls/controls'
import { SwipeControls } from '../controls/swipe.controls'
import { ZoomPanControls } from '../controls/zoom-pan.controls'
import type { FullscreenControl } from '../fullscreen/fullscreen'
import { createFullscreenControl } from '../fullscreen/fullscreen'
import { createContainerResizeHandler, transformImageSrc } from '../utils/cloudimage'
import { getFilenameWithoutExtension, normalizeImage } from '../utils/image.utils'

import type { ResolvedConfig } from './config'
import { mergeConfig, parseDataAttributes, validateConfig } from './config'
import type {
  CloudImageCarouselConfig,
  CloudImageCarouselInstance,
  ImageSource,
  NormalizedImage,
  Theme,
} from './types'


class CloudImageCarousel implements CloudImageCarouselInstance {
  // --- Public state (readonly via interface) ---
  currentIndex: number = 0
  isFullscreen: boolean = false
  isAutoplayPaused: boolean = false

  // --- Internal state (public for sub-module access via CarouselRef interfaces) ---
  container: HTMLElement | null
  options: ResolvedConfig
  private images: NormalizedImage[] = []
  private isDestroyed: boolean = false
  private cleanups: (() => void)[] = []

  // --- DOM references ---
  mainView: HTMLDivElement | null = null
  imagesContainer: HTMLDivElement | null = null
  controlsContainer: HTMLDivElement | null = null
  thumbnailsContainer: HTMLDivElement | null = null
  bulletsContainer: HTMLDivElement | null = null
  bottomContainer: HTMLDivElement | null = null
  private liveRegion: HTMLDivElement | null = null
  private keyboardHints: HTMLDivElement | null = null

  // --- Sub-modules ---
  controls: CarouselControls | null = null
  zoomPanControls: ZoomPanControls | null = null
  private swipeControls: SwipeControls | null = null

  // --- Cached values ---
  private transitionDurationMs: number = 700

  // --- Cloudimage CDN ---
  private cloudimageEnabled: boolean = false

  // --- Fullscreen ---
  private fullscreenControl: FullscreenControl | null = null

  // --- Event handlers ---
  private thumbnailClickHandler: ((e: Event) => void) | null = null
  private bulletClickHandler: ((e: Event) => void) | null = null
  private autoplayInterval: ReturnType<typeof setInterval> | null = null
  private observer: IntersectionObserver | null = null
  private observerCleanupRegistered: boolean = false
  private transitionFallbackId: ReturnType<typeof setTimeout> | null = null

  constructor(container: string | HTMLElement, options: Partial<CloudImageCarouselConfig> = {}) {
    if (!container) {
      throw new Error('Container parameter is required')
    }

    this.container = typeof container === 'string' ? document.querySelector<HTMLElement>(container) : container

    if (!this.container || !(this.container instanceof HTMLElement)) {
      throw new Error(
        `Invalid container: ${typeof container === 'string' ? `Element "${container}" not found` : 'Container must be a valid HTML element'
        }`,
      )
    }

    // Config: defaults → data attributes → JS options (immutable merge)
    const dataConfig = parseDataAttributes(this.container)
    this.options = mergeConfig(dataConfig, options)
    this.options = validateConfig(this.options)
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  init(): void {
    this.cloudimageEnabled = !!(this.options.cloudimage?.token)

    this.createStructure()
    this.cacheTransitionDuration()
    this.loadImages(this.options.images)

    if (this.options.showControls) {
      this.controls = new CarouselControls(this)
      this.cleanups.push(() => this.controls?.destroy())

      this.zoomPanControls = new ZoomPanControls(this, {
        minZoom: this.options.zoomMin,
        maxZoom: this.options.zoomMax,
        zoomStep: this.options.zoomStep,
      })
      this.cleanups.push(() => this.zoomPanControls?.destroy())
    }

    this.swipeControls = new SwipeControls(this)
    this.cleanups.push(() => this.swipeControls?.destroy())

    this.setupFullscreenHandler()
    this.setupCloudimageResize()

    this.cleanups.push(() => this.stopAutoplay())

    if (this.options.autoplay) {
      this.startAutoplay()
    }
  }

  private createStructure(): void {
    const container = this.container!

    container.classList.add(CI_HOST_CONTAINER_CLASS)
    this.applyTheme()

    // Main view
    this.mainView = document.createElement('div')
    this.mainView.classList.add(CI_CAROUSEL_MAIN_CLASS)
    const normalizedRatio = this.options.aspectRatio.replace(/\s/g, '')
    if (normalizedRatio !== '16/9') {
      this.mainView.style.setProperty('--ci-carousel-aspect-ratio', this.options.aspectRatio)
    }

    // Images container
    this.imagesContainer = document.createElement('div')
    this.imagesContainer.classList.add(CI_CAROUSEL_IMAGES_CONTAINER_CLASS)
    this.imagesContainer.dataset.direction = 'next'
    this.imagesContainer.setAttribute('role', 'list')
    this.imagesContainer.setAttribute('aria-label', 'Slides')

    this.mainView.appendChild(this.imagesContainer)

    // Controls overlay
    if (this.options.showControls) {
      this.controlsContainer = document.createElement('div')
      this.controlsContainer.classList.add(CI_CAROUSEL_CONTROLS_CLASS)
      this.controlsContainer.classList.add(`ci-carousel-controls--${this.options.controlsPosition}`)
      container.classList.add(CI_CAROUSEL_HAS_CONTROLS_CLASS)
      this.mainView.appendChild(this.controlsContainer)
    }

    container.appendChild(this.mainView)

    // Bottom container
    this.bottomContainer = document.createElement('div')
    this.bottomContainer.classList.add(CI_CAROUSEL_BOTTOM_CONTAINER_CLASS)

    if (this.options.showThumbnails) {
      container.classList.add(CI_CAROUSEL_HAS_THUMBNAILS_CLASS)
      this.thumbnailsContainer = document.createElement('div')
      this.thumbnailsContainer.classList.add(CI_CAROUSEL_THUMBNAILS_CLASS)
      this.thumbnailsContainer.setAttribute('role', 'group')
      this.thumbnailsContainer.setAttribute('aria-label', 'Slide thumbnails')
      this.bottomContainer.appendChild(this.thumbnailsContainer)
    }

    if (this.options.showBullets) {
      this.bulletsContainer = document.createElement('div')
      this.bulletsContainer.classList.add(CI_CAROUSEL_BULLETS_CONTAINER_CLASS)
      this.bulletsContainer.setAttribute('role', 'group')
      this.bulletsContainer.setAttribute('aria-label', 'Slide indicators')
      container.classList.add(CI_CAROUSEL_HAS_BULLETS_CLASS)
      this.bottomContainer.appendChild(this.bulletsContainer)
    }

    container.appendChild(this.bottomContainer)

    // Live region (WCAG 2.1 — 4.1.3 Status Messages)
    this.liveRegion = createLiveRegion()
    container.appendChild(this.liveRegion)

    // Keyboard hints
    this.keyboardHints = createKeyboardHints()
    container.appendChild(this.keyboardHints)

    // ARIA attributes on container
    applyContainerAria(container, this.keyboardHints.id)
  }

  /** Read the CSS transition duration synchronously so it's available immediately. */
  private cacheTransitionDuration(): void {
    if (!this.container) return
    const raw = getComputedStyle(this.container).getPropertyValue('--ci-carousel-transition-slow') || '0.7'
    this.transitionDurationMs = parseFloat(raw) * 1000
  }

  // ==========================================================================
  // Images
  // ==========================================================================

  loadImages(sources: ImageSource[]): void {
    if (!Array.isArray(sources) || sources.length === 0) return

    this.images = sources.map((entry, index) => normalizeImage(entry, index))
    this.currentIndex = 0
    this.renderImages()
  }

  private renderImages(): void {
    if (!this.imagesContainer) return

    this.imagesContainer.innerHTML = ''
    const fragment = document.createDocumentFragment()

    this.images.forEach((image, index) => {
      const wrapper = document.createElement('div')
      wrapper.classList.add(CI_CAROUSEL_IMAGE_WRAPPER_CLASS)
      wrapper.classList.add(this.options.transitionEffect)

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
      img.src = PLACEHOLDER_SVG
      img.loading = 'lazy'

      img.onerror = () => {
        wrapper.classList.add(CI_CAROUSEL_IMAGE_ERROR_CLASS)
        img.alt = `Failed to load: ${image.alt}`
        try {
          this.options.onError?.(image.src, index)
        } catch (err) {
          console.error('[CloudImageCarousel] onError callback threw:', err)
        }
      }

      wrapper.appendChild(img)

      if (this.options.showFilenames) {
        const filename = document.createElement('div')
        filename.classList.add(CI_CAROUSEL_FILENAME_CLASS)
        filename.textContent = getFilenameWithoutExtension(image.src)
        wrapper.appendChild(filename)
      }

      fragment.appendChild(wrapper)
    })

    this.imagesContainer.appendChild(fragment)

    if (this.options.showThumbnails) this.renderThumbnails()
    if (this.options.showBullets) this.renderBullets()
    this.setupLazyLoading()

    // Announce initial slide to screen readers
    if (this.images.length > 0) {
      announceToScreenReader(
        this.liveRegion,
        `Carousel loaded with ${this.images.length} slides. ${this.images[0].alt}`,
      )
    }
  }

  // ==========================================================================
  // Lazy loading
  // ==========================================================================

  private setupLazyLoading(): void {
    if (this.observer) {
      this.observer.disconnect()
    }

    if (!('IntersectionObserver' in window)) {
      this.loadVisibleImages()
      return
    }

    this.observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          if (src) {
            img.src = this.resolveImageSrc(src)
            delete img.dataset.src
            obs.unobserve(img)
          }
        }
      })
    })

    if (!this.observerCleanupRegistered) {
      this.observerCleanupRegistered = true
      this.cleanups.push(() => this.observer?.disconnect())
    }

    if (!this.imagesContainer) return
    const images = this.imagesContainer.querySelectorAll<HTMLImageElement>(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    images.forEach((img) => this.observer!.observe(img))
  }

  private loadVisibleImages(): void {
    if (!this.imagesContainer) return
    const images = this.imagesContainer.querySelectorAll<HTMLImageElement>(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    images.forEach((img) => {
      const src = img.dataset.src
      if (src) {
        img.src = this.resolveImageSrc(src)
        delete img.dataset.src
      }
    })
  }

  // ==========================================================================
  // Cloudimage CDN
  // ==========================================================================

  /**
   * Resolves an image src — applies Cloudimage CDN transform if enabled,
   * otherwise returns the raw URL.
   */
  private resolveImageSrc(src: string, zoomLevel: number = 1, containerWidth?: number): string {
    if (!this.cloudimageEnabled || !this.options.cloudimage) return src

    const width = containerWidth ?? this.mainView?.clientWidth ?? 0
    if (width === 0) return src

    return transformImageSrc(src, this.options.cloudimage, width, zoomLevel)
  }

  /**
   * Resolves a thumbnail src — uses smaller width and zoom=1.
   */
  private resolveThumbnailSrc(src: string): string {
    if (!this.cloudimageEnabled || !this.options.cloudimage || !this.thumbnailsContainer) return src

    const width = this.thumbnailsContainer.clientWidth / Math.max(this.images.length, 1)
    if (width === 0) return src

    return transformImageSrc(src, this.options.cloudimage, width, 1)
  }

  /**
   * Sets up a ResizeObserver + zoom listener to re-transform all loaded
   * image src attributes when the container size or zoom level changes.
   */
  private setupCloudimageResize(): void {
    if (!this.cloudimageEnabled || !this.options.cloudimage || !this.mainView) return

    const getZoom = () => this.zoomPanControls?.getScale() ?? 1

    const { destroy } = createContainerResizeHandler(
      this.mainView,
      this.options.cloudimage,
      getZoom,
      () => this.refreshCloudimageUrls(),
    )
    this.cleanups.push(destroy)

    // Listen to zoom changes to request higher-res images
    if (this.zoomPanControls) {
      const onZoom = () => this.refreshCloudimageUrls()
      this.zoomPanControls.on('zoom', onZoom)
      this.cleanups.push(() => this.zoomPanControls?.off('zoom', onZoom))
    }
  }

  /**
   * Re-transforms all loaded image src attributes using current container
   * width and zoom level. Only affects images that have already been loaded
   * (i.e., data-src has already been consumed).
   */
  private refreshCloudimageUrls(): void {
    if (!this.cloudimageEnabled || !this.options.cloudimage || !this.imagesContainer) return

    const zoomLevel = this.zoomPanControls?.getScale() ?? 1
    const containerWidth = this.mainView?.clientWidth ?? 0
    if (containerWidth === 0) return

    // Refresh main images (only those already loaded — no data-src)
    const mainImages = this.imagesContainer.querySelectorAll<HTMLImageElement>(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    mainImages.forEach((img, index) => {
      if (img.dataset.src) return // not yet loaded by lazy loading
      const originalSrc = this.images[index]?.src
      if (originalSrc) {
        img.src = this.resolveImageSrc(originalSrc, zoomLevel, containerWidth)
      }
    })

    // Refresh thumbnails
    if (this.thumbnailsContainer) {
      const thumbImages = this.thumbnailsContainer.querySelectorAll<HTMLImageElement>('img')
      thumbImages.forEach((img, index) => {
        const originalSrc = this.images[index]?.src
        if (originalSrc) {
          img.src = this.resolveThumbnailSrc(originalSrc)
        }
      })
    }
  }

  // ==========================================================================
  // Thumbnails
  // ==========================================================================

  private renderThumbnails(): void {
    if (!this.thumbnailsContainer) return

    this.thumbnailsContainer.innerHTML = ''
    const fragment = document.createDocumentFragment()

    this.images.forEach((img, index) => {
      const thumb = document.createElement('button')
      thumb.classList.add(CI_CAROUSEL_THUMBNAIL_CLASS)
      thumb.dataset.index = String(index)
      thumb.setAttribute('aria-label', `Go to slide ${index + 1}: ${img.alt}`)
      thumb.setAttribute('aria-pressed', index === this.currentIndex ? 'true' : 'false')
      thumb.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1')

      if (index === this.currentIndex) {
        thumb.classList.add(ACTIVE_CLASS)
      }

      const thumbImg = new Image()
      thumbImg.src = this.resolveThumbnailSrc(img.src)
      thumbImg.alt = ''
      thumbImg.setAttribute('aria-hidden', 'true')
      thumb.appendChild(thumbImg)
      fragment.appendChild(thumb)
    })

    this.thumbnailsContainer.appendChild(fragment)

    if (!this.thumbnailClickHandler) {
      this.thumbnailClickHandler = (e: Event) => {
        const thumb = (e.target as HTMLElement).closest(`.${CI_CAROUSEL_THUMBNAIL_CLASS}`) as HTMLElement | null
        if (thumb?.dataset.index) {
          this.goToSlide(parseInt(thumb.dataset.index, 10))
        }
      }
      this.thumbnailsContainer.addEventListener(CLICK_EVENT, this.thumbnailClickHandler)
      this.cleanups.push(() =>
        this.thumbnailsContainer?.removeEventListener(CLICK_EVENT, this.thumbnailClickHandler!),
      )

      const handleThumbsKeyDown = (e: KeyboardEvent) => {
        if (this.thumbnailsContainer) {
          this.handleGroupArrowKeys(e, this.thumbnailsContainer)
        }
      }
      this.thumbnailsContainer.addEventListener('keydown', handleThumbsKeyDown)
      this.cleanups.push(() => this.thumbnailsContainer?.removeEventListener('keydown', handleThumbsKeyDown))
    }
  }

  // ==========================================================================
  // Bullets
  // ==========================================================================

  private renderBullets(): void {
    if (!this.options.showBullets || !this.bulletsContainer) return

    this.bulletsContainer.innerHTML = ''
    const fragment = document.createDocumentFragment()

    this.images.forEach((_, index) => {
      const bullet = document.createElement('button')
      bullet.classList.add(CI_CAROUSEL_BULLET_CLASS)
      bullet.dataset.index = String(index)
      bullet.setAttribute('aria-label', `Go to slide ${index + 1}`)
      bullet.setAttribute('aria-pressed', index === this.currentIndex ? 'true' : 'false')
      bullet.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1')

      if (index === this.currentIndex) {
        bullet.classList.add(ACTIVE_CLASS)
      }
      fragment.appendChild(bullet)
    })

    this.bulletsContainer.appendChild(fragment)

    if (!this.bulletClickHandler) {
      this.bulletClickHandler = (e: Event) => {
        const bullet = (e.target as HTMLElement).closest(`.${CI_CAROUSEL_BULLET_CLASS}`) as HTMLElement | null
        if (bullet?.dataset.index) {
          this.goToSlide(parseInt(bullet.dataset.index, 10))
        }
      }
      this.bulletsContainer.addEventListener(CLICK_EVENT, this.bulletClickHandler)
      this.cleanups.push(() =>
        this.bulletsContainer?.removeEventListener(CLICK_EVENT, this.bulletClickHandler!),
      )

      const handleBulletsKeyDown = (e: KeyboardEvent) => {
        if (this.bulletsContainer) {
          this.handleGroupArrowKeys(e, this.bulletsContainer)
        }
      }
      this.bulletsContainer.addEventListener('keydown', handleBulletsKeyDown)
      this.cleanups.push(() => this.bulletsContainer?.removeEventListener('keydown', handleBulletsKeyDown))
    }
  }

  // ==========================================================================
  // Roving tabindex for bullet/thumbnail groups
  // ==========================================================================

  private handleGroupArrowKeys(e: KeyboardEvent, container: HTMLElement): void {
    if (e.key !== KEYBOARD_KEYS.ARROW_LEFT && e.key !== KEYBOARD_KEYS.ARROW_RIGHT) return
    e.preventDefault()

    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
    const currentIdx = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (currentIdx === -1) return

    const nextIdx =
      e.key === KEYBOARD_KEYS.ARROW_RIGHT
        ? (currentIdx + 1) % buttons.length
        : (currentIdx - 1 + buttons.length) % buttons.length

    buttons[currentIdx].setAttribute('tabindex', '-1')
    buttons[nextIdx].setAttribute('tabindex', '0')
    buttons[nextIdx].focus()
    this.goToSlide(nextIdx)
  }

  // ==========================================================================
  // Navigation
  // ==========================================================================

  goToSlide(index: number): void {
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

    const direction: 'next' | 'prev' = index > prevIndex ? 'next' : 'prev'
    this.updateSlide(prevIndex, direction)
  }

  private updateSlide(prevIndex: number, direction: 'next' | 'prev' = 'next'): void {
    if (!this.imagesContainer) return

    const slides = this.imagesContainer.children
    const prevSlide = slides[prevIndex] as HTMLElement | undefined
    const currentSlide = slides[this.currentIndex] as HTMLElement | undefined

    if (!prevSlide || !currentSlide) return

    // 1. Set direction for CSS
    this.imagesContainer.dataset.direction = direction

    // 2. Exit old slide
    prevSlide.classList.remove(ACTIVE_CLASS)
    prevSlide.classList.add(EXITING_CLASS)

    // 3. Force reflow so entering slide registers start position
    void currentSlide.offsetHeight

    // 4. Enter new slide
    currentSlide.classList.add(ACTIVE_CLASS)

    // 5. Clean up exiting after transition (clear previous fallback first)
    if (this.transitionFallbackId) {
      clearTimeout(this.transitionFallbackId)
    }
    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      prevSlide.classList.remove(EXITING_CLASS)
      if (this.transitionFallbackId) {
        clearTimeout(this.transitionFallbackId)
        this.transitionFallbackId = null
      }
    }
    prevSlide.addEventListener('transitionend', cleanup, { once: true })
    this.transitionFallbackId = setTimeout(cleanup, this.transitionDurationMs + 100)

    // Update thumbnails
    if (this.options.showThumbnails && this.thumbnailsContainer) {
      const thumbs = this.thumbnailsContainer.children
      const prevThumb = thumbs[prevIndex] as HTMLElement | undefined
      const currThumb = thumbs[this.currentIndex] as HTMLElement | undefined
      if (prevThumb && currThumb) {
        prevThumb.classList.remove(ACTIVE_CLASS)
        prevThumb.setAttribute('aria-pressed', 'false')
        prevThumb.setAttribute('tabindex', '-1')
        currThumb.classList.add(ACTIVE_CLASS)
        currThumb.setAttribute('aria-pressed', 'true')
        currThumb.setAttribute('tabindex', '0')
      }
    }

    // Update bullets
    if (this.options.showBullets && this.bulletsContainer) {
      const bullets = this.bulletsContainer.children
      const prevBullet = bullets[prevIndex] as HTMLElement | undefined
      const currBullet = bullets[this.currentIndex] as HTMLElement | undefined
      if (prevBullet && currBullet) {
        prevBullet.classList.remove(ACTIVE_CLASS)
        prevBullet.setAttribute('aria-pressed', 'false')
        prevBullet.setAttribute('tabindex', '-1')
        currBullet.classList.add(ACTIVE_CLASS)
        currBullet.setAttribute('aria-pressed', 'true')
        currBullet.setAttribute('tabindex', '0')
      }
    }

    // Screen reader announcement
    const image = this.images[this.currentIndex]
    if (image) {
      announceToScreenReader(
        this.liveRegion,
        `Slide ${this.currentIndex + 1} of ${this.images.length}: ${image.alt}`,
      )
    }

    // Reset zoom
    if (this.zoomPanControls) {
      this.zoomPanControls.resetZoom()
      this.zoomPanControls.initializeVisibleImage()
    }

    // Fire slide change callback
    try {
      this.options.onSlideChange?.(this.currentIndex)
    } catch (err) {
      console.error('[CloudImageCarousel] onSlideChange callback threw:', err)
    }
  }

  next(): void {
    this.goToSlide(this.currentIndex + 1)
  }

  prev(): void {
    this.goToSlide(this.currentIndex - 1)
  }

  // ==========================================================================
  // Zoom
  // ==========================================================================

  zoomIn(): void {
    this.zoomPanControls?.zoomIn()
  }

  zoomOut(): void {
    this.zoomPanControls?.zoomOut()
  }

  resetZoom(): void {
    this.zoomPanControls?.resetZoom()
  }

  // ==========================================================================
  // Theme
  // ==========================================================================

  applyTheme(): void {
    if (!this.container) return
    if (this.options.theme === 'dark') {
      this.container.classList.add(CI_CAROUSEL_THEME_DARK_CLASS)
    } else {
      this.container.classList.remove(CI_CAROUSEL_THEME_DARK_CLASS)
    }
  }

  setTheme(theme: Theme): void {
    this.options.theme = theme
    this.applyTheme()
  }

  // ==========================================================================
  // Fullscreen
  // ==========================================================================

  private setupFullscreenHandler(): void {
    if (!this.container) return

    const destroyFocusTrap = createFocusTrap(this.container, () => this.isFullscreen)
    this.cleanups.push(destroyFocusTrap)

    this.fullscreenControl = createFullscreenControl(this.container, {
      onChange: (fs) => {
        this.isFullscreen = fs
        const btn = this.container?.querySelector<HTMLElement>(`.${CI_CAROUSEL_FULLSCREEN_CLASS}`)
        if (btn) {
          btn.innerHTML = fs ? ICONS.EXIT_FULLSCREEN : ICONS.FULLSCREEN
          btn.setAttribute('aria-label', fs ? 'Exit fullscreen' : 'Enter fullscreen')
        }
      },
    })

    if (this.fullscreenControl) {
      this.cleanups.push(() => this.fullscreenControl?.destroy())
    }
  }

  toggleFullscreen(): void {
    this.fullscreenControl?.toggle()
  }

  // ==========================================================================
  // Autoplay
  // ==========================================================================

  startAutoplay(): void {
    if (this.autoplayInterval) return // guard against duplicate intervals
    this.isAutoplayPaused = false
    this.autoplayInterval = setInterval(() => this.next(), this.options.autoplayInterval)
  }

  stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval)
      this.autoplayInterval = null
    }
  }

  pauseAutoplay(): void {
    this.isAutoplayPaused = true
    this.stopAutoplay()
  }

  resumeAutoplay(): void {
    if (this.isAutoplayPaused) {
      this.startAutoplay()
    }
  }

  private resetAutoplay(): void {
    this.stopAutoplay()
    this.startAutoplay()
  }

  // ==========================================================================
  // Destroy
  // ==========================================================================

  destroy(): void {
    if (this.isDestroyed) return
    this.isDestroyed = true

    if (this.transitionFallbackId) {
      clearTimeout(this.transitionFallbackId)
      this.transitionFallbackId = null
    }

    this.cleanups.forEach((fn) => fn())
    this.cleanups = []

    // Restore container (critical for React StrictMode re-mount)
    if (this.container) {
      this.container.innerHTML = ''
      removeContainerAria(this.container)
      this.container.classList.remove(
        CI_HOST_CONTAINER_CLASS,
        CI_CAROUSEL_HAS_CONTROLS_CLASS,
        CI_CAROUSEL_HAS_THUMBNAILS_CLASS,
        CI_CAROUSEL_HAS_BULLETS_CLASS,
        CI_CAROUSEL_THEME_DARK_CLASS,
        CI_CAROUSEL_IS_FULLSCREEN_CLASS,
      )
    }

    this.images = []
    this.container = null
    this.mainView = null
    this.imagesContainer = null
    this.thumbnailsContainer = null
    this.controlsContainer = null
    this.bulletsContainer = null
    this.bottomContainer = null
    this.liveRegion = null
    this.keyboardHints = null
  }

  // ==========================================================================
  // Static: auto-discover from data attributes
  // ==========================================================================

  static autoInit(root?: HTMLElement | Document): CloudImageCarousel[] {
    const container = root || document
    const elements = container.querySelectorAll<HTMLElement>('[data-ci-carousel-images]')
    const instances: CloudImageCarousel[] = []

    elements.forEach((el) => {
      const instance = new CloudImageCarousel(el)
      instance.init()
      instances.push(instance)
    })

    return instances
  }
}

export { CloudImageCarousel }
