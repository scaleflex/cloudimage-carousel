import type { CSSProperties } from 'react'

import type { CloudImageCarouselConfig, CloudImageCarouselInstance, Theme } from '../core/types'

// ==========================================================================
// Component props
// ==========================================================================

/**
 * Props for the CloudImageCarouselViewer React component.
 * Extends the core config with React-specific props.
 */
export interface CloudImageCarouselViewerProps extends CloudImageCarouselConfig {
  /** Additional CSS class name for the container div */
  className?: string
  /** Inline styles for the container div */
  style?: CSSProperties
  /** Callback fired after a slide change */
  onSlideChange?: (index: number) => void
}

// ==========================================================================
// Ref handle
// ==========================================================================

/**
 * Imperative handle exposed via React ref.
 * Provides programmatic control over the carousel instance.
 */
export interface CloudImageCarouselViewerRef {
  /** Navigate to the next slide */
  next(): void
  /** Navigate to the previous slide */
  prev(): void
  /** Navigate to a specific slide by index */
  goToSlide(index: number): void
  /** Zoom in */
  zoomIn(): void
  /** Zoom out */
  zoomOut(): void
  /** Reset zoom to 1x */
  resetZoom(): void
  /** Toggle fullscreen */
  toggleFullscreen(): void
  /** Start autoplay */
  startAutoplay(): void
  /** Stop autoplay */
  stopAutoplay(): void
  /** Pause autoplay */
  pauseAutoplay(): void
  /** Resume autoplay */
  resumeAutoplay(): void
  /** Switch theme at runtime */
  setTheme(theme: Theme): void
  /** Get the underlying carousel instance (or null if not initialized) */
  getInstance(): CloudImageCarouselInstance | null
}

// ==========================================================================
// Hook types
// ==========================================================================

/** Options for the useCloudImageCarousel hook — config plus React-specific callbacks */
export interface UseCloudImageCarouselOptions extends CloudImageCarouselConfig {
  /** Callback fired after a slide change */
  onSlideChange?: (index: number) => void
}

/** Return type of the useCloudImageCarousel hook */
export interface UseCloudImageCarouselReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** The carousel instance (null until initialized) */
  instance: CloudImageCarouselInstance | null
}
