const SWIPE_THRESHOLD = 50 // minimum distance in px
const SWIPE_MIN_VELOCITY = 0.65 // px per ms
const SWIPE_COOLDOWN = 250 // ms between swipes

export class SwipeControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel
    this.imagesContainer = carousel.imagesContainer
    this.zoomPanControls = carousel.zoomPanControls
    this.enabled = true
    this.lastSwipeTime = 0

    // Touch tracking
    this.startX = 0
    this.startY = 0
    this.startTime = 0

    // Bind for clean removal
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    this.imagesContainer.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    this.imagesContainer.addEventListener('touchend', this.handleTouchEnd, { passive: true })

    this.setupZoomHandler()
  }

  handleTouchStart(e) {
    if (e.touches.length !== 1) return
    this.startX = e.touches[0].clientX
    this.startY = e.touches[0].clientY
    this.startTime = performance.now()
  }

  handleTouchEnd(e) {
    if (!this.enabled) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY
    const elapsed = performance.now() - this.startTime
    const velocity = Math.abs(deltaX) / elapsed

    // Guard: zoomed, cooldown, threshold, velocity, horizontal dominance
    if (this.isCurrentSlideZoomed) return
    if (performance.now() - this.lastSwipeTime < SWIPE_COOLDOWN) return
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
    if (velocity < SWIPE_MIN_VELOCITY) return
    if (Math.abs(deltaX) < Math.abs(deltaY)) return

    this.lastSwipeTime = performance.now()
    deltaX < 0 ? this.carousel.next() : this.carousel.prev()
  }

  setupZoomHandler() {
    if (this.zoomPanControls) {
      this.zoomListener = () => {
        this.enabled = !this.isCurrentSlideZoomed
      }
      this.zoomPanControls.on('zoom', this.zoomListener)
    }
  }

  get isCurrentSlideZoomed() {
    const scale = this.zoomPanControls?.getScale()
    return scale ? scale > 1 : false
  }

  destroy() {
    if (this.zoomPanControls && this.zoomListener) {
      this.zoomPanControls.off('zoom', this.zoomListener)
      this.zoomListener = null
    }

    this.imagesContainer.removeEventListener('touchstart', this.handleTouchStart)
    this.imagesContainer.removeEventListener('touchend', this.handleTouchEnd)

    this.carousel = null
    this.imagesContainer = null
    this.zoomPanControls = null
  }
}
