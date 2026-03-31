import {
  CI_CAROUSEL_DRAGGING_CLASS,
  CI_CAROUSEL_IMAGE_CLASS,
  CI_CAROUSEL_SCROLL_HINT_CLASS,
  CI_CAROUSEL_SCROLL_HINT_VISIBLE_CLASS,
  ZOOMED_CLASS,
} from '../constants/classes.constants'
import { DBLCLICK_EVENT, MOUSEWHEEL_EVENT } from '../constants/events.constants'

const DEFAULT_MIN_ZOOM = 1
const DEFAULT_MAX_ZOOM = 4
const DEFAULT_ZOOM_STEP = 0.3
const DOUBLE_CLICK_ZOOM = 2
const HINT_DURATION = 1500
const TRANSITION_DURATION = '300ms'

type ZoomListener = (zoom: number) => void

/** Zoom configuration passed from carousel config */
export interface ZoomConfig {
  minZoom: number
  maxZoom: number
  zoomStep: number
}

/** Minimal interface for what ZoomPanControls needs from the carousel */
interface CarouselRef {
  currentIndex: number
  mainView: HTMLDivElement | null
  imagesContainer: HTMLDivElement | null
}

export class ZoomPanControls {
  private carousel: CarouselRef
  private imagesContainer: HTMLDivElement
  private minZoom: number
  private maxZoom: number
  private zoomStep: number

  // Zoom/pan state
  zoom: number = 1
  private panX: number = 0
  private panY: number = 0

  // Drag state
  private isDragging: boolean = false
  private dragStartX: number = 0
  private dragStartY: number = 0
  private lastPanX: number = 0
  private lastPanY: number = 0

  // Pinch state
  private initialPinchDistance: number = 0
  private initialPinchZoom: number = 1
  private isPinching: boolean = false

  // Current image references
  private currentElement: HTMLImageElement | null = null
  private currentWrapper: HTMLElement | null = null

  // Scroll hint
  private scrollHint: HTMLDivElement | null = null
  private scrollHintTimeout: ReturnType<typeof setTimeout> | null = null

  // Zoom change listeners
  private zoomListeners: ZoomListener[] = []

  // Bound event handlers
  private handleWheel: (e: WheelEvent) => void
  private handleDblClick: (e: MouseEvent) => void
  private handleMouseDown: (e: MouseEvent) => void
  private handleMouseMove: (e: MouseEvent) => void
  private handleMouseUp: (e: MouseEvent) => void
  private handleTouchStart: (e: TouchEvent) => void
  private handleTouchMove: (e: TouchEvent) => void
  private handleTouchEnd: (e: TouchEvent) => void

  constructor(carousel: CarouselRef, zoomConfig?: ZoomConfig) {
    this.carousel = carousel
    this.imagesContainer = carousel.imagesContainer!
    this.minZoom = zoomConfig?.minZoom ?? DEFAULT_MIN_ZOOM
    this.maxZoom = zoomConfig?.maxZoom ?? DEFAULT_MAX_ZOOM
    this.zoomStep = zoomConfig?.zoomStep ?? DEFAULT_ZOOM_STEP

    // Bind methods for clean removal
    this.handleWheel = this._handleWheel.bind(this)
    this.handleDblClick = this._handleDblClick.bind(this)
    this.handleMouseDown = this._handleMouseDown.bind(this)
    this.handleMouseMove = this._handleMouseMove.bind(this)
    this.handleMouseUp = this._handleMouseUp.bind(this)
    this.handleTouchStart = this._handleTouchStart.bind(this)
    this.handleTouchMove = this._handleTouchMove.bind(this)
    this.handleTouchEnd = this._handleTouchEnd.bind(this)

    this.createScrollHint()
    this.attachEvents()
    this.initializeVisibleImage()
  }

  // --- Scroll hint ---

  private createScrollHint(): void {
    this.scrollHint = document.createElement('div')
    this.scrollHint.className = CI_CAROUSEL_SCROLL_HINT_CLASS
    this.scrollHint.textContent = 'Ctrl + scroll to zoom'
    this.scrollHint.setAttribute('aria-hidden', 'true')
    this.carousel.mainView!.appendChild(this.scrollHint)
  }

  private showScrollHint(): void {
    if (this.scrollHintTimeout) clearTimeout(this.scrollHintTimeout)
    this.scrollHint!.classList.add(CI_CAROUSEL_SCROLL_HINT_VISIBLE_CLASS)
    this.scrollHintTimeout = setTimeout(() => {
      this.scrollHint!.classList.remove(CI_CAROUSEL_SCROLL_HINT_VISIBLE_CLASS)
    }, HINT_DURATION)
  }

  // --- Event setup ---

  private attachEvents(): void {
    this.imagesContainer.addEventListener(MOUSEWHEEL_EVENT, this.handleWheel, { passive: false })
    this.imagesContainer.addEventListener(DBLCLICK_EVENT, this.handleDblClick)
    this.imagesContainer.addEventListener('mousedown', this.handleMouseDown)
    this.imagesContainer.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.imagesContainer.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.imagesContainer.addEventListener('touchend', this.handleTouchEnd)
  }

  // --- Image initialization ---

  initializeVisibleImage(): void {
    const wrapper = this.getCurrentWrapper()
    if (!wrapper) return

    const img = wrapper.querySelector<HTMLImageElement>(`.${CI_CAROUSEL_IMAGE_CLASS}`)
    if (!img) return

    this.currentElement = img
    this.currentWrapper = wrapper
    this.zoom = this.minZoom
    this.panX = 0
    this.panY = 0
    this.applyTransform(false)
    this.updateState()
  }

  private getCurrentWrapper(): HTMLElement | null {
    return (this.imagesContainer.children[this.carousel.currentIndex] as HTMLElement) ?? null
  }

  // --- Mouse wheel (Ctrl+scroll to zoom, plain scroll shows hint) ---

  private _handleWheel(event: WheelEvent): void {
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

  private _handleDblClick(event: MouseEvent): void {
    if (!this.currentElement) return

    const rect = this.currentWrapper?.getBoundingClientRect()
    if (!rect) return
    const originX = (event.clientX - rect.left) / rect.width
    const originY = (event.clientY - rect.top) / rect.height

    if (this.zoom > this.minZoom) {
      this.resetZoom()
    } else {
      this.setZoom(DOUBLE_CLICK_ZOOM, originX, originY, true)
    }
  }

  // --- Mouse drag to pan (document listeners attached on demand) ---

  private _handleMouseDown(event: MouseEvent): void {
    if (this.zoom <= this.minZoom || event.button !== 0) return

    this.isDragging = true
    this.dragStartX = event.clientX
    this.dragStartY = event.clientY
    this.lastPanX = this.panX
    this.lastPanY = this.panY
    this.currentWrapper?.classList.add(CI_CAROUSEL_DRAGGING_CLASS)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
    event.preventDefault()
  }

  private _handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return

    const dx = event.clientX - this.dragStartX
    const dy = event.clientY - this.dragStartY

    this.panX = this.lastPanX + dx / this.zoom
    this.panY = this.lastPanY + dy / this.zoom
    this.clampPan()
    this.applyTransform(false)
  }

  private _handleMouseUp(): void {
    if (!this.isDragging) return
    this.isDragging = false
    this.currentWrapper?.classList.remove(CI_CAROUSEL_DRAGGING_CLASS)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  // --- Touch: pinch-to-zoom + drag-to-pan ---

  private _handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      this.isPinching = true
      this.isDragging = false
      this.initialPinchDistance = this.getTouchDistance(event.touches)
      this.initialPinchZoom = this.zoom
      event.preventDefault()
    } else if (event.touches.length === 1 && this.zoom > 1) {
      this.isDragging = true
      this.dragStartX = event.touches[0].clientX
      this.dragStartY = event.touches[0].clientY
      this.lastPanX = this.panX
      this.lastPanY = this.panY
    }
  }

  private _handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault()
      const distance = this.getTouchDistance(event.touches)
      const scale = this.initialPinchZoom * (distance / this.initialPinchDistance)

      const rect = this.currentWrapper?.getBoundingClientRect()
      if (!rect) return

      const centerX = ((event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left) / rect.width
      const centerY = ((event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top) / rect.height

      this.setZoom(scale, centerX, centerY)
    } else if (event.touches.length === 1 && this.isDragging && this.zoom > 1) {
      event.preventDefault()
      const dx = event.touches[0].clientX - this.dragStartX
      const dy = event.touches[0].clientY - this.dragStartY

      this.panX = this.lastPanX + dx / this.zoom
      this.panY = this.lastPanY + dy / this.zoom
      this.clampPan()
      this.applyTransform(false)
    }
  }

  private _handleTouchEnd(event: TouchEvent): void {
    if (event.touches.length < 2) {
      this.isPinching = false
    }
    if (event.touches.length === 0) {
      this.isDragging = false
    }
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // --- Zoom core ---

  setZoom(newZoom: number, originX: number = 0.5, originY: number = 0.5, animate: boolean = false): void {
    const prevZoom = this.zoom
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))

    if (this.zoom <= this.minZoom) {
      this.panX = 0
      this.panY = 0
    } else if (prevZoom !== this.zoom && this.currentWrapper) {
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

  private clampPan(): void {
    if (this.zoom <= this.minZoom) {
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

  private applyTransform(animate: boolean): void {
    if (!this.currentElement) return

    this.currentElement.style.transformOrigin = '0 0'
    this.currentElement.style.transition = animate ? `transform ${TRANSITION_DURATION} ease` : 'none'
    this.currentElement.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`
  }

  private updateState(): void {
    if (!this.currentWrapper) return

    if (this.zoom > this.minZoom) {
      this.currentWrapper.classList.add(ZOOMED_CLASS)
      this.imagesContainer.style.touchAction = 'none'
    } else {
      this.currentWrapper.classList.remove(ZOOMED_CLASS)
      this.imagesContainer.style.touchAction = ''
    }
  }

  // --- Zoom event listeners (used by SwipeControls, Cloudimage resize) ---

  on(event: string, callback: ZoomListener): void {
    if (event === 'zoom') {
      this.zoomListeners.push(callback)
    }
  }

  off(event: string, callback: ZoomListener): void {
    if (event === 'zoom') {
      this.zoomListeners = this.zoomListeners.filter((cb) => cb !== callback)
    }
  }

  private notifyZoomListeners(): void {
    const zoom = this.zoom
    this.zoomListeners.forEach((cb) => cb(zoom))
  }

  // --- Public API ---

  getScale(): number {
    return this.zoom
  }

  zoomIn(): void {
    if (this.zoom >= this.maxZoom) return
    this.setZoom(this.zoom + this.zoomStep, 0.5, 0.5, true)
  }

  zoomOut(): void {
    if (this.zoom <= this.minZoom) return
    this.setZoom(this.zoom - this.zoomStep, 0.5, 0.5, true)
  }

  resetZoom(): void {
    this.zoom = this.minZoom
    this.panX = 0
    this.panY = 0
    this.applyTransform(true)
    this.updateState()
    this.notifyZoomListeners()
  }

  // --- Cleanup ---

  destroy(): void {
    this.imagesContainer.removeEventListener(MOUSEWHEEL_EVENT, this.handleWheel)
    this.imagesContainer.removeEventListener(DBLCLICK_EVENT, this.handleDblClick)
    this.imagesContainer.removeEventListener('mousedown', this.handleMouseDown)
    this.imagesContainer.removeEventListener('touchstart', this.handleTouchStart)
    this.imagesContainer.removeEventListener('touchmove', this.handleTouchMove)
    this.imagesContainer.removeEventListener('touchend', this.handleTouchEnd)

    // Always clean up document-level drag listeners (may be attached if destroyed mid-drag)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    this.isDragging = false

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
