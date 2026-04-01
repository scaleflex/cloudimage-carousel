/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { ZoomPanControls } from '../src/controls/zoom-pan.controls'
import type { ZoomConfig } from '../src/controls/zoom-pan.controls'

// ── Helpers ──────────────────────────────────────────────────────────────────

function createMockCarousel() {
  const mainView = document.createElement('div')
  const imagesContainer = document.createElement('div')

  // Build the first child: a wrapper containing an image
  const wrapper = document.createElement('div')
  wrapper.className = 'ci-carousel-image-wrapper active'

  const img = document.createElement('img')
  img.className = 'ci-carousel-image'
  wrapper.appendChild(img)

  imagesContainer.appendChild(wrapper)
  mainView.appendChild(imagesContainer)
  document.body.appendChild(mainView)

  // jsdom elements have 0 offsetWidth/Height by default which breaks pan clamping.
  // Provide realistic dimensions so pan calculations work correctly.
  Object.defineProperty(wrapper, 'offsetWidth', { configurable: true, get: () => 400 })
  Object.defineProperty(wrapper, 'offsetHeight', { configurable: true, get: () => 300 })

  return {
    ref: {
      currentIndex: 0,
      mainView,
      imagesContainer,
    },
    wrapper,
    img,
  }
}

function defaultZoomConfig(overrides?: Partial<ZoomConfig>): ZoomConfig {
  return {
    minZoom: 1,
    maxZoom: 4,
    zoomStep: 0.3,
    ...overrides,
  }
}

/**
 * Dispatch a WheelEvent on the given element.
 * ctrlKey = true simulates Ctrl+scroll (zoom), ctrlKey = false = plain scroll.
 */
function dispatchWheel(
  target: HTMLElement,
  deltaY: number,
  ctrlKey: boolean = false,
  clientX: number = 50,
  clientY: number = 50,
) {
  const event = new WheelEvent('wheel', {
    deltaY,
    ctrlKey,
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
}

function dispatchDblClick(
  target: HTMLElement,
  clientX: number = 50,
  clientY: number = 50,
) {
  const event = new MouseEvent('dblclick', {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
}

function dispatchMouseDown(
  target: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const event = new MouseEvent('mousedown', {
    clientX,
    clientY,
    button: 0,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
}

function dispatchMouseMove(clientX: number, clientY: number) {
  const event = new MouseEvent('mousemove', {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  })
  document.dispatchEvent(event)
}

function dispatchMouseUp() {
  const event = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
  })
  document.dispatchEvent(event)
}

function makeTouches(
  points: Array<{ clientX: number; clientY: number; identifier?: number }>,
): Touch[] {
  return points.map(
    (p, i) =>
      ({
        clientX: p.clientX,
        clientY: p.clientY,
        identifier: p.identifier ?? i,
      }) as unknown as Touch,
  )
}

function dispatchTouchStart(target: HTMLElement, touches: Touch[]) {
  const event = new TouchEvent('touchstart', {
    touches,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
}

function dispatchTouchMove(target: HTMLElement, touches: Touch[]) {
  const event = new TouchEvent('touchmove', {
    touches,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
}

function dispatchTouchEnd(target: HTMLElement, remainingTouches: Touch[] = []) {
  const event = new TouchEvent('touchend', {
    touches: remainingTouches,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ZoomPanControls', () => {
  let carousel: ReturnType<typeof createMockCarousel>
  let controls: ZoomPanControls

  beforeEach(() => {
    carousel = createMockCarousel()
  })

  afterEach(() => {
    controls?.destroy()
    carousel.ref.mainView.remove()
  })

  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('constructor', () => {
    it('creates without throwing', () => {
      controls = new ZoomPanControls(carousel.ref)
      expect(controls).toBeDefined()
    })

    it('throws when imagesContainer is null', () => {
      const badRef = { currentIndex: 0, mainView: null, imagesContainer: null }
      expect(() => new ZoomPanControls(badRef as any)).toThrow(
        'carousel.imagesContainer must exist',
      )
    })

    it('uses default zoom config when none provided', () => {
      controls = new ZoomPanControls(carousel.ref)
      expect(controls.getScale()).toBe(1)
    })

    it('accepts custom zoom config', () => {
      controls = new ZoomPanControls(
        carousel.ref,
        defaultZoomConfig({ minZoom: 0.5 }),
      )
      expect(controls.getScale()).toBe(0.5)
    })

    it('creates scroll hint element inside mainView', () => {
      controls = new ZoomPanControls(carousel.ref)
      const hint = carousel.ref.mainView.querySelector('.ci-carousel-scroll-hint')
      expect(hint).toBeTruthy()
      expect(hint?.textContent).toBe('Ctrl + scroll to zoom')
    })

    it('sets aria-hidden on scroll hint', () => {
      controls = new ZoomPanControls(carousel.ref)
      const hint = carousel.ref.mainView.querySelector('.ci-carousel-scroll-hint')
      expect(hint?.getAttribute('aria-hidden')).toBe('true')
    })

    it('initializes visible image on construction', () => {
      controls = new ZoomPanControls(carousel.ref)
      // The transform should be applied to the image
      expect(carousel.img.style.transform).toContain('scale(1)')
    })
  })

  // ==========================================================================
  // Wheel zoom (Ctrl+scroll)
  // ==========================================================================

  describe('wheel zoom', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('zooms in on Ctrl+scroll up (negative deltaY)', () => {
      dispatchWheel(carousel.ref.imagesContainer, -100, true)
      expect(controls.getScale()).toBeGreaterThan(1)
    })

    it('zooms out on Ctrl+scroll down (positive deltaY)', () => {
      // First zoom in
      controls.setZoom(2)
      const zoomedIn = controls.getScale()

      dispatchWheel(carousel.ref.imagesContainer, 100, true)
      expect(controls.getScale()).toBeLessThan(zoomedIn)
    })

    it('does not zoom beyond maxZoom', () => {
      // Send a huge scroll
      for (let i = 0; i < 50; i++) {
        dispatchWheel(carousel.ref.imagesContainer, -200, true)
      }
      expect(controls.getScale()).toBeLessThanOrEqual(4)
    })

    it('does not zoom below minZoom', () => {
      dispatchWheel(carousel.ref.imagesContainer, 200, true)
      expect(controls.getScale()).toBe(1)
    })

    it('prevents default on Ctrl+scroll', () => {
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      const spy = vi.spyOn(event, 'preventDefault')
      carousel.ref.imagesContainer.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Scroll hint (plain scroll without Ctrl)
  // ==========================================================================

  describe('scroll hint', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows scroll hint on plain scroll (no Ctrl key)', () => {
      dispatchWheel(carousel.ref.imagesContainer, -100, false)
      const hint = carousel.ref.mainView.querySelector('.ci-carousel-scroll-hint')
      expect(hint?.classList.contains('ci-carousel-scroll-hint--visible')).toBe(true)
    })

    it('auto-hides scroll hint after 1500ms', () => {
      dispatchWheel(carousel.ref.imagesContainer, -100, false)
      const hint = carousel.ref.mainView.querySelector('.ci-carousel-scroll-hint')

      expect(hint?.classList.contains('ci-carousel-scroll-hint--visible')).toBe(true)
      vi.advanceTimersByTime(1500)
      expect(hint?.classList.contains('ci-carousel-scroll-hint--visible')).toBe(false)
    })

    it('resets hide timer on subsequent plain scrolls', () => {
      const hint = carousel.ref.mainView.querySelector('.ci-carousel-scroll-hint')

      dispatchWheel(carousel.ref.imagesContainer, -100, false)
      vi.advanceTimersByTime(1000)
      // Still visible after 1000ms
      expect(hint?.classList.contains('ci-carousel-scroll-hint--visible')).toBe(true)

      // Scroll again - timer should reset
      dispatchWheel(carousel.ref.imagesContainer, -100, false)
      vi.advanceTimersByTime(1000)
      // Still visible because the timer was reset
      expect(hint?.classList.contains('ci-carousel-scroll-hint--visible')).toBe(true)

      vi.advanceTimersByTime(500)
      // Now 1500ms after the second scroll - should be hidden
      expect(hint?.classList.contains('ci-carousel-scroll-hint--visible')).toBe(false)
    })

    it('does not show scroll hint when mainView is null', () => {
      controls.destroy()
      const refNoMainView = {
        currentIndex: 0,
        mainView: null,
        imagesContainer: carousel.ref.imagesContainer,
      }
      controls = new ZoomPanControls(refNoMainView as any)
      // Should not throw, just no hint created
      dispatchWheel(carousel.ref.imagesContainer, -100, false)
      // No assertion needed beyond "no error thrown"
    })
  })

  // ==========================================================================
  // Double-click to toggle zoom
  // ==========================================================================

  describe('double-click', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('zooms in to 2x on double-click at minZoom', () => {
      dispatchDblClick(carousel.ref.imagesContainer)
      expect(controls.getScale()).toBe(2)
    })

    it('resets to minZoom on double-click when already zoomed', () => {
      controls.setZoom(2.5)
      dispatchDblClick(carousel.ref.imagesContainer)
      expect(controls.getScale()).toBe(1)
    })

    it('toggles zoom on consecutive double-clicks', () => {
      dispatchDblClick(carousel.ref.imagesContainer)
      expect(controls.getScale()).toBe(2)

      dispatchDblClick(carousel.ref.imagesContainer)
      expect(controls.getScale()).toBe(1)
    })
  })

  // ==========================================================================
  // Mouse drag to pan
  // ==========================================================================

  describe('mouse drag pan', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('does not start drag when not zoomed', () => {
      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      dispatchMouseMove(200, 200)
      dispatchMouseUp()
      // No dragging class should be added
      expect(
        carousel.wrapper.classList.contains('ci-carousel-dragging'),
      ).toBe(false)
    })

    it('adds dragging class on mousedown when zoomed', () => {
      controls.setZoom(2)
      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      expect(
        carousel.wrapper.classList.contains('ci-carousel-dragging'),
      ).toBe(true)
    })

    it('removes dragging class on mouseup', () => {
      controls.setZoom(2)
      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      dispatchMouseUp()
      expect(
        carousel.wrapper.classList.contains('ci-carousel-dragging'),
      ).toBe(false)
    })

    it('pans the image on mouse drag while zoomed', () => {
      controls.setZoom(2)
      const transformBefore = carousel.img.style.transform

      // Drag left/up so pan goes negative (within the clamped range [-maxPan, 0])
      dispatchMouseDown(carousel.ref.imagesContainer, 200, 200)
      dispatchMouseMove(100, 100)

      const transformAfter = carousel.img.style.transform
      expect(transformAfter).not.toBe(transformBefore)
    })

    it('ignores right-click (button !== 0)', () => {
      controls.setZoom(2)
      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        button: 2, // right click
        bubbles: true,
        cancelable: true,
      })
      carousel.ref.imagesContainer.dispatchEvent(event)
      expect(
        carousel.wrapper.classList.contains('ci-carousel-dragging'),
      ).toBe(false)
    })

    it('removes document-level listeners on mouseup', () => {
      controls.setZoom(2)
      const removeSpy = vi.spyOn(document, 'removeEventListener')

      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      dispatchMouseUp()

      const removedTypes = removeSpy.mock.calls.map((c) => c[0])
      expect(removedTypes).toContain('mousemove')
      expect(removedTypes).toContain('mouseup')
    })
  })

  // ==========================================================================
  // Pinch-to-zoom (touch with two fingers)
  // ==========================================================================

  describe('pinch-to-zoom', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('starts pinch on two-finger touchstart', () => {
      const touches = makeTouches([
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ])
      dispatchTouchStart(carousel.ref.imagesContainer, touches)
      // No error thrown means pinch was initialized
      expect(controls.getScale()).toBe(1)
    })

    it('zooms with pinch spread (fingers moving apart)', () => {
      const startTouches = makeTouches([
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ])
      dispatchTouchStart(carousel.ref.imagesContainer, startTouches)

      // Move fingers further apart (increasing distance)
      const moveTouches = makeTouches([
        { clientX: 50, clientY: 50 },
        { clientX: 250, clientY: 250 },
      ])
      dispatchTouchMove(carousel.ref.imagesContainer, moveTouches)

      expect(controls.getScale()).toBeGreaterThan(1)
    })

    it('zooms down with pinch contract (fingers moving together)', () => {
      // First zoom in so we can zoom out
      controls.setZoom(3)

      const startTouches = makeTouches([
        { clientX: 50, clientY: 50 },
        { clientX: 250, clientY: 250 },
      ])
      dispatchTouchStart(carousel.ref.imagesContainer, startTouches)

      // Move fingers closer together
      const moveTouches = makeTouches([
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ])
      dispatchTouchMove(carousel.ref.imagesContainer, moveTouches)

      expect(controls.getScale()).toBeLessThan(3)
    })

    it('ends pinch when touches go below 2', () => {
      const touches = makeTouches([
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ])
      dispatchTouchStart(carousel.ref.imagesContainer, touches)
      dispatchTouchEnd(carousel.ref.imagesContainer, [])
      // Should not throw on subsequent touch events
      expect(controls.getScale()).toBeGreaterThanOrEqual(1)
    })

    it('single-finger touch drag pans when zoomed', () => {
      controls.setZoom(2)
      const transformBefore = carousel.img.style.transform

      // Drag left/up so pan goes negative (within the clamped range [-maxPan, 0])
      const singleTouch = makeTouches([{ clientX: 200, clientY: 200 }])
      dispatchTouchStart(carousel.ref.imagesContainer, singleTouch)

      const moveTouch = makeTouches([{ clientX: 100, clientY: 100 }])
      dispatchTouchMove(carousel.ref.imagesContainer, moveTouch)

      expect(carousel.img.style.transform).not.toBe(transformBefore)
    })
  })

  // ==========================================================================
  // Pan boundary clamping
  // ==========================================================================

  describe('pan boundary clamping', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('pan stays at (0,0) when at minZoom', () => {
      controls.setZoom(1)
      expect(carousel.img.style.transform).toContain('translate(0px, 0px)')
    })

    it('clamps pan to valid range when zoomed', () => {
      controls.setZoom(3)

      // Attempt to drag way beyond bounds
      dispatchMouseDown(carousel.ref.imagesContainer, 0, 0)
      dispatchMouseMove(10000, 10000)
      dispatchMouseUp()

      const transform = carousel.img.style.transform
      // The translate values should be clamped (not absurdly large)
      const match = transform.match(
        /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/,
      )
      expect(match).toBeTruthy()

      const panX = parseFloat(match![1])
      const panY = parseFloat(match![2])
      // Pan values should be clamped at 0 (maximum positive direction)
      expect(panX).toBeLessThanOrEqual(0)
      expect(panY).toBeLessThanOrEqual(0)
    })

    it('resets pan when zoom returns to minZoom', () => {
      controls.setZoom(3)
      // Pan the image
      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      dispatchMouseMove(50, 50)
      dispatchMouseUp()

      // Now reset zoom
      controls.resetZoom()
      expect(carousel.img.style.transform).toContain('translate(0px, 0px)')
    })
  })

  // ==========================================================================
  // getScale()
  // ==========================================================================

  describe('getScale()', () => {
    it('returns 1 at initial state', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      expect(controls.getScale()).toBe(1)
    })

    it('returns updated value after setZoom', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2.5)
      expect(controls.getScale()).toBe(2.5)
    })

    it('returns minZoom when setZoom is called below minZoom', () => {
      controls = new ZoomPanControls(
        carousel.ref,
        defaultZoomConfig({ minZoom: 1 }),
      )
      controls.setZoom(0.5)
      expect(controls.getScale()).toBe(1)
    })

    it('returns maxZoom when setZoom is called above maxZoom', () => {
      controls = new ZoomPanControls(
        carousel.ref,
        defaultZoomConfig({ maxZoom: 4 }),
      )
      controls.setZoom(10)
      expect(controls.getScale()).toBe(4)
    })
  })

  // ==========================================================================
  // resetZoom()
  // ==========================================================================

  describe('resetZoom()', () => {
    it('resets zoom to minZoom', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(3)
      controls.resetZoom()
      expect(controls.getScale()).toBe(1)
    })

    it('resets pan to zero', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(3)
      controls.resetZoom()
      expect(carousel.img.style.transform).toContain('translate(0px, 0px)')
    })

    it('removes zoomed class from wrapper', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2)
      expect(carousel.wrapper.classList.contains('zoomed')).toBe(true)

      controls.resetZoom()
      expect(carousel.wrapper.classList.contains('zoomed')).toBe(false)
    })

    it('clears touchAction on imagesContainer', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2)
      expect(carousel.ref.imagesContainer.style.touchAction).toBe('none')

      controls.resetZoom()
      expect(carousel.ref.imagesContainer.style.touchAction).toBe('')
    })

    it('notifies zoom listeners', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      const listener = vi.fn()
      controls.on('zoom', listener)

      controls.setZoom(3)
      listener.mockClear()

      controls.resetZoom()
      expect(listener).toHaveBeenCalledWith(1)
    })
  })

  // ==========================================================================
  // zoomIn() / zoomOut()
  // ==========================================================================

  describe('zoomIn()', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('increments zoom by zoomStep', () => {
      controls.zoomIn()
      expect(controls.getScale()).toBeCloseTo(1.3, 5) // 1 + 0.3
    })

    it('does not exceed maxZoom', () => {
      controls = new ZoomPanControls(
        carousel.ref,
        defaultZoomConfig({ maxZoom: 1.5, zoomStep: 0.3 }),
      )
      controls.zoomIn()
      controls.zoomIn()
      controls.zoomIn()
      expect(controls.getScale()).toBeLessThanOrEqual(1.5)
    })

    it('does nothing when already at maxZoom', () => {
      controls.setZoom(4)
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.zoomIn()
      expect(listener).not.toHaveBeenCalled()
      expect(controls.getScale()).toBe(4)
    })
  })

  describe('zoomOut()', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('decrements zoom by zoomStep', () => {
      controls.setZoom(2)
      controls.zoomOut()
      expect(controls.getScale()).toBeCloseTo(1.7, 5) // 2 - 0.3
    })

    it('does not go below minZoom', () => {
      controls.setZoom(1.1)
      controls.zoomOut()
      expect(controls.getScale()).toBeGreaterThanOrEqual(1)
    })

    it('does nothing when already at minZoom', () => {
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.zoomOut()
      expect(listener).not.toHaveBeenCalled()
      expect(controls.getScale()).toBe(1)
    })
  })

  // ==========================================================================
  // on/off zoom listeners
  // ==========================================================================

  describe('on/off zoom listeners', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('fires listener on zoom change via setZoom', () => {
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.setZoom(2)
      expect(listener).toHaveBeenCalledWith(2)
    })

    it('fires listener on zoomIn', () => {
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.zoomIn()
      expect(listener).toHaveBeenCalledWith(expect.closeTo(1.3, 5))
    })

    it('fires listener on zoomOut', () => {
      controls.setZoom(2)
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.zoomOut()
      expect(listener).toHaveBeenCalledWith(expect.closeTo(1.7, 5))
    })

    it('fires listener on resetZoom', () => {
      controls.setZoom(3)
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.resetZoom()
      expect(listener).toHaveBeenCalledWith(1)
    })

    it('supports multiple listeners', () => {
      const listenerA = vi.fn()
      const listenerB = vi.fn()
      controls.on('zoom', listenerA)
      controls.on('zoom', listenerB)
      controls.setZoom(2)
      expect(listenerA).toHaveBeenCalledWith(2)
      expect(listenerB).toHaveBeenCalledWith(2)
    })

    it('off() removes a specific listener', () => {
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.off('zoom', listener)
      controls.setZoom(2)
      expect(listener).not.toHaveBeenCalled()
    })

    it('off() does not affect other listeners', () => {
      const listenerA = vi.fn()
      const listenerB = vi.fn()
      controls.on('zoom', listenerA)
      controls.on('zoom', listenerB)
      controls.off('zoom', listenerA)
      controls.setZoom(2)
      expect(listenerA).not.toHaveBeenCalled()
      expect(listenerB).toHaveBeenCalledWith(2)
    })

    it('ignores non-zoom event names', () => {
      const listener = vi.fn()
      controls.on('pan', listener)
      controls.setZoom(2)
      expect(listener).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Zoomed state (CSS classes / touchAction)
  // ==========================================================================

  describe('zoomed state', () => {
    beforeEach(() => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
    })

    it('adds "zoomed" class to wrapper when zoom > minZoom', () => {
      controls.setZoom(2)
      expect(carousel.wrapper.classList.contains('zoomed')).toBe(true)
    })

    it('removes "zoomed" class when zoom returns to minZoom', () => {
      controls.setZoom(2)
      controls.setZoom(1)
      expect(carousel.wrapper.classList.contains('zoomed')).toBe(false)
    })

    it('sets touchAction to "none" when zoomed', () => {
      controls.setZoom(2)
      expect(carousel.ref.imagesContainer.style.touchAction).toBe('none')
    })

    it('restores touchAction when zoom returns to minZoom', () => {
      controls.setZoom(2)
      controls.setZoom(1)
      expect(carousel.ref.imagesContainer.style.touchAction).toBe('')
    })
  })

  // ==========================================================================
  // destroy()
  // ==========================================================================

  describe('destroy()', () => {
    it('removes scroll hint from DOM', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.destroy()
      const hint = carousel.ref.mainView.querySelector('.ci-carousel-scroll-hint')
      expect(hint).toBeNull()
    })

    it('clears image transform styles', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2)
      controls.destroy()
      expect(carousel.img.style.transform).toBe('')
      expect(carousel.img.style.transformOrigin).toBe('')
      expect(carousel.img.style.transition).toBe('')
    })

    it('restores touchAction on imagesContainer', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2)
      controls.destroy()
      expect(carousel.ref.imagesContainer.style.touchAction).toBe('')
    })

    it('clears zoom listeners', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      const listener = vi.fn()
      controls.on('zoom', listener)
      controls.destroy()
      // Manually call setZoom after destroy - listener should not fire
      // (zoom listeners array is cleared)
      controls.setZoom(2)
      expect(listener).not.toHaveBeenCalled()
    })

    it('removes wheel event listener from imagesContainer', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.destroy()
      // After destroy, wheel events should not cause zoom changes
      dispatchWheel(carousel.ref.imagesContainer, -100, true)
      // Since currentElement is nulled, the class shouldn't be zoomed
      expect(
        carousel.wrapper.classList.contains('zoomed'),
      ).toBe(false)
    })

    it('removes dblclick event listener from imagesContainer', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.destroy()
      dispatchDblClick(carousel.ref.imagesContainer)
      // Image transform should remain cleared (no zoom applied)
      expect(carousel.img.style.transform).toBe('')
    })

    it('removes mousedown event listener from imagesContainer', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2)
      controls.destroy()
      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      expect(
        carousel.wrapper.classList.contains('ci-carousel-dragging'),
      ).toBe(false)
    })

    it('removes document-level mouse listeners if destroyed mid-drag', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(2)
      dispatchMouseDown(carousel.ref.imagesContainer, 100, 100)
      // Destroy mid-drag
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      controls.destroy()

      const removedTypes = removeSpy.mock.calls.map((c) => c[0])
      expect(removedTypes).toContain('mousemove')
      expect(removedTypes).toContain('mouseup')
    })

    it('clears pending scroll hint timeout', () => {
      vi.useFakeTimers()
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      dispatchWheel(carousel.ref.imagesContainer, -100, false) // show hint
      controls.destroy()

      // Advancing timers should not throw (timeout was cleared)
      expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
      vi.useRealTimers()
    })

    it('is safe to call destroy multiple times', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.destroy()
      expect(() => controls.destroy()).not.toThrow()
    })
  })

  // ==========================================================================
  // initializeVisibleImage()
  // ==========================================================================

  describe('initializeVisibleImage()', () => {
    it('resets zoom and pan when called', () => {
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      controls.setZoom(3)
      controls.initializeVisibleImage()
      expect(controls.getScale()).toBe(1)
      expect(carousel.img.style.transform).toContain('translate(0px, 0px)')
    })

    it('handles missing wrapper gracefully', () => {
      // Remove wrapper children so there is no child at index 0
      while (carousel.ref.imagesContainer.firstChild) {
        carousel.ref.imagesContainer.removeChild(
          carousel.ref.imagesContainer.firstChild,
        )
      }
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      // Should not throw
      expect(() => controls.initializeVisibleImage()).not.toThrow()
    })

    it('handles missing image inside wrapper gracefully', () => {
      // Remove the image from the wrapper
      carousel.img.remove()
      controls = new ZoomPanControls(carousel.ref, defaultZoomConfig())
      expect(() => controls.initializeVisibleImage()).not.toThrow()
    })
  })
})
