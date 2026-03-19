// Core
import { CloudImageCarousel } from './core/carousel'

// Styles
import cssText from './styles/index.css?inline'
import { injectStyles } from './utils/dom.utils'

injectStyles(cssText)

// Type re-exports
export type {
  CloudImageCarouselConfig,
  CloudImageCarouselInstance,
  CloudimageConfig,
  ControlsPosition,
  ImageSource,
  NormalizedImage,
  Theme,
  TransitionEffect,
} from './core/types'

export default CloudImageCarousel
