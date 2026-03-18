// Core
import { CloudImageCarousel } from './core/carousel'

// Styles
import './styles/index.css'

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

// Named export for ESM
export { CloudImageCarousel }

// Default export for UMD/script tag usage
export default CloudImageCarousel
