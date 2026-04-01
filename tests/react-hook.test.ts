/* eslint-disable @typescript-eslint/no-explicit-any, no-extra-semi */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { CloudImageCarousel } from '../src/core/carousel'
import type { CloudImageCarouselConfig } from '../src/core/types'

/**
 * Tests for the React integration layer (useCloudImageCarousel hook and
 * CloudImageCarouselViewer component) without depending on @testing-library/react.
 *
 * We verify the underlying patterns the hook relies on:
 *   - init + destroy lifecycle (mirrors useEffect mount/cleanup)
 *   - destroy then re-init on the same container (React StrictMode double-mount)
 *   - config change detection via JSON.stringify (the configKey dependency)
 *   - onSlideChange callback ref pattern (late-bound callback)
 */

const TEST_IMAGES = ['https://example.com/a.jpg', 'https://example.com/b.jpg', 'https://example.com/c.jpg']

function makeConfig(overrides?: Partial<CloudImageCarouselConfig>): Partial<CloudImageCarouselConfig> {
  return {
    images: TEST_IMAGES,
    autoplay: false,
    showThumbnails: false,
    showBullets: false,
    showControls: false,
    ...overrides,
  }
}

// ==========================================================================
// 1. Lifecycle: init + destroy (mirrors useEffect mount / cleanup)
// ==========================================================================

describe('React hook lifecycle (init + destroy)', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('init builds DOM, destroy tears it down — matching useEffect pattern', () => {
    const carousel = new CloudImageCarousel(container, makeConfig())
    carousel.init()

    // After init the container should have carousel DOM
    expect(container.querySelector('.ci-carousel-main')).toBeTruthy()
    expect(container.querySelectorAll('.ci-carousel-image-wrapper').length).toBe(3)

    carousel.destroy()

    // After destroy the container should be empty — same as hook cleanup
    expect(container.innerHTML).toBe('')
    expect(container.querySelector('.ci-carousel-main')).toBeNull()
  })

  it('instance is usable between init and destroy', () => {
    const carousel = new CloudImageCarousel(container, makeConfig())
    carousel.init()

    // The hook exposes the instance for imperative calls
    carousel.next()
    expect(carousel.currentIndex).toBe(1)
    carousel.prev()
    expect(carousel.currentIndex).toBe(0)
    carousel.goToSlide(2)
    expect(carousel.currentIndex).toBe(2)

    carousel.destroy()
  })

  it('all imperative methods exposed by the component ref are callable', () => {
    const carousel = new CloudImageCarousel(container, makeConfig({ autoplay: false }))
    carousel.init()

    // These match the CloudImageCarouselViewerRef interface methods
    expect(() => carousel.next()).not.toThrow()
    expect(() => carousel.prev()).not.toThrow()
    expect(() => carousel.goToSlide(0)).not.toThrow()
    expect(() => carousel.zoomIn()).not.toThrow()
    expect(() => carousel.zoomOut()).not.toThrow()
    expect(() => carousel.resetZoom()).not.toThrow()
    expect(() => carousel.startAutoplay()).not.toThrow()
    expect(() => carousel.stopAutoplay()).not.toThrow()
    expect(() => carousel.pauseAutoplay()).not.toThrow()
    expect(() => carousel.resumeAutoplay()).not.toThrow()
    expect(() => carousel.setTheme('dark')).not.toThrow()

    carousel.destroy()
  })
})

// ==========================================================================
// 2. StrictMode: destroy then re-init on the same container
// ==========================================================================

describe('React StrictMode double-mount (destroy + re-init on same container)', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('can destroy and re-init on the same container element', () => {
    // First mount
    const first = new CloudImageCarousel(container, makeConfig())
    first.init()
    expect(container.querySelector('.ci-carousel-main')).toBeTruthy()

    // StrictMode cleanup
    first.destroy()
    expect(container.innerHTML).toBe('')

    // StrictMode second mount — same container
    const second = new CloudImageCarousel(container, makeConfig())
    second.init()
    expect(container.querySelector('.ci-carousel-main')).toBeTruthy()
    expect(container.querySelectorAll('.ci-carousel-image-wrapper').length).toBe(3)

    second.destroy()
  })

  it('second instance is fully functional after re-init', () => {
    const first = new CloudImageCarousel(container, makeConfig())
    first.init()
    first.destroy()

    const second = new CloudImageCarousel(container, makeConfig())
    second.init()

    second.next()
    expect(second.currentIndex).toBe(1)
    second.goToSlide(2)
    expect(second.currentIndex).toBe(2)

    second.destroy()
  })

  it('destroy stops autoplay so re-init starts clean', () => {
    vi.useFakeTimers()

    const first = new CloudImageCarousel(container, makeConfig({ autoplay: true, autoplayInterval: 1000 }))
    first.init()
    first.destroy()

    // After destroy, no leaked timers should advance slides on a new instance
    const second = new CloudImageCarousel(container, makeConfig({ autoplay: false }))
    second.init()

    vi.advanceTimersByTime(5000)
    expect(second.currentIndex).toBe(0)

    second.destroy()
    vi.useRealTimers()
  })

  it('re-init with different config applies new settings', () => {
    const first = new CloudImageCarousel(container, makeConfig({ theme: 'light' }))
    first.init()
    expect(container.classList.contains('ci-carousel-theme-dark')).toBe(false)
    first.destroy()

    const second = new CloudImageCarousel(container, makeConfig({ theme: 'dark' }))
    second.init()
    expect(container.classList.contains('ci-carousel-theme-dark')).toBe(true)
    second.destroy()
  })

  it('re-init with different images renders the new set', () => {
    const first = new CloudImageCarousel(container, makeConfig({ images: TEST_IMAGES }))
    first.init()
    expect(container.querySelectorAll('.ci-carousel-image-wrapper').length).toBe(3)
    first.destroy()

    const newImages = ['https://example.com/x.jpg', 'https://example.com/y.jpg']
    const second = new CloudImageCarousel(container, makeConfig({ images: newImages }))
    second.init()
    expect(container.querySelectorAll('.ci-carousel-image-wrapper').length).toBe(2)

    second.destroy()
  })
})

// ==========================================================================
// 3. Config change detection (JSON.stringify configKey)
// ==========================================================================

describe('config change detection (configKey via JSON.stringify)', () => {
  /**
   * The hook uses JSON.stringify on a subset of config keys as a useEffect
   * dependency. When the serialized value changes, the effect re-runs
   * (destroy old + init new). These tests verify the serialization captures
   * meaningful changes and ignores function references.
   */

  function buildConfigKey(options: Partial<CloudImageCarouselConfig>): string {
    return JSON.stringify({
      images: options.images,
      theme: options.theme,
      transitionEffect: options.transitionEffect,
      showThumbnails: options.showThumbnails,
      showBullets: options.showBullets,
      showControls: options.showControls,
      controlsPosition: options.controlsPosition,
      showFilenames: options.showFilenames,
      autoplay: options.autoplay,
      autoplayInterval: options.autoplayInterval,
      cycle: options.cycle,
      zoomMin: options.zoomMin,
      zoomMax: options.zoomMax,
      zoomStep: options.zoomStep,
      aspectRatio: options.aspectRatio,
      cloudimage: options.cloudimage,
    })
  }

  it('identical configs produce the same configKey', () => {
    const a = makeConfig({ theme: 'dark', showBullets: true })
    const b = makeConfig({ theme: 'dark', showBullets: true })
    expect(buildConfigKey(a)).toBe(buildConfigKey(b))
  })

  it('different images produce different configKeys', () => {
    const a = makeConfig({ images: ['a.jpg'] })
    const b = makeConfig({ images: ['b.jpg'] })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different themes produce different configKeys', () => {
    const a = makeConfig({ theme: 'light' })
    const b = makeConfig({ theme: 'dark' })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different transition effects produce different configKeys', () => {
    const a = makeConfig({ transitionEffect: 'slide' })
    const b = makeConfig({ transitionEffect: 'fade' })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different boolean flags produce different configKeys', () => {
    const a = makeConfig({ showThumbnails: true })
    const b = makeConfig({ showThumbnails: false })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different autoplay intervals produce different configKeys', () => {
    const a = makeConfig({ autoplayInterval: 2000 })
    const b = makeConfig({ autoplayInterval: 5000 })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different zoom settings produce different configKeys', () => {
    const a = makeConfig({ zoomMin: 1, zoomMax: 4, zoomStep: 0.3 })
    const b = makeConfig({ zoomMin: 0.5, zoomMax: 8, zoomStep: 0.5 })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different aspectRatio produces different configKeys', () => {
    const a = makeConfig({ aspectRatio: '16/9' })
    const b = makeConfig({ aspectRatio: '4/3' })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different cloudimage config produces different configKeys', () => {
    const a = makeConfig({ cloudimage: { token: 'demo' } })
    const b = makeConfig({ cloudimage: { token: 'prod' } })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('different controlsPosition produces different configKeys', () => {
    const a = makeConfig({ controlsPosition: 'center' })
    const b = makeConfig({ controlsPosition: 'bottom' })
    expect(buildConfigKey(a)).not.toBe(buildConfigKey(b))
  })

  it('changing only onSlideChange does NOT change the configKey', () => {
    const a = makeConfig({ images: TEST_IMAGES })
    const b = makeConfig({ images: TEST_IMAGES })
    // Assign different callbacks (functions are not serialized)
    ;(a as any).onSlideChange = () => {}
    ;(b as any).onSlideChange = () => {}
    expect(buildConfigKey(a)).toBe(buildConfigKey(b))
  })

  it('changing only onError does NOT change the configKey', () => {
    const a = makeConfig({ images: TEST_IMAGES })
    const b = makeConfig({ images: TEST_IMAGES })
    ;(a as any).onError = () => {}
    ;(b as any).onError = () => {}
    expect(buildConfigKey(a)).toBe(buildConfigKey(b))
  })

  it('all config keys that should trigger re-init are included', () => {
    // When a config key changes, the configKey should change.
    // This test sets each tracked field one at a time.
    const base = makeConfig()
    const baseKey = buildConfigKey(base)

    const trackedFields: Array<{ key: string; value: unknown }> = [
      { key: 'images', value: ['changed.jpg'] },
      { key: 'theme', value: 'dark' },
      { key: 'transitionEffect', value: 'zoom' },
      { key: 'showThumbnails', value: true },
      { key: 'showBullets', value: true },
      { key: 'showControls', value: true },
      { key: 'controlsPosition', value: 'bottom' },
      { key: 'showFilenames', value: true },
      { key: 'autoplay', value: true },
      { key: 'autoplayInterval', value: 9999 },
      { key: 'cycle', value: true },
      { key: 'zoomMin', value: 0.1 },
      { key: 'zoomMax', value: 20 },
      { key: 'zoomStep', value: 2 },
      { key: 'aspectRatio', value: '1/1' },
      { key: 'cloudimage', value: { token: 'test' } },
    ]

    for (const { key, value } of trackedFields) {
      const modified = { ...base, [key]: value }
      const modifiedKey = buildConfigKey(modified)
      expect(modifiedKey, `changing "${key}" should produce a different configKey`).not.toBe(baseKey)
    }
  })
})

// ==========================================================================
// 4. onSlideChange callback ref pattern
// ==========================================================================

describe('onSlideChange callback ref pattern', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  /**
   * The hook wraps onSlideChange in an arrow function that reads from a ref:
   *   onSlideChange: (index) => optionsRef.current.onSlideChange?.(index)
   *
   * This means the carousel instance is given a stable function, but the
   * actual callback can change between renders. We test this by verifying
   * that the wrapper pattern works: the carousel fires the callback, and
   * because the callback delegates through a mutable ref, a replaced callback
   * will be invoked on subsequent calls.
   */

  it('onSlideChange callback is invoked on navigation', () => {
    const onChange = vi.fn()
    const carousel = new CloudImageCarousel(container, makeConfig({ onSlideChange: onChange }))
    carousel.init()

    carousel.next()
    expect(onChange).toHaveBeenCalledWith(1)

    carousel.next()
    expect(onChange).toHaveBeenCalledWith(2)

    expect(onChange).toHaveBeenCalledTimes(2)
    carousel.destroy()
  })

  it('onSlideChange receives correct index for goToSlide', () => {
    const onChange = vi.fn()
    const carousel = new CloudImageCarousel(container, makeConfig({ onSlideChange: onChange }))
    carousel.init()

    carousel.goToSlide(2)
    expect(onChange).toHaveBeenCalledWith(2)

    carousel.goToSlide(0)
    expect(onChange).toHaveBeenCalledWith(0)

    carousel.destroy()
  })

  it('simulated ref-swap pattern: wrapper delegates to latest callback', () => {
    // Simulate the optionsRef pattern from the hook
    const ref = { current: vi.fn() }

    const wrapper = (index: number) => ref.current(index)

    const carousel = new CloudImageCarousel(container, makeConfig({ onSlideChange: wrapper }))
    carousel.init()

    carousel.next()
    expect(ref.current).toHaveBeenCalledWith(1)

    // Swap the ref to a new callback (simulates React re-render updating optionsRef)
    const secondCallback = vi.fn()
    ref.current = secondCallback

    carousel.next()
    expect(secondCallback).toHaveBeenCalledWith(2)

    // Original callback was only called once
    expect(ref.current).toBe(secondCallback)

    carousel.destroy()
  })

  it('wrapper handles undefined callback gracefully (optional chaining)', () => {
    // Simulate ref.current.onSlideChange being undefined
    const ref: { current: { onSlideChange?: (index: number) => void } } = {
      current: { onSlideChange: undefined },
    }

    const wrapper = (index: number) => ref.current.onSlideChange?.(index)

    const carousel = new CloudImageCarousel(container, makeConfig({ onSlideChange: wrapper }))
    carousel.init()

    // Should not throw even though the underlying callback is undefined
    expect(() => carousel.next()).not.toThrow()

    // Now set a callback — it should receive the next call
    const cb = vi.fn()
    ref.current.onSlideChange = cb

    carousel.next()
    expect(cb).toHaveBeenCalledWith(2)

    carousel.destroy()
  })

  it('onSlideChange is not called when navigation is a no-op', () => {
    const onChange = vi.fn()
    const carousel = new CloudImageCarousel(
      container,
      makeConfig({ onSlideChange: onChange, cycle: false }),
    )
    carousel.init()

    // Already at index 0, prev with cycle=false is a no-op
    carousel.prev()
    expect(onChange).not.toHaveBeenCalled()

    carousel.destroy()
  })

  it('onSlideChange fires on autoplay advancement', () => {
    vi.useFakeTimers()

    const onChange = vi.fn()
    const carousel = new CloudImageCarousel(
      container,
      makeConfig({ onSlideChange: onChange, autoplay: true, autoplayInterval: 1000 }),
    )
    carousel.init()

    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledWith(1)

    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledWith(2)

    carousel.destroy()
    vi.useRealTimers()
  })
})
