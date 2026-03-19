import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { SwipeControls } from '../src/controls/swipe.controls'

function createMockCarousel() {
  const imagesContainer = document.createElement('div')
  document.body.appendChild(imagesContainer)

  return {
    imagesContainer,
    zoomPanControls: null,
    next: vi.fn(),
    prev: vi.fn(),
  }
}

function simulateSwipe(
  element: HTMLElement,
  startX: number,
  endX: number,
  duration: number = 50,
): void {
  const touchStart = new TouchEvent('touchstart', {
    touches: [{ clientX: startX, clientY: 100, identifier: 0 } as Touch],
    bubbles: true,
  })
  element.dispatchEvent(touchStart)

  // Advance time to simulate swipe duration
  vi.advanceTimersByTime(duration)

  const touchEnd = new TouchEvent('touchend', {
    changedTouches: [{ clientX: endX, clientY: 100, identifier: 0 } as Touch],
    bubbles: true,
  })
  element.dispatchEvent(touchEnd)
}

describe('SwipeControls', () => {
  let carousel: ReturnType<typeof createMockCarousel>
  let swipe: SwipeControls

  beforeEach(() => {
    vi.useFakeTimers()
    carousel = createMockCarousel()
    swipe = new SwipeControls(carousel)
  })

  afterEach(() => {
    swipe.destroy()
    carousel.imagesContainer.remove()
    vi.useRealTimers()
  })

  it('creates without throwing', () => {
    expect(swipe).toBeDefined()
  })

  it('calls next() on left swipe (negative deltaX)', () => {
    simulateSwipe(carousel.imagesContainer, 200, 50, 50)
    expect(carousel.next).toHaveBeenCalled()
  })

  it('calls prev() on right swipe (positive deltaX)', () => {
    simulateSwipe(carousel.imagesContainer, 50, 200, 50)
    expect(carousel.prev).toHaveBeenCalled()
  })

  it('ignores swipes below threshold', () => {
    simulateSwipe(carousel.imagesContainer, 100, 80, 50) // 20px < 50px threshold
    expect(carousel.next).not.toHaveBeenCalled()
    expect(carousel.prev).not.toHaveBeenCalled()
  })

  it('cleans up on destroy', () => {
    swipe.destroy()
    simulateSwipe(carousel.imagesContainer, 200, 50, 50)
    expect(carousel.next).not.toHaveBeenCalled()
  })
})
