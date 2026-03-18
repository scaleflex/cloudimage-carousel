import { TRANSITION_EFFECTS } from '../constants/transition.constants'

import type {
  CloudImageCarouselConfig,
  CloudimageConfig,
  ControlsPosition,
  ImageSource,
  Theme,
  TransitionEffect,
} from './types'

// ==========================================================================
// Resolved config — all fields required (after merge with defaults)
// ==========================================================================

export interface ResolvedConfig {
  images: ImageSource[]
  autoplay: boolean
  autoplayInterval: number
  cycle: boolean
  showFilenames: boolean
  showThumbnails: boolean
  showBullets: boolean
  showControls: boolean
  controlsPosition: ControlsPosition
  theme: Theme
  transitionEffect: TransitionEffect
  zoomMin: number
  zoomMax: number
  zoomStep: number
  onSlideChange?: (index: number) => void
  onError?: (src: string, index: number) => void
  cloudimage?: CloudimageConfig
}

// ==========================================================================
// Defaults
// ==========================================================================

const DEFAULT_CONFIG: ResolvedConfig = {
  images: [],
  autoplay: false,
  autoplayInterval: 3000,
  cycle: true,
  showFilenames: false,
  showThumbnails: true,
  showBullets: false,
  showControls: true,
  controlsPosition: 'center',
  theme: 'light',
  transitionEffect: TRANSITION_EFFECTS.FADE as TransitionEffect,
  zoomMin: 1,
  zoomMax: 4,
  zoomStep: 0.3,
}

// ==========================================================================
// Data attribute parsing
// ==========================================================================

type CoercionType = 'string' | 'boolean' | 'number' | 'json'

interface DataAttrMapping {
  key: string
  type: CoercionType
  nested?: string
}

const DATA_ATTR_MAP: Record<string, DataAttrMapping> = {
  'data-ci-carousel-images': { key: 'images', type: 'json' },
  'data-ci-carousel-autoplay': { key: 'autoplay', type: 'boolean' },
  'data-ci-carousel-autoplay-interval': { key: 'autoplayInterval', type: 'number' },
  'data-ci-carousel-cycle': { key: 'cycle', type: 'boolean' },
  'data-ci-carousel-show-filenames': { key: 'showFilenames', type: 'boolean' },
  'data-ci-carousel-show-thumbnails': { key: 'showThumbnails', type: 'boolean' },
  'data-ci-carousel-show-bullets': { key: 'showBullets', type: 'boolean' },
  'data-ci-carousel-show-controls': { key: 'showControls', type: 'boolean' },
  'data-ci-carousel-controls-position': { key: 'controlsPosition', type: 'string' },
  'data-ci-carousel-theme': { key: 'theme', type: 'string' },
  'data-ci-carousel-transition': { key: 'transitionEffect', type: 'string' },
  'data-ci-carousel-zoom-min': { key: 'zoomMin', type: 'number' },
  'data-ci-carousel-zoom-max': { key: 'zoomMax', type: 'number' },
  'data-ci-carousel-zoom-step': { key: 'zoomStep', type: 'number' },
  'data-ci-carousel-ci-token': { key: 'token', type: 'string', nested: 'cloudimage' },
  'data-ci-carousel-ci-api-version': { key: 'apiVersion', type: 'string', nested: 'cloudimage' },
  'data-ci-carousel-ci-domain': { key: 'domain', type: 'string', nested: 'cloudimage' },
  'data-ci-carousel-ci-limit-factor': { key: 'limitFactor', type: 'number', nested: 'cloudimage' },
  'data-ci-carousel-ci-params': { key: 'params', type: 'string', nested: 'cloudimage' },
}

function coerceValue(value: string, type: CoercionType): unknown {
  switch (type) {
    case 'boolean':
      return value === 'true'
    case 'number': {
      const n = parseFloat(value)
      if (isNaN(n)) {
        console.warn(`[CloudImageCarousel] Invalid number value: "${value}"`)
        return undefined
      }
      return n
    }
    case 'json':
      try {
        return JSON.parse(value)
      } catch {
        console.warn(`[CloudImageCarousel] Invalid JSON in data attribute: "${value}"`)
        return undefined
      }
    default:
      return value
  }
}

/**
 * Parses data-ci-carousel-* attributes from an element into a partial config.
 */
export function parseDataAttributes(element: HTMLElement): Partial<CloudImageCarouselConfig> {
  const config: Record<string, unknown> = {}
  const cloudimage: Record<string, unknown> = {}

  for (const [attr, mapping] of Object.entries(DATA_ATTR_MAP)) {
    const value = element.getAttribute(attr)
    if (value === null) continue

    const parsed = coerceValue(value, mapping.type)
    if (parsed !== undefined) {
      if (mapping.nested === 'cloudimage') {
        cloudimage[mapping.key] = parsed
      } else {
        config[mapping.key] = parsed
      }
    }
  }

  if (Object.keys(cloudimage).length > 0) {
    config.cloudimage = cloudimage as unknown as CloudimageConfig
  }

  return config as Partial<CloudImageCarouselConfig>
}

/**
 * Merges config: defaults → data attributes → JS options.
 * Immutable — returns a new object, never mutates input.
 */
export function mergeConfig(
  dataConfig: Partial<CloudImageCarouselConfig>,
  userConfig: Partial<CloudImageCarouselConfig>,
): ResolvedConfig {
  // Deep-merge cloudimage sub-object (user config wins over data attributes)
  const cloudimage =
    dataConfig.cloudimage || userConfig.cloudimage
      ? { ...dataConfig.cloudimage, ...userConfig.cloudimage }
      : undefined

  return {
    ...DEFAULT_CONFIG,
    ...dataConfig,
    ...userConfig,
    images: userConfig.images || dataConfig.images || DEFAULT_CONFIG.images,
    ...(cloudimage ? { cloudimage } : {}),
  } as ResolvedConfig
}

/**
 * Validates the resolved config. Warns and fixes invalid values in place.
 */
export function validateConfig(config: ResolvedConfig): void {
  if (!Array.isArray(config.images)) {
    console.warn('[CloudImageCarousel] "images" must be an array')
    config.images = []
  }

  const validTransitions = Object.values(TRANSITION_EFFECTS)
  if (!validTransitions.includes(config.transitionEffect)) {
    console.warn(
      `[CloudImageCarousel] Invalid transitionEffect "${config.transitionEffect}". Using "${DEFAULT_CONFIG.transitionEffect}".`,
    )
    config.transitionEffect = DEFAULT_CONFIG.transitionEffect
  }

  if (!(['center', 'bottom'] as ControlsPosition[]).includes(config.controlsPosition)) {
    console.warn(
      `[CloudImageCarousel] Invalid controlsPosition "${config.controlsPosition}". Using "${DEFAULT_CONFIG.controlsPosition}".`,
    )
    config.controlsPosition = DEFAULT_CONFIG.controlsPosition
  }

  if (!(['light', 'dark'] as Theme[]).includes(config.theme)) {
    console.warn(`[CloudImageCarousel] Invalid theme "${config.theme}". Using "${DEFAULT_CONFIG.theme}".`)
    config.theme = DEFAULT_CONFIG.theme
  }

  if (typeof config.autoplayInterval !== 'number' || config.autoplayInterval < 100) {
    console.warn('[CloudImageCarousel] autoplayInterval must be a number >= 100. Using 3000.')
    config.autoplayInterval = 3000
  }

  if (typeof config.zoomMin !== 'number' || config.zoomMin < 0.1) {
    console.warn('[CloudImageCarousel] zoomMin must be a number >= 0.1. Using 1.')
    config.zoomMin = 1
  }

  if (typeof config.zoomMax !== 'number' || config.zoomMax < config.zoomMin) {
    console.warn(`[CloudImageCarousel] zoomMax must be a number >= zoomMin (${config.zoomMin}). Using 4.`)
    config.zoomMax = 4
  }

  if (typeof config.zoomStep !== 'number' || config.zoomStep <= 0) {
    console.warn('[CloudImageCarousel] zoomStep must be a positive number. Using 0.3.')
    config.zoomStep = 0.3
  }

  const ci = (config as ResolvedConfig & { cloudimage?: CloudimageConfig }).cloudimage
  if (ci && !ci.token) {
    console.warn('[CloudImageCarousel] cloudimage config provided without "token". Cloudimage CDN will be disabled.')
    ;(config as ResolvedConfig & { cloudimage?: CloudimageConfig }).cloudimage = undefined
  }
}

export { DEFAULT_CONFIG, DATA_ATTR_MAP }
