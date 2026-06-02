import { CI_CAROUSEL_DRAG_INCOMING_CLASS, CI_CAROUSEL_SWIPING_CLASS } from '../constants/classes.constants'
import { TRANSITION_EFFECTS } from '../constants/transitions.constants'
import type { TransitionEffect } from '../core/types'
import type { ZoomPanControls } from './zoom-pan.controls'

const SWIPE_THRESHOLD = 50 // minimum distance in px (release-only swipe)
const SWIPE_MIN_VELOCITY = 0.65 // px per ms
const SWIPE_COOLDOWN = 250 // ms between swipes
const DRAG_INTENT_THRESHOLD = 8 // px of horizontal movement before a drag locks in
const DRAG_COMMIT_PROGRESS = 0.35 // fraction of width dragged to commit on release

// Parallax applied to the receding (current) slide while the incoming one is
// dragged over it. Mirrors the --ci-carousel-overlap-* CSS variables.
const OVERLAP_PARALLAX_SCALE = 0.94
const OVERLAP_PARALLAX_OPACITY = 0.55
const OVERLAP_PARALLAX_SHIFT = 8 // percent

// Inline transition used for snap-back / commit hand-off (reuses the CSS vars).
const SNAP_TRANSITION =
  'transform var(--ci-carousel-transition-slow) var(--ci-carousel-easing), ' +
  'opacity var(--ci-carousel-transition-slow) var(--ci-carousel-easing)'

/** Minimal interface for what SwipeControls needs from the carousel */
interface CarouselRef {
  imagesContainer: HTMLDivElement | null
  zoomPanControls: ZoomPanControls | null
  currentIndex: number
  options: { transitionEffect: TransitionEffect; cycle: boolean; showCoverflow: boolean }
  next(): void
  prev(): void
}

type Direction = 'next' | 'prev'

export class SwipeControls {
  private carousel: CarouselRef | null
  private imagesContainer: HTMLDivElement | null
  private zoomPanControls: ZoomPanControls | null
  private enabled: boolean = true
  private lastSwipeTime: number = 0
  private prefersReducedMotion: boolean = false

  // Gesture tracking
  private startX: number = 0
  private startY: number = 0
  private startTime: number = 0
  private activePointerId: number | null = null
  private pointerType: string = ''

  // Live-drag state (overlap effect only)
  private isDragging: boolean = false
  private direction: Direction = 'next'
  private incomingSlide: HTMLElement | null = null
  private currentSlide: HTMLElement | null = null
  private containerWidth: number = 0
  private rafId: number | null = null
  private pendingDeltaX: number = 0
  private snapTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Bound handlers
  private handlePointerDown: (e: PointerEvent) => void
  private handlePointerMove: (e: PointerEvent) => void
  private handlePointerUp: (e: PointerEvent) => void
  private zoomListener: ((zoom: number) => void) | null = null

  constructor(carousel: CarouselRef) {
    this.carousel = carousel
    this.imagesContainer = carousel.imagesContainer
    this.zoomPanControls = carousel.zoomPanControls

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    this.handlePointerDown = this._handlePointerDown.bind(this)
    this.handlePointerMove = this._handlePointerMove.bind(this)
    this.handlePointerUp = this._handlePointerUp.bind(this)

    this.imagesContainer?.addEventListener('pointerdown', this.handlePointerDown)

    this.setupZoomHandler()
  }

  private get isOverlap(): boolean {
    return this.carousel?.options.transitionEffect === TRANSITION_EFFECTS.OVERLAP
  }

  /**
   * Drag-to-navigate is an overlap-effect feature. Coverflow overrides the
   * transition effect (slides carry the `coverflow` class, not `overlap`), so
   * its slides are positioned by their own class-based transforms — applying
   * the overlap drag's inline transforms on top of them fights coverflow every
   * frame and makes swiping feel stuck. Disable drag-nav whenever coverflow is on.
   */
  private get dragNavEnabled(): boolean {
    return this.isOverlap && !this.carousel?.options.showCoverflow
  }

  private get useLiveDrag(): boolean {
    return this.dragNavEnabled && !this.prefersReducedMotion
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (!this.enabled || this.isCurrentSlideZoomed) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    // A second pointer means a pinch/multi-touch — abort any active drag.
    if (this.activePointerId !== null) {
      this.cancelDrag()
      return
    }

    this.activePointerId = e.pointerId
    this.pointerType = e.pointerType
    this.startX = e.clientX
    this.startY = e.clientY
    this.startTime = performance.now()
    this.isDragging = false

    window.addEventListener('pointermove', this.handlePointerMove, { passive: false })
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointercancel', this.handlePointerUp)
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (this.activePointerId === null || e.pointerId !== this.activePointerId) return

    const deltaX = e.clientX - this.startX
    const deltaY = e.clientY - this.startY

    if (!this.isDragging) {
      // Wait until the gesture resolves to horizontal before committing to a drag.
      if (Math.abs(deltaX) < DRAG_INTENT_THRESHOLD && Math.abs(deltaY) < DRAG_INTENT_THRESHOLD) return
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical intent — let the page scroll, abandon the gesture.
        this.endGesture()
        return
      }
      this.isDragging = true
      if (this.useLiveDrag) this.beginDrag(deltaX)
    }

    if (e.cancelable) e.preventDefault()

    if (this.useLiveDrag && this.incomingSlide) {
      this.pendingDeltaX = deltaX
      this.scheduleDragFrame()
    }
  }

  private _handlePointerUp(e: PointerEvent): void {
    if (this.activePointerId === null || e.pointerId !== this.activePointerId) return

    const deltaX = e.clientX - this.startX
    const deltaY = e.clientY - this.startY
    const elapsed = performance.now() - this.startTime
    const velocity = Math.abs(deltaX) / Math.max(elapsed, 1)

    this.teardownWindowListeners()
    this.activePointerId = null

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // Live-drag release (overlap): commit if dragged far/fast enough, else snap back.
    if (this.useLiveDrag && this.isDragging && this.incomingSlide) {
      const width = this.containerWidth || 1
      const progress = Math.abs(deltaX) / width
      const fastFlick = velocity >= SWIPE_MIN_VELOCITY && Math.abs(deltaX) >= SWIPE_THRESHOLD
      if (progress >= DRAG_COMMIT_PROGRESS || fastFlick) {
        this.commitDrag()
      } else {
        this.snapBack()
      }
      this.resetGestureState()
      return
    }

    // Release-only swipe (non-overlap effects, coverflow, or reduced motion).
    // Touch/pen only, preserving the original behavior — mouse drags only
    // navigate when drag-nav is enabled (overlap effect, not coverflow).
    this.resetGestureState()
    if (this.pointerType === 'mouse' && !this.dragNavEnabled) return
    if (this.isCurrentSlideZoomed) return
    if (performance.now() - this.lastSwipeTime < SWIPE_COOLDOWN) return
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
    if (velocity < SWIPE_MIN_VELOCITY) return
    if (Math.abs(deltaX) < Math.abs(deltaY)) return

    this.lastSwipeTime = performance.now()
    deltaX < 0 ? this.carousel?.next() : this.carousel?.prev()
  }

  // --- Live drag (overlap) ---

  private beginDrag(deltaX: number): void {
    this.clearSnapTimeout()
    const container = this.imagesContainer
    if (!container) return

    this.direction = deltaX < 0 ? 'next' : 'prev'
    this.incomingSlide = this.resolveIncoming(this.direction)
    // No neighbor to drag in (boundary, no cycle) — skip live visuals; the
    // release falls through to the no-op release path.
    if (!this.incomingSlide) return

    this.currentSlide = container.children[this.carousel?.currentIndex ?? 0] as HTMLElement | undefined ?? null
    this.containerWidth = container.offsetWidth || 1

    container.dataset.direction = this.direction
    container.classList.add(CI_CAROUSEL_SWIPING_CLASS)
    this.incomingSlide.classList.add(CI_CAROUSEL_DRAG_INCOMING_CLASS)
  }

  private resolveIncoming(direction: Direction): HTMLElement | null {
    const container = this.imagesContainer
    if (!container) return null
    const n = container.children.length
    if (n <= 1) return null

    const cur = this.carousel?.currentIndex ?? 0
    const cycle = this.carousel?.options.cycle ?? false
    let target = direction === 'next' ? cur + 1 : cur - 1
    if (target < 0) target = cycle ? n - 1 : -1
    else if (target >= n) target = cycle ? 0 : -1
    if (target < 0) return null

    return container.children[target] as HTMLElement
  }

  private scheduleDragFrame(): void {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.applyDragFrame(this.pendingDeltaX)
    })
  }

  private applyDragFrame(deltaX: number): void {
    const incoming = this.incomingSlide
    const current = this.currentSlide
    if (!incoming) return

    // Incoming slides in from its off-screen rest position, following the pointer.
    incoming.style.transform =
      this.direction === 'next' ? `translateX(calc(100% + ${deltaX}px))` : `translateX(calc(-100% + ${deltaX}px))`

    // Current slide recedes (parallax) proportional to how far we've dragged.
    if (current) {
      const progress = Math.min(Math.abs(deltaX) / this.containerWidth, 1)
      const scale = 1 - (1 - OVERLAP_PARALLAX_SCALE) * progress
      const opacity = 1 - (1 - OVERLAP_PARALLAX_OPACITY) * progress
      const shift = OVERLAP_PARALLAX_SHIFT * progress * (this.direction === 'next' ? -1 : 1)
      current.style.transform = `translateX(${shift}%) scale(${scale})`
      current.style.opacity = String(opacity)
    }
  }

  /** Commit the navigation, easing the dragged slide the rest of the way. */
  private commitDrag(): void {
    const container = this.imagesContainer
    const incoming = this.incomingSlide
    const current = this.currentSlide

    // Re-enable CSS transitions, then register the current dragged offset as the
    // animation start so the class-based targets ease from here (no jump).
    container?.classList.remove(CI_CAROUSEL_SWIPING_CLASS)
    if (container) void container.offsetHeight

    // updateSlide() swaps .active/.exiting onto incoming/current respectively.
    this.direction === 'next' ? this.carousel?.next() : this.carousel?.prev()
    this.lastSwipeTime = performance.now()

    // Hand off to the class targets: clearing inline transform lets .active ease to
    // translateX(0) and .exiting ease to its parallax rest.
    if (incoming) {
      incoming.classList.remove(CI_CAROUSEL_DRAG_INCOMING_CLASS)
      incoming.style.transform = ''
      incoming.style.opacity = ''
      incoming.style.transition = ''
    }
    if (current) {
      current.style.transform = ''
      current.style.opacity = ''
      current.style.transition = ''
    }
  }

  /** Abort: ease the incoming slide back off-screen and the current one back to rest. */
  private snapBack(): void {
    const container = this.imagesContainer
    const incoming = this.incomingSlide
    const current = this.currentSlide

    container?.classList.remove(CI_CAROUSEL_SWIPING_CLASS)
    if (container) void container.offsetHeight

    if (incoming) {
      incoming.style.transition = SNAP_TRANSITION
      incoming.style.transform = this.direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)'
      incoming.style.opacity = '0'
    }
    if (current) {
      current.style.transition = SNAP_TRANSITION
      current.style.transform = 'translateX(0) scale(1)'
      current.style.opacity = '1'
    }

    const cleanup = () => {
      this.snapTimeoutId = null
      if (incoming) {
        incoming.classList.remove(CI_CAROUSEL_DRAG_INCOMING_CLASS)
        incoming.style.transition = ''
        incoming.style.transform = ''
        incoming.style.opacity = ''
      }
      if (current) {
        current.style.transition = ''
        current.style.transform = ''
        current.style.opacity = ''
      }
    }

    incoming?.addEventListener('transitionend', cleanup, { once: true })
    this.snapTimeoutId = setTimeout(cleanup, this.getTransitionDurationMs() + 100)
  }

  /** Mid-gesture abort (vertical scroll or multi-touch) — restore any drag visuals. */
  private cancelDrag(): void {
    this.teardownWindowListeners()
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.isDragging && this.useLiveDrag && this.incomingSlide) {
      this.snapBack()
    }
    this.activePointerId = null
    this.resetGestureState()
  }

  private endGesture(): void {
    this.teardownWindowListeners()
    this.activePointerId = null
    this.resetGestureState()
  }

  private resetGestureState(): void {
    this.isDragging = false
    this.incomingSlide = null
    this.currentSlide = null
    this.pendingDeltaX = 0
    // Safety net: ensure the swiping (transition-disabling) class never lingers.
    this.imagesContainer?.classList.remove(CI_CAROUSEL_SWIPING_CLASS)
  }

  private teardownWindowListeners(): void {
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointercancel', this.handlePointerUp)
  }

  private clearSnapTimeout(): void {
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId)
      this.snapTimeoutId = null
    }
  }

  private getTransitionDurationMs(): number {
    if (!this.imagesContainer) return 700
    const raw = getComputedStyle(this.imagesContainer).getPropertyValue('--ci-carousel-transition-slow') || '0.7'
    return parseFloat(raw) * 1000
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
    const scale = this.zoomPanControls?.getScale() ?? 1
    return scale > 1
  }

  destroy(): void {
    if (this.zoomPanControls && this.zoomListener) {
      this.zoomPanControls.off('zoom', this.zoomListener)
      this.zoomListener = null
    }

    this.imagesContainer?.removeEventListener('pointerdown', this.handlePointerDown)
    this.teardownWindowListeners()

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.clearSnapTimeout()
    this.imagesContainer?.classList.remove(CI_CAROUSEL_SWIPING_CLASS)

    this.carousel = null
    this.imagesContainer = null
    this.zoomPanControls = null
  }
}
