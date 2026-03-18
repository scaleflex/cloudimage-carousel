import type { ZoomPanControls } from './zoom-pan.controls'

const SWIPE_THRESHOLD = 50 // minimum distance in px
const SWIPE_MIN_VELOCITY = 0.65 // px per ms
const SWIPE_COOLDOWN = 250 // ms between swipes

/** Minimal interface for what SwipeControls needs from the carousel */
interface CarouselRef {
  imagesContainer: HTMLDivElement | null
  zoomPanControls: ZoomPanControls | null
  next(): void
  prev(): void
}

export class SwipeControls {
  private carousel: CarouselRef | null
  private imagesContainer: HTMLDivElement | null
  private zoomPanControls: ZoomPanControls | null
  private enabled: boolean = true
  private lastSwipeTime: number = 0

  // Touch tracking
  private startX: number = 0
  private startY: number = 0
  private startTime: number = 0

  // Bound handlers
  private handleTouchStart: (e: TouchEvent) => void
  private handleTouchEnd: (e: TouchEvent) => void
  private zoomListener: ((zoom: number) => void) | null = null

  constructor(carousel: CarouselRef) {
    this.carousel = carousel
    this.imagesContainer = carousel.imagesContainer
    this.zoomPanControls = carousel.zoomPanControls

    this.handleTouchStart = this._handleTouchStart.bind(this)
    this.handleTouchEnd = this._handleTouchEnd.bind(this)

    this.imagesContainer?.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    this.imagesContainer?.addEventListener('touchend', this.handleTouchEnd, { passive: true })

    this.setupZoomHandler()
  }

  private _handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return
    this.startX = e.touches[0].clientX
    this.startY = e.touches[0].clientY
    this.startTime = performance.now()
  }

  private _handleTouchEnd(e: TouchEvent): void {
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
    deltaX < 0 ? this.carousel?.next() : this.carousel?.prev()
  }

  private setupZoomHandler(): void {
    if (this.zoomPanControls) {
      this.zoomListener = () => {
        this.enabled = !this.isCurrentSlideZoomed
      }
      this.zoomPanControls.on('zoom', this.zoomListener)
    }
  }

  private get isCurrentSlideZoomed(): boolean {
    const scale = this.zoomPanControls?.getScale()
    return scale ? scale > 1 : false
  }

  destroy(): void {
    if (this.zoomPanControls && this.zoomListener) {
      this.zoomPanControls.off('zoom', this.zoomListener)
      this.zoomListener = null
    }

    this.imagesContainer?.removeEventListener('touchstart', this.handleTouchStart)
    this.imagesContainer?.removeEventListener('touchend', this.handleTouchEnd)

    this.carousel = null
    this.imagesContainer = null
    this.zoomPanControls = null
  }
}
