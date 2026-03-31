import {
  CI_CAROUSEL_AUTOPLAY_CLASS,
  CI_CAROUSEL_CONTROLS_VISIBLE_CLASS,
  CI_CAROUSEL_FULLSCREEN_CLASS,
  CI_CAROUSEL_NEXT_CLASS,
  CI_CAROUSEL_PREV_CLASS,
  CI_CAROUSEL_UTILITY_GROUP_CLASS,
  CONTROLS_HIDE_DELAY,
  ICONS,
  KEYBOARD_KEYS,
  KEYDOWN_EVENT,
} from '../constants'
import type { ResolvedConfig } from '../core/config'
import { createButton } from '../utils/dom.utils'

/** Minimal interface for what CarouselControls needs from the carousel */
interface CarouselRef {
  options: ResolvedConfig
  container: HTMLElement | null
  controlsContainer: HTMLDivElement | null
  mainView: HTMLDivElement | null
  bulletsContainer: HTMLDivElement | null
  thumbnailsContainer: HTMLDivElement | null
  currentIndex: number
  isAutoplayPaused: boolean
  prev(): void
  next(): void
  zoomIn(): void
  zoomOut(): void
  resetZoom(): void
  toggleFullscreen(): void
  pauseAutoplay(): void
  resumeAutoplay(): void
}

export class CarouselControls {
  private carousel: CarouselRef
  private container: HTMLDivElement | null
  private options: ResolvedConfig
  private autoplayButton: HTMLButtonElement | null = null
  private hideControlsTimeout: ReturnType<typeof setTimeout> | null = null
  private cleanups: (() => void)[] = []

  constructor(carousel: CarouselRef) {
    this.carousel = carousel
    this.container = carousel.controlsContainer
    this.options = carousel.options
    this.initializeControls()
  }

  private initializeControls(): void {
    if (!this.options.showControls || !this.container) return

    // Navigation buttons
    const prevButton = createButton(CI_CAROUSEL_PREV_CLASS, ICONS.PREV, 'Previous slide', () => {
      this.carousel.prev()
      this.showControls()
      this.scheduleHideControls()
    })

    const nextButton = createButton(CI_CAROUSEL_NEXT_CLASS, ICONS.NEXT, 'Next slide', () => {
      this.carousel.next()
      this.showControls()
      this.scheduleHideControls()
    })

    // Fullscreen control
    const fullscreenButton = createButton(
      CI_CAROUSEL_FULLSCREEN_CLASS,
      ICONS.FULLSCREEN,
      'Enter fullscreen',
      () => {
        this.carousel.toggleFullscreen()
        this.showControls()
        this.scheduleHideControls()
      },
    )

    // Add nav buttons to container
    this.container.appendChild(prevButton)
    this.container.appendChild(nextButton)

    // Utility group (top-right) — autoplay + fullscreen grouped together
    const utilityGroup = document.createElement('div')
    utilityGroup.classList.add(CI_CAROUSEL_UTILITY_GROUP_CLASS)

    // Autoplay pause/play button (WCAG 2.2.2 Pause, Stop, Hide)
    if (this.options.autoplay) {
      this.autoplayButton = createButton(CI_CAROUSEL_AUTOPLAY_CLASS, ICONS.PAUSE, 'Pause autoplay', () => {
        this.toggleAutoplay()
        this.showControls()
        this.scheduleHideControls()
      })
      utilityGroup.appendChild(this.autoplayButton)
    }

    utilityGroup.appendChild(fullscreenButton)
    this.container.appendChild(utilityGroup)

    // Keyboard controls
    const handleKeyDown = this._handleKeyDown.bind(this)
    document.addEventListener(KEYDOWN_EVENT, handleKeyDown)
    this.cleanups.push(() => document.removeEventListener(KEYDOWN_EVENT, handleKeyDown))

    // Touch controls — show/hide on interaction
    const handleTouchStart = () => this.showControls()
    const handleTouchEnd = () => {
      if (this.hideControlsTimeout) clearTimeout(this.hideControlsTimeout)
      this.hideControlsTimeout = setTimeout(() => {
        this.container?.classList.remove(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
      }, CONTROLS_HIDE_DELAY)
    }

    this.carousel.mainView?.addEventListener('touchstart', handleTouchStart, { passive: true })
    this.carousel.mainView?.addEventListener('touchend', handleTouchEnd, { passive: true })
    this.cleanups.push(() => {
      this.carousel.mainView?.removeEventListener('touchstart', handleTouchStart)
      this.carousel.mainView?.removeEventListener('touchend', handleTouchEnd)
    })
  }

  private toggleAutoplay(): void {
    if (!this.autoplayButton) return

    if (this.carousel.isAutoplayPaused) {
      this.carousel.resumeAutoplay()
      this.autoplayButton.innerHTML = ICONS.PAUSE
      this.autoplayButton.setAttribute('aria-label', 'Pause autoplay')
    } else {
      this.carousel.pauseAutoplay()
      this.autoplayButton.innerHTML = ICONS.PLAY
      this.autoplayButton.setAttribute('aria-label', 'Resume autoplay')
    }
  }

  private showControls(): void {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.container?.classList.add(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
  }

  private scheduleHideControls(): void {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.hideControlsTimeout = setTimeout(() => {
      this.container?.classList.remove(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
    }, CONTROLS_HIDE_DELAY)
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (!this.carousel.container?.contains(document.activeElement)) return

    // Let roving tabindex handlers manage arrow keys inside bullets/thumbnails
    const active = document.activeElement as HTMLElement | null
    const inBullets = this.carousel.bulletsContainer?.contains(active)
    const inThumbnails = this.carousel.thumbnailsContainer?.contains(active)

    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (inBullets || inThumbnails) return
        e.preventDefault()
        this.carousel.prev()
        break
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (inBullets || inThumbnails) return
        e.preventDefault()
        this.carousel.next()
        break
      case KEYBOARD_KEYS.ESCAPE:
        this.carousel.resetZoom()
        break
      case KEYBOARD_KEYS.PLUS:
      case KEYBOARD_KEYS.EQUAL:
        e.preventDefault()
        this.carousel.zoomIn()
        break
      case KEYBOARD_KEYS.MINUS:
        e.preventDefault()
        this.carousel.zoomOut()
        break
      case KEYBOARD_KEYS.ZERO:
        e.preventDefault()
        this.carousel.resetZoom()
        break
      case KEYBOARD_KEYS.F:
        e.preventDefault()
        this.carousel.toggleFullscreen()
        break
    }
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []

    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
  }
}
