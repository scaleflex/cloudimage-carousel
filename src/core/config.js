import { TRANSITION_EFFECTS } from '../constants/transition.constants'

/**
 * Default configuration values.
 * Mirrors hotspot's DEFAULT_CONFIG pattern.
 */
const DEFAULT_CONFIG = {
  images: [],
  autoplay: false,
  autoplayInterval: 3000,
  cycle: true,
  showFilenames: false,
  showThumbnails: true,
  showBullets: false,
  showControls: true,
  controlsPosition: 'center', // 'center' or 'bottom'
  theme: 'light', // 'light' or 'dark'
  transitionEffect: TRANSITION_EFFECTS.FADE, // 'slide' or 'fade'
}

/**
 * Data attribute → config key mapping with type coercion.
 * Mirrors hotspot's DATA_ATTR_MAP pattern.
 */
const DATA_ATTR_MAP = {
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
}

/**
 * Coerces a string attribute value to the appropriate JS type.
 * @param {string} value - Raw attribute string
 * @param {'string'|'boolean'|'number'|'json'} type - Target type
 * @returns {*} Coerced value
 */
function coerceValue(value, type) {
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
      } catch (e) {
        console.warn(`[CloudImageCarousel] Invalid JSON in data attribute: "${value}"`)
        return undefined
      }
    default:
      return value
  }
}

/**
 * Parses data-ci-carousel-* attributes from an element into a config object.
 * @param {HTMLElement} element
 * @returns {Object} Partial config object
 */
function parseDataAttributes(element) {
  const config = {}

  for (const [attr, mapping] of Object.entries(DATA_ATTR_MAP)) {
    const value = element.getAttribute(attr)
    if (value === null) continue

    const parsed = coerceValue(value, mapping.type)
    if (parsed !== undefined) {
      config[mapping.key] = parsed
    }
  }

  return config
}

/**
 * Merges config: defaults → data attributes → JS options.
 * Immutable — returns a new object, never mutates input.
 * Mirrors hotspot's mergeConfig() pattern.
 * @param {Object} dataConfig - Parsed data attributes
 * @param {Object} userConfig - JS options passed to constructor
 * @returns {Object} Resolved config
 */
function mergeConfig(dataConfig, userConfig) {
  return {
    ...DEFAULT_CONFIG,
    ...dataConfig,
    ...userConfig,
    images: userConfig.images || dataConfig.images || DEFAULT_CONFIG.images,
  }
}

/**
 * Validates the resolved config. Warns on invalid values.
 * Mirrors hotspot's validateConfig() pattern.
 * @param {Object} config - Resolved config object
 */
function validateConfig(config) {
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

  if (!['center', 'bottom'].includes(config.controlsPosition)) {
    console.warn(
      `[CloudImageCarousel] Invalid controlsPosition "${config.controlsPosition}". Using "${DEFAULT_CONFIG.controlsPosition}".`,
    )
    config.controlsPosition = DEFAULT_CONFIG.controlsPosition
  }

  if (!['light', 'dark'].includes(config.theme)) {
    console.warn(`[CloudImageCarousel] Invalid theme "${config.theme}". Using "${DEFAULT_CONFIG.theme}".`)
    config.theme = DEFAULT_CONFIG.theme
  }

  if (typeof config.autoplayInterval !== 'number' || config.autoplayInterval < 100) {
    console.warn('[CloudImageCarousel] autoplayInterval must be a number >= 100. Using 3000.')
    config.autoplayInterval = 3000
  }
}

export { DEFAULT_CONFIG, DATA_ATTR_MAP, parseDataAttributes, mergeConfig, validateConfig }
