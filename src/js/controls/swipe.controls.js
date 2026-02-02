import Hammer from 'hammerjs'

export class SwipeControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel
    this.imagesContainer = carousel.imagesContainer
    this.zoomPanControls = carousel.zoomPanControls
    this.enabled = true // Track if swipe is enabled
    this.hammer = null

    this.initializeSwipeControls()
  }

  initializeSwipeControls() {
    // Initialize Hammer.js touch gesture handler
    // touchAction: 'pan-y' allows vertical scrolling while handling horizontal swipes
    this.hammer = new Hammer(this.imagesContainer, {
      touchAction: 'pan-y',
      inputClass: Hammer.TouchInput,
    })

    // Configure swipe detection settings:
    this.configureSwipeDetection()

    // Setup zoom handling
    this.setupZoomHandler()

    // Setup swipe handling
    this.setupSwipeHandler()
  }

  configureSwipeDetection() {
    // Hammer API reference: https://hammerjs.github.io/api/
    // - `direction` Only detect horizontal swipes (left/right)
    // - `threshold` Minimum swipe distance of 50px
    // - `velocity` Minimum swipe velocity of 0.65 units per ms
    this.hammer.get('swipe').set({
      direction: Hammer.DIRECTION_HORIZONTAL,
      threshold: 50,
      velocity: 0.65,
    })
  }

  setupZoomHandler() {
    // Automatically enable/disable swipe gestures based on zoom level
    // When image is zoomed in, swipe should be disabled to allow panning
    if (this.zoomPanControls?.panzoomInstance) {
      // Store reference to listener for cleanup
      this.zoomListener = () => {
        this.isCurrentSlideZoomed ? this.disableSwipe() : this.enableSwipe()
      }
      this.zoomPanControls?.panzoomInstance?.zoom(this.zoomListener)
    }
  }

  setupSwipeHandler() {
    // Use a debounced handler for swipe events
    let lastSwipeTime = 0
    const SWIPE_COOLDOWN = 250 // milliseconds

    // Handle horizontal swipe gestures
    // Prevent swipe navigation when image is zoomed to avoid conflicts with pan
    this.hammer.on('swipeleft swiperight', (e) => {
      const now = performance.now()

      if (this.isCurrentSlideZoomed || now - lastSwipeTime < SWIPE_COOLDOWN) {
        return
      }

      lastSwipeTime = now
      e.type === 'swipeleft' ? this.carousel.next() : this.carousel.prev()
    })
  }

  // Cache the scale value to reduce getter calls
  get isCurrentSlideZoomed() {
    const scale = this.zoomPanControls?.panzoomInstance?.getScale()
    return scale ? scale > 1 : false
  }

  // Enable swipe gestures if currently disabled
  enableSwipe() {
    if (!this.enabled && this.hammer) {
      this.hammer.get('swipe').set({ enable: true })
      this.enabled = true
    }
  }
  // Disable swipe gestures if currently enabled
  disableSwipe() {
    if (this.enabled && this.hammer) {
      this.hammer.get('swipe').set({ enable: false })
      this.enabled = false
    }
  }

  destroy() {
    // Clean up zoom listener
    if (this.zoomPanControls?.panzoomInstance && this.zoomListener) {
      this.zoomPanControls.panzoomInstance.off('zoom', this.zoomListener)
      this.zoomListener = null
    }

    // Clean up Hammer instance
    if (this.hammer) {
      this.hammer.destroy()
      this.hammer = null
    }

    // Clear references
    this.carousel = null
    this.imagesContainer = null
    this.zoomPanControls = null
  }
}
