// Styles — inject carousel CSS when the React entry is used
import cssText from '../styles/index.css?inline'
import { injectStyles } from '../utils/dom.utils'

injectStyles(cssText)

// Component
export { CloudImageCarouselViewer } from './cloud-image-carousel-viewer'

// Hook
export { useCloudImageCarousel } from './use-cloud-image-carousel'

// React-specific types
export type {
  CloudImageCarouselViewerProps,
  CloudImageCarouselViewerRef,
  UseCloudImageCarouselOptions,
  UseCloudImageCarouselReturn,
} from './types'

// Re-export common core types for convenience
export type {
  CloudImageCarouselConfig,
  CloudImageCarouselInstance,
  CloudimageConfig,
  ControlsPosition,
  ImageSource,
  Theme,
  TransitionEffect,
} from '../core/types'
