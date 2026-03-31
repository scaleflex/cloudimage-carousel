// ==========================================================================
// Configuration types
// ==========================================================================

/** Transition effect for slide changes */
export type TransitionEffect = 'slide' | 'fade' | 'zoom' | 'flip'

/** Navigation arrow placement */
export type ControlsPosition = 'center' | 'bottom'

/** Visual theme */
export type Theme = 'light' | 'dark'

/**
 * Image source — either a URL string or an object with src and alt text.
 * When a string is provided, alt defaults to "Image N".
 */
export type ImageSource = string | { src: string; alt?: string }

/**
 * Normalized image entry used internally after parsing ImageSource.
 */
export interface NormalizedImage {
  src: string
  alt: string
}

// ==========================================================================
// Cloudimage CDN
// ==========================================================================

/** Cloudimage CDN integration configuration */
export interface CloudimageConfig {
  /** Cloudimage customer token (e.g. 'demo'). Enables Cloudimage when set. */
  token: string
  /** API version (default: 'v7') */
  apiVersion?: string
  /** Custom Cloudimage domain (default: 'cloudimg.io') */
  domain?: string
  /** Round widths to the nearest N pixels (default: 100) */
  limitFactor?: number
  /** Custom URL params appended to CDN URL (e.g. 'q=80&org_if_sml=1') */
  params?: string
}

// ==========================================================================
// Configuration
// ==========================================================================

/**
 * Configuration options for CloudImageCarousel.
 * All properties are optional — sensible defaults are applied.
 */
export interface CloudImageCarouselConfig {
  /** Image sources — strings or { src, alt } objects */
  images?: ImageSource[]
  /** Enable automatic slide advancement */
  autoplay?: boolean
  /** Autoplay interval in milliseconds (min 100) */
  autoplayInterval?: number
  /** Loop from last slide back to first */
  cycle?: boolean
  /** Show filename overlay on each slide */
  showFilenames?: boolean
  /** Show thumbnail strip below the carousel */
  showThumbnails?: boolean
  /** Show bullet indicators */
  showBullets?: boolean
  /** Show navigation controls (prev/next/fullscreen) */
  showControls?: boolean
  /** Position of prev/next navigation arrows */
  controlsPosition?: ControlsPosition
  /** Color theme */
  theme?: Theme
  /** Slide transition effect */
  transitionEffect?: TransitionEffect
  /** Aspect ratio of the main view (e.g. '16/9', '4/3', '1/1'). Default: '16/9' */
  aspectRatio?: string
  /** Minimum zoom level (default: 1) */
  zoomMin?: number
  /** Maximum zoom level (default: 4) */
  zoomMax?: number
  /** Zoom step increment (default: 0.3) */
  zoomStep?: number
  /** Callback fired after a slide change */
  onSlideChange?: (index: number) => void
  /** Callback fired when an image fails to load */
  onError?: (src: string, index: number) => void
  /** Optional Cloudimage CDN integration for responsive image loading */
  cloudimage?: CloudimageConfig
}

// ==========================================================================
// Instance (public API)
// ==========================================================================

/**
 * Public API exposed by a CloudImageCarousel instance.
 * Used by the React ref handle and for programmatic control.
 */
export interface CloudImageCarouselInstance {
  /** Initialize the carousel (build DOM, attach events) */
  init(): void
  /** Navigate to the next slide */
  next(): void
  /** Navigate to the previous slide */
  prev(): void
  /** Navigate to a specific slide by index */
  goToSlide(index: number): void
  /** Zoom in (centered) */
  zoomIn(): void
  /** Zoom out (centered) */
  zoomOut(): void
  /** Reset zoom to 1x */
  resetZoom(): void
  /** Toggle browser fullscreen */
  toggleFullscreen(): void
  /** Start autoplay */
  startAutoplay(): void
  /** Stop autoplay */
  stopAutoplay(): void
  /** Pause autoplay (can be resumed) */
  pauseAutoplay(): void
  /** Resume paused autoplay */
  resumeAutoplay(): void
  /** Switch theme at runtime */
  setTheme(theme: Theme): void
  /** Replace images after initialization */
  loadImages(sources: ImageSource[]): void
  /** Tear down the carousel and clean up all resources */
  destroy(): void

  /** Current slide index */
  readonly currentIndex: number
  /** Whether the carousel is in fullscreen mode */
  readonly isFullscreen: boolean
  /** Whether autoplay is paused */
  readonly isAutoplayPaused: boolean

  /**
   * Auto-discover elements with data-ci-carousel-images and initialize.
   * @param root - Optional root element to scope the search
   * @returns Array of initialized carousel instances
   */
  // static autoInit is on the class, not on instances
}
