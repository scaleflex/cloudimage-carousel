import { ICONS, KEYBOARD_KEYS, KEYDOWN_EVENT } from '../constants'
import {
  CI_CAROUSEL_CONTROLS_VISIBLE_CLASS,
  CI_CAROUSEL_FULLSCREEN_CLASS,
  CI_CAROUSEL_NEXT_CLASS,
  CI_CAROUSEL_PREV_CLASS,
} from '../constants/classes.constants'
import { createButton } from '../utils/dom.utils'

const PAUSE_ICON = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="14" y="4" width="4" height="16" rx="1"/>
  <rect x="6" y="4" width="4" height="16" rx="1"/>
</svg>`

const PLAY_ICON = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="6 3 20 12 6 21 6 3"/>
</svg>`

export class CarouselControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel
    this.container = carousel.controlsContainer
    this.options = carousel.options
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.hideControlsTimeout = null
    this.initializeControls()
  }

  initializeControls() {
    if (!this.options.showControls) return

    // Navigation buttons
    this.prevButton = createButton(CI_CAROUSEL_PREV_CLASS, ICONS.PREV, 'Previous slide', () => {
      this.carousel.prev()
      this.showControls()
      this.scheduleHideControls()
    })

    this.nextButton = createButton(CI_CAROUSEL_NEXT_CLASS, ICONS.NEXT, 'Next slide', () => {
      this.carousel.next()
      this.showControls()
      this.scheduleHideControls()
    })

    // Fullscreen control
    this.fullscreenButton = createButton(
      CI_CAROUSEL_FULLSCREEN_CLASS,
      ICONS.FULLSCREEN,
      'Enter fullscreen',
      () => {
        this.carousel.toggleFullscreen()
        this.showControls()
        this.scheduleHideControls()
      },
    )

    // Add buttons to container
    this.container.appendChild(this.prevButton)
    this.container.appendChild(this.nextButton)
    this.container.appendChild(this.fullscreenButton)

    // Autoplay pause/play button (WCAG 2.2.2 Pause, Stop, Hide)
    if (this.options.autoplay) {
      this.autoplayButton = createButton('ci-carousel-autoplay', PAUSE_ICON, 'Pause autoplay', () => {
        this.toggleAutoplay()
        this.showControls()
        this.scheduleHideControls()
      })
      this.container.appendChild(this.autoplayButton)
    }

    // Setup keyboard and touch controls
    this.setupKeyboardControls()
    this.setupTouchControls()
  }

  toggleAutoplay() {
    if (this.carousel.isAutoplayPaused) {
      this.carousel.resumeAutoplay()
      this.autoplayButton.innerHTML = PAUSE_ICON
      this.autoplayButton.setAttribute('aria-label', 'Pause autoplay')
    } else {
      this.carousel.pauseAutoplay()
      this.autoplayButton.innerHTML = PLAY_ICON
      this.autoplayButton.setAttribute('aria-label', 'Resume autoplay')
    }
  }

  setupTouchControls() {
    this.carousel.mainView.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    this.carousel.mainView.addEventListener('touchend', this.handleTouchEnd, { passive: true })
  }

  handleTouchStart() {
    this.showControls()
  }

  handleTouchEnd() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }

    this.hideControlsTimeout = setTimeout(() => {
      this.container.classList.remove(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
    }, 3000)
  }

  showControls() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.container.classList.add(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
  }

  scheduleHideControls() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.hideControlsTimeout = setTimeout(() => {
      this.container.classList.remove(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
    }, 3000)
  }

  /**
   * Handles keyboard events (only when carousel or its children are focused)
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    if (!this.carousel.container?.contains(document.activeElement)) return

    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        e.preventDefault()
        this.carousel.prev()
        break
      case KEYBOARD_KEYS.ARROW_RIGHT:
        e.preventDefault()
        this.carousel.next()
        break
      case KEYBOARD_KEYS.ESCAPE:
        this.carousel.resetZoom()
        break
    }
  }

  setupKeyboardControls() {
    document.addEventListener(KEYDOWN_EVENT, this.handleKeyDown)
  }

  destroy() {
    document.removeEventListener(KEYDOWN_EVENT, this.handleKeyDown)
    this.carousel.mainView.removeEventListener('touchstart', this.handleTouchStart)
    this.carousel.mainView.removeEventListener('touchend', this.handleTouchEnd)

    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
  }
}
