import { CI_CAROUSEL_IMAGE_CLASS } from '../constants/classes.constants'
import { DBLCLICK_EVENT, MOUSEWHEEL_EVENT } from '../constants/events.constants'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.3
const DOUBLE_CLICK_ZOOM = 2
const HINT_DURATION = 1500
const TRANSITION_DURATION = '300ms'

export class ZoomPanControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel
    this.imagesContainer = carousel.imagesContainer

    // Zoom/pan state
    this.zoom = 1
    this.panX = 0
    this.panY = 0

    // Drag state
    this.isDragging = false
    this.dragStartX = 0
    this.dragStartY = 0
    this.lastPanX = 0
    this.lastPanY = 0

    // Pinch state
    this.initialPinchDistance = 0
    this.initialPinchZoom = 1
    this.isPinching = false

    // Current image references
    this.currentElement = null
    this.currentWrapper = null

    // Scroll hint
    this.scrollHint = null
    this.scrollHintTimeout = null

    // Zoom change listeners
    this.zoomListeners = []

    // Bind methods for clean removal
    this.handleWheel = this.handleWheel.bind(this)
    this.handleDblClick = this.handleDblClick.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    this.createScrollHint()
    this.attachEvents()
    this.initializeVisibleImage()
  }

  // --- Scroll hint ---

  createScrollHint() {
    this.scrollHint = document.createElement('div')
    this.scrollHint.className = 'ci-carousel-scroll-hint'
    this.scrollHint.textContent = 'Ctrl + scroll to zoom'
    this.scrollHint.setAttribute('aria-hidden', 'true')
    this.carousel.mainView.appendChild(this.scrollHint)
  }

  showScrollHint() {
    if (this.scrollHintTimeout) clearTimeout(this.scrollHintTimeout)
    this.scrollHint.classList.add('ci-carousel-scroll-hint--visible')
    this.scrollHintTimeout = setTimeout(() => {
      this.scrollHint.classList.remove('ci-carousel-scroll-hint--visible')
    }, HINT_DURATION)
  }

  // --- Event setup ---

  attachEvents() {
    this.imagesContainer.addEventListener(MOUSEWHEEL_EVENT, this.handleWheel, { passive: false })
    this.imagesContainer.addEventListener(DBLCLICK_EVENT, this.handleDblClick)
    this.imagesContainer.addEventListener('mousedown', this.handleMouseDown)
    // Document-level mouse listeners attached on demand in handleMouseDown
    this.imagesContainer.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.imagesContainer.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.imagesContainer.addEventListener('touchend', this.handleTouchEnd)
  }

  // --- Image initialization ---

  initializeVisibleImage() {
    const wrapper = this.getCurrentWrapper()
    if (!wrapper) return

    const img = wrapper.querySelector(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    if (!img) return

    this.currentElement = img
    this.currentWrapper = wrapper
    this.zoom = 1
    this.panX = 0
    this.panY = 0
    this.applyTransform(false)
    this.updateState()
  }

  getCurrentWrapper() {
    return this.imagesContainer.children[this.carousel.currentIndex]
  }

  // --- Mouse wheel (Ctrl+scroll to zoom, plain scroll shows hint) ---

  handleWheel(event) {
    if (!this.currentElement) {
      this.initializeVisibleImage()
      if (!this.currentElement) return
    }

    if (!event.ctrlKey) {
      this.showScrollHint()
      return
    }

    event.preventDefault()

    // Normalize Firefox line-based scrolling
    let deltaY = event.deltaY
    if (event.deltaMode === 1) deltaY *= 20

    const delta = -deltaY * 0.01
    const rect = this.currentWrapper?.getBoundingClientRect()
    if (!rect) return
    const originX = (event.clientX - rect.left) / rect.width
    const originY = (event.clientY - rect.top) / rect.height

    this.setZoom(this.zoom + delta, originX, originY)
  }

  // --- Double-click to toggle zoom ---

  handleDblClick(event) {
    if (!this.currentElement) return

    const rect = this.currentWrapper?.getBoundingClientRect()
    if (!rect) return
    const originX = (event.clientX - rect.left) / rect.width
    const originY = (event.clientY - rect.top) / rect.height

    if (this.zoom > 1) {
      this.resetZoom()
    } else {
      this.setZoom(DOUBLE_CLICK_ZOOM, originX, originY, true)
    }
  }

  // --- Mouse drag to pan (document listeners attached on demand) ---

  handleMouseDown(event) {
    if (this.zoom <= 1 || event.button !== 0) return

    this.isDragging = true
    this.dragStartX = event.clientX
    this.dragStartY = event.clientY
    this.lastPanX = this.panX
    this.lastPanY = this.panY
    this.currentWrapper?.classList.add('ci-carousel-dragging')
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
    event.preventDefault()
  }

  handleMouseMove(event) {
    if (!this.isDragging) return

    const dx = event.clientX - this.dragStartX
    const dy = event.clientY - this.dragStartY

    this.panX = this.lastPanX + dx / this.zoom
    this.panY = this.lastPanY + dy / this.zoom
    this.clampPan()
    this.applyTransform(false)
  }

  handleMouseUp() {
    if (!this.isDragging) return
    this.isDragging = false
    this.currentWrapper?.classList.remove('ci-carousel-dragging')
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  // --- Touch: pinch-to-zoom + drag-to-pan ---

  handleTouchStart(event) {
    if (event.touches.length === 2) {
      // Pinch start
      this.isPinching = true
      this.isDragging = false
      this.initialPinchDistance = this.getTouchDistance(event.touches)
      this.initialPinchZoom = this.zoom
      event.preventDefault()
    } else if (event.touches.length === 1 && this.zoom > 1) {
      // Single-finger pan when zoomed
      this.isDragging = true
      this.dragStartX = event.touches[0].clientX
      this.dragStartY = event.touches[0].clientY
      this.lastPanX = this.panX
      this.lastPanY = this.panY
    }
  }

  handleTouchMove(event) {
    if (event.touches.length === 2) {
      // Pinch zoom
      event.preventDefault()
      const distance = this.getTouchDistance(event.touches)
      const scale = this.initialPinchZoom * (distance / this.initialPinchDistance)

      const rect = this.currentWrapper?.getBoundingClientRect()
      if (!rect) return

      const centerX = ((event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left) / rect.width
      const centerY = ((event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top) / rect.height

      this.setZoom(scale, centerX, centerY)
    } else if (event.touches.length === 1 && this.isDragging && this.zoom > 1) {
      // Single-finger pan
      event.preventDefault()
      const dx = event.touches[0].clientX - this.dragStartX
      const dy = event.touches[0].clientY - this.dragStartY

      this.panX = this.lastPanX + dx / this.zoom
      this.panY = this.lastPanY + dy / this.zoom
      this.clampPan()
      this.applyTransform(false)
    }
  }

  handleTouchEnd(event) {
    if (event.touches.length < 2) {
      this.isPinching = false
    }
    if (event.touches.length === 0) {
      this.isDragging = false
    }
  }

  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // --- Zoom core ---

  /**
   * Sets zoom level with optional origin point for zoom-towards-cursor behavior
   * @param {number} newZoom - Target zoom level
   * @param {number} originX - Zoom origin X (0-1, fraction of container width)
   * @param {number} originY - Zoom origin Y (0-1, fraction of container height)
   * @param {boolean} animate - Whether to animate the transition
   */
  setZoom(newZoom, originX = 0.5, originY = 0.5, animate = false) {
    const prevZoom = this.zoom
    this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

    if (this.zoom <= 1) {
      this.panX = 0
      this.panY = 0
    } else if (prevZoom !== this.zoom && this.currentWrapper) {
      // Adjust pan so the point under the cursor stays in place
      const w = this.currentWrapper.offsetWidth
      const h = this.currentWrapper.offsetHeight
      const ox = originX * w
      const oy = originY * h

      this.panX = (prevZoom * (this.panX + ox)) / this.zoom - ox
      this.panY = (prevZoom * (this.panY + oy)) / this.zoom - oy
    }

    this.clampPan()
    this.applyTransform(animate)
    this.updateState()
    this.notifyZoomListeners()
  }

  clampPan() {
    if (this.zoom <= 1) {
      this.panX = 0
      this.panY = 0
      return
    }

    const wrapper = this.currentWrapper
    if (!wrapper) return

    const w = wrapper.offsetWidth
    const h = wrapper.offsetHeight
    const maxPanX = (w * (this.zoom - 1)) / this.zoom
    const maxPanY = (h * (this.zoom - 1)) / this.zoom

    this.panX = Math.max(-maxPanX, Math.min(0, this.panX))
    this.panY = Math.max(-maxPanY, Math.min(0, this.panY))
  }

  applyTransform(animate) {
    if (!this.currentElement) return

    this.currentElement.style.transformOrigin = '0 0'
    this.currentElement.style.transition = animate ? `transform ${TRANSITION_DURATION} ease` : 'none'
    this.currentElement.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`
  }

  /**
   * Updates cursor, zoomed class, and touch-action based on zoom level
   */
  updateState() {
    if (!this.currentWrapper) return

    if (this.zoom > 1) {
      this.currentWrapper.classList.add('zoomed')
      this.imagesContainer.style.touchAction = 'none'
    } else {
      this.currentWrapper.classList.remove('zoomed')
      this.imagesContainer.style.touchAction = ''
    }
  }

  // --- Zoom event listeners (used by SwipeControls) ---

  on(event, callback) {
    if (event === 'zoom') {
      this.zoomListeners.push(callback)
    }
  }

  off(event, callback) {
    if (event === 'zoom') {
      this.zoomListeners = this.zoomListeners.filter((cb) => cb !== callback)
    }
  }

  notifyZoomListeners() {
    const zoom = this.zoom
    this.zoomListeners.forEach((cb) => cb(zoom))
  }

  // --- Public API ---

  getScale() {
    return this.zoom
  }

  zoomIn() {
    if (this.zoom >= MAX_ZOOM) return
    this.setZoom(this.zoom + ZOOM_STEP, 0.5, 0.5, true)
  }

  zoomOut() {
    if (this.zoom <= MIN_ZOOM) return
    this.setZoom(this.zoom - ZOOM_STEP, 0.5, 0.5, true)
  }

  resetZoom() {
    this.zoom = 1
    this.panX = 0
    this.panY = 0
    this.applyTransform(true)
    this.updateState()
    this.notifyZoomListeners()
  }

  // --- Cleanup ---

  destroy() {
    this.imagesContainer.removeEventListener(MOUSEWHEEL_EVENT, this.handleWheel)
    this.imagesContainer.removeEventListener(DBLCLICK_EVENT, this.handleDblClick)
    this.imagesContainer.removeEventListener('mousedown', this.handleMouseDown)
    // Clean up document listeners in case drag was in progress
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    this.imagesContainer.removeEventListener('touchstart', this.handleTouchStart)
    this.imagesContainer.removeEventListener('touchmove', this.handleTouchMove)
    this.imagesContainer.removeEventListener('touchend', this.handleTouchEnd)

    if (this.scrollHintTimeout) clearTimeout(this.scrollHintTimeout)
    this.scrollHint?.remove()

    if (this.currentElement) {
      this.currentElement.style.transform = ''
      this.currentElement.style.transformOrigin = ''
      this.currentElement.style.transition = ''
    }

    this.imagesContainer.style.touchAction = ''
    this.zoomListeners = []
    this.currentElement = null
    this.currentWrapper = null
  }
}
