import { describe, it, expect, beforeEach, vi } from 'vitest'

import { mergeConfig, parseDataAttributes, validateConfig, DEFAULT_CONFIG } from '../src/core/config'
import type { ResolvedConfig } from '../src/core/config'

describe('mergeConfig', () => {
  it('returns defaults when no overrides provided', () => {
    const result = mergeConfig({}, {})
    expect(result).toEqual(DEFAULT_CONFIG)
  })

  it('user config overrides data attributes', () => {
    const dataConfig = { autoplay: true, theme: 'dark' as const }
    const userConfig = { theme: 'light' as const }
    const result = mergeConfig(dataConfig, userConfig)
    expect(result.autoplay).toBe(true)
    expect(result.theme).toBe('light')
  })

  it('user config images take priority over data attribute images', () => {
    const dataConfig = { images: ['data-img.jpg'] }
    const userConfig = { images: ['user-img.jpg'] }
    const result = mergeConfig(dataConfig, userConfig)
    expect(result.images).toEqual(['user-img.jpg'])
  })

  it('falls back to data config images when user config has none', () => {
    const dataConfig = { images: ['data-img.jpg'] }
    const result = mergeConfig(dataConfig, {})
    expect(result.images).toEqual(['data-img.jpg'])
  })

  it('deep-merges cloudimage config', () => {
    const dataConfig = { cloudimage: { token: 'abc', apiVersion: 'v7' } }
    const userConfig = { cloudimage: { token: 'xyz' } }
    const result = mergeConfig(dataConfig, userConfig)
    expect(result.cloudimage).toEqual({ token: 'xyz', apiVersion: 'v7' })
  })

  it('does not mutate input objects', () => {
    const dataConfig = { autoplay: true }
    const userConfig = { theme: 'dark' as const }
    const dataCopy = { ...dataConfig }
    const userCopy = { ...userConfig }
    mergeConfig(dataConfig, userConfig)
    expect(dataConfig).toEqual(dataCopy)
    expect(userConfig).toEqual(userCopy)
  })
})

describe('validateConfig', () => {
  let config: ResolvedConfig

  beforeEach(() => {
    config = { ...DEFAULT_CONFIG }
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('accepts valid config without warnings', () => {
    validateConfig(config)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('fixes non-array images', () => {
    ;(config as any).images = 'not-an-array'
    const result = validateConfig(config)
    expect(result.images).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('fixes invalid transitionEffect', () => {
    ;(config as any).transitionEffect = 'invalid'
    const result = validateConfig(config)
    expect(result.transitionEffect).toBe(DEFAULT_CONFIG.transitionEffect)
  })

  it('fixes invalid controlsPosition', () => {
    ;(config as any).controlsPosition = 'left'
    const result = validateConfig(config)
    expect(result.controlsPosition).toBe(DEFAULT_CONFIG.controlsPosition)
  })

  it('fixes invalid theme', () => {
    ;(config as any).theme = 'neon'
    const result = validateConfig(config)
    expect(result.theme).toBe(DEFAULT_CONFIG.theme)
  })

  it('fixes autoplayInterval below 100', () => {
    config.autoplayInterval = 50
    const result = validateConfig(config)
    expect(result.autoplayInterval).toBe(3000)
  })

  it('fixes non-number autoplayInterval', () => {
    ;(config as any).autoplayInterval = 'fast'
    const result = validateConfig(config)
    expect(result.autoplayInterval).toBe(3000)
  })

  it('fixes zoomMin below 0.1', () => {
    config.zoomMin = 0
    const result = validateConfig(config)
    expect(result.zoomMin).toBe(1)
  })

  it('fixes zoomMax less than zoomMin', () => {
    config.zoomMin = 2
    config.zoomMax = 1
    const result = validateConfig(config)
    expect(result.zoomMax).toBe(4)
  })

  it('fixes non-positive zoomStep', () => {
    config.zoomStep = 0
    const result = validateConfig(config)
    expect(result.zoomStep).toBe(0.3)
  })

  it('removes cloudimage config without token', () => {
    ;(config as any).cloudimage = { apiVersion: 'v7' }
    const result = validateConfig(config)
    expect(result.cloudimage).toBeUndefined()
  })

  it('keeps cloudimage config with token', () => {
    ;(config as any).cloudimage = { token: 'demo', apiVersion: 'v7' }
    const result = validateConfig(config)
    expect(result.cloudimage).toEqual({ token: 'demo', apiVersion: 'v7' })
  })
})

describe('parseDataAttributes', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = document.createElement('div')
  })

  it('returns empty object when no data attributes', () => {
    expect(parseDataAttributes(el)).toEqual({})
  })

  it('parses JSON images attribute', () => {
    el.setAttribute('data-ci-carousel-images', '["img1.jpg","img2.jpg"]')
    const result = parseDataAttributes(el)
    expect(result.images).toEqual(['img1.jpg', 'img2.jpg'])
  })

  it('parses boolean attributes', () => {
    el.setAttribute('data-ci-carousel-autoplay', 'true')
    el.setAttribute('data-ci-carousel-cycle', 'false')
    const result = parseDataAttributes(el)
    expect(result.autoplay).toBe(true)
    expect(result.cycle).toBe(false)
  })

  it('parses number attributes', () => {
    el.setAttribute('data-ci-carousel-autoplay-interval', '5000')
    el.setAttribute('data-ci-carousel-zoom-max', '8')
    const result = parseDataAttributes(el)
    expect(result.autoplayInterval).toBe(5000)
    expect(result.zoomMax).toBe(8)
  })

  it('parses string attributes', () => {
    el.setAttribute('data-ci-carousel-theme', 'dark')
    el.setAttribute('data-ci-carousel-controls-position', 'bottom')
    const result = parseDataAttributes(el)
    expect(result.theme).toBe('dark')
    expect(result.controlsPosition).toBe('bottom')
  })

  it('parses nested cloudimage attributes', () => {
    el.setAttribute('data-ci-carousel-ci-token', 'mytoken')
    el.setAttribute('data-ci-carousel-ci-api-version', 'v7')
    const result = parseDataAttributes(el)
    expect(result.cloudimage).toEqual({ token: 'mytoken', apiVersion: 'v7' })
  })

  it('handles invalid JSON gracefully', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    el.setAttribute('data-ci-carousel-images', 'not-json')
    const result = parseDataAttributes(el)
    expect(result.images).toBeUndefined()
  })

  it('handles invalid number gracefully', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    el.setAttribute('data-ci-carousel-zoom-max', 'abc')
    const result = parseDataAttributes(el)
    expect(result.zoomMax).toBeUndefined()
  })
})
