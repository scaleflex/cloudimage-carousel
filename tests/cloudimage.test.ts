import { describe, it, expect } from 'vitest'

import { buildCloudimageUrl, getOptimalWidth, roundToLimitFactor } from '../src/utils/cloudimage'
import type { CloudimageConfig } from '../src/core/types'

describe('Cloudimage utilities', () => {
  // ==========================================================================
  // roundToLimitFactor
  // ==========================================================================

  describe('roundToLimitFactor', () => {
    it('rounds up to the nearest limit factor', () => {
      expect(roundToLimitFactor(150, 100)).toBe(200)
    })

    it('returns exact value when already on boundary', () => {
      expect(roundToLimitFactor(400, 100)).toBe(400)
    })

    it('rounds 1 up to the limit factor', () => {
      expect(roundToLimitFactor(1, 100)).toBe(100)
    })

    it('uses default limit factor of 100', () => {
      expect(roundToLimitFactor(250)).toBe(300)
    })

    it('handles custom limit factor', () => {
      expect(roundToLimitFactor(150, 50)).toBe(150)
      expect(roundToLimitFactor(151, 50)).toBe(200)
    })

    it('handles zero', () => {
      expect(roundToLimitFactor(0, 100)).toBe(0)
    })
  })

  // ==========================================================================
  // getOptimalWidth
  // ==========================================================================

  describe('getOptimalWidth', () => {
    it('multiplies container width by DPR', () => {
      expect(getOptimalWidth(400, 2, 1, 100)).toBe(800)
    })

    it('accounts for zoom level', () => {
      expect(getOptimalWidth(400, 1, 2, 100)).toBe(800)
    })

    it('rounds result to limit factor', () => {
      expect(getOptimalWidth(373, 2, 1, 100)).toBe(800)
    })

    it('uses defaults when optional params omitted', () => {
      // 500 * 1 * 1 = 500 → rounded to 500
      expect(getOptimalWidth(500)).toBe(500)
    })

    it('combines DPR, zoom, and limit factor', () => {
      // 373 * 2 * 1.5 = 1119 → rounded to 1200
      expect(getOptimalWidth(373, 2, 1.5, 100)).toBe(1200)
    })
  })

  // ==========================================================================
  // buildCloudimageUrl
  // ==========================================================================

  describe('buildCloudimageUrl', () => {
    const baseConfig: CloudimageConfig = {
      token: 'demo',
    }

    it('builds URL with defaults', () => {
      const url = buildCloudimageUrl('https://example.com/photo.jpg', baseConfig, 400, 1, 1)
      // encodeURI preserves :// and / — only encodes special chars like spaces
      expect(url).toBe('https://demo.cloudimg.io/v7/https://example.com/photo.jpg?width=400')
    })

    it('uses custom domain and API version', () => {
      const config: CloudimageConfig = {
        token: 'mytoken',
        domain: 'cdn.example.com',
        apiVersion: 'v8',
      }
      const url = buildCloudimageUrl('photo.jpg', config, 400, 1, 1)
      expect(url).toContain('https://mytoken.cdn.example.com/v8/')
    })

    it('appends custom params', () => {
      const config: CloudimageConfig = {
        token: 'demo',
        params: 'q=80&org_if_sml=1',
      }
      const url = buildCloudimageUrl('photo.jpg', config, 400, 1, 1)
      expect(url).toContain('&q=80&org_if_sml=1')
    })

    it('accounts for DPR in width calculation', () => {
      const url = buildCloudimageUrl('photo.jpg', baseConfig, 400, 1, 2)
      expect(url).toContain('width=800')
    })

    it('accounts for zoom in width calculation', () => {
      const url = buildCloudimageUrl('photo.jpg', baseConfig, 400, 2, 1)
      expect(url).toContain('width=800')
    })

    it('uses custom limit factor', () => {
      const config: CloudimageConfig = {
        token: 'demo',
        limitFactor: 50,
      }
      // 373 * 1 * 1 = 373 → rounded to 400 with factor 50
      const url = buildCloudimageUrl('photo.jpg', config, 373, 1, 1)
      expect(url).toContain('width=400')
    })
  })
})
