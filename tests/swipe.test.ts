import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

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

describe('SwipeControls', () => {
  let carousel: ReturnType<typeof createMockCarousel>
  let swipe: SwipeControls
  let nowSpy: MockInstance
  let mockNow: number

  beforeEach(() => {
    mockNow = 1000
    nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => mockNow)
    carousel = createMockCarousel()
    swipe = new SwipeControls(carousel)
  })

  afterEach(() => {
    swipe.destroy()
    carousel.imagesContainer.remove()
  })

  function simulateSwipe(
    element: HTMLElement,
    startX: number,
    endX: number,
    duration: number = 50,
  ): void {
    // Ensure spy returns current mockNow for touchStart timestamp
    nowSpy.mockReturnValue(mockNow)

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: startX, clientY: 100, identifier: 0 } as Touch],
      bubbles: true,
    })
    element.dispatchEvent(touchStart)

    // Advance mock time for velocity calculation
    mockNow += duration
    nowSpy.mockReturnValue(mockNow)

    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: endX, clientY: 100, identifier: 0 } as Touch],
      bubbles: true,
    })
    element.dispatchEvent(touchEnd)
  }

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

  it('ignores slow swipes below velocity threshold', () => {
    // 60px over 500ms = 0.12 px/ms, below SWIPE_MIN_VELOCITY of 0.65
    simulateSwipe(carousel.imagesContainer, 200, 140, 500)
    expect(carousel.next).not.toHaveBeenCalled()
    expect(carousel.prev).not.toHaveBeenCalled()
  })

  it('respects swipe cooldown', () => {
    simulateSwipe(carousel.imagesContainer, 200, 50, 50)
    expect(carousel.next).toHaveBeenCalledTimes(1)

    // Second swipe within 250ms cooldown — should be blocked
    mockNow += 100 // only 100ms since last swipe
    simulateSwipe(carousel.imagesContainer, 200, 50, 50)
    expect(carousel.next).toHaveBeenCalledTimes(1)

    // Third swipe after cooldown — should work
    mockNow += 300 // now well past 250ms cooldown
    simulateSwipe(carousel.imagesContainer, 200, 50, 50)
    expect(carousel.next).toHaveBeenCalledTimes(2)
  })

  it('cleans up on destroy', () => {
    swipe.destroy()
    simulateSwipe(carousel.imagesContainer, 200, 50, 50)
    expect(carousel.next).not.toHaveBeenCalled()
  })
})
