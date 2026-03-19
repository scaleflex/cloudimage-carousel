import { THUMBNAIL_ALIGNMENT, THUMBNAIL_FIT_MODE } from '../constants/thumbnails.contants'
import { TRANSITION_EFFECTS } from '../constants/transition.constants'

/**
 * Validates the options passed to the carousel
 * @param {Object} options - The options to validate
 * @throws {Error} If any option is invalid
 * @private
 */
export const validateOptions = (options) => {
  // Validate images array
  if (options.images !== undefined) {
    if (!Array.isArray(options.images)) {
      throw new Error('images option must be an array of strings')
    }
    if (!options.images.every((img) => typeof img === 'string')) {
      throw new Error('All elements in images array must be strings')
    }
  }

  // Validate boolean options
  const booleanOptions = ['autoplay', 'cycle', 'showFilenames', 'showThumbnails', 'showBullets', 'showControls']
  booleanOptions.forEach((option) => {
    if (options[option] !== undefined && typeof options[option] !== 'boolean') {
      throw new Error(`${option} option must be a boolean`)
    }
  })

  // Validate autoplayInterval
  if (options.autoplayInterval !== undefined) {
    if (typeof options.autoplayInterval !== 'number' || options.autoplayInterval < 0) {
      throw new Error('autoplayInterval option must be a positive number')
    }
  }

  // Validate transitionEffect
  if (options.transitionEffect !== undefined) {
    if (!Object.values(TRANSITION_EFFECTS).includes(options.transitionEffect)) {
      throw new Error(`transitionEffect must be one of: ${Object.values(TRANSITION_EFFECTS).join(', ')}`)
    }
  }

  // Validate thumbnailFitMode
  if (options.thumbnailFitMode !== undefined) {
    if (!Object.values(THUMBNAIL_FIT_MODE).includes(options.thumbnailFitMode)) {
      throw new Error(`thumbnailFitMode must be one of: ${Object.values(THUMBNAIL_FIT_MODE).join(', ')}`)
    }
  }

  // Validate thumbnailAlignment
  if (options.thumbnailAlignment !== undefined) {
    if (!Object.values(THUMBNAIL_ALIGNMENT).includes(options.thumbnailAlignment)) {
      throw new Error(`thumbnailAlignment must be one of: ${Object.values(THUMBNAIL_ALIGNMENT).join(', ')}`)
    }
  }
}
