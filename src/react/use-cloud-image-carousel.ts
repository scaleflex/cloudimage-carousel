import { useEffect, useRef, useState } from 'react'

import { CloudImageCarousel } from '../core/carousel'
import type { CloudImageCarouselInstance } from '../core/types'

import type { UseCloudImageCarouselOptions, UseCloudImageCarouselReturn } from './types'

/**
 * React hook for creating and managing a CloudImageCarousel instance.
 *
 * Handles lifecycle: creates on mount, destroys on unmount.
 * Config changes trigger re-initialization.
 *
 * @example
 * ```tsx
 * const { containerRef, instance } = useCloudImageCarousel({
 *   images: ['img1.jpg', 'img2.jpg'],
 *   theme: 'dark',
 * })
 * return <div ref={containerRef} />
 * ```
 */
export function useCloudImageCarousel(options: UseCloudImageCarouselOptions): UseCloudImageCarouselReturn {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [instance, setInstance] = useState<CloudImageCarouselInstance | null>(null)

  // Store options in a ref so callbacks always see latest values
  // without triggering re-initialization
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Serialize config keys that should trigger re-init when changed
  const configKey = JSON.stringify({
    images: options.images,
    theme: options.theme,
    transitionEffect: options.transitionEffect,
    showThumbnails: options.showThumbnails,
    showBullets: options.showBullets,
    showControls: options.showControls,
    controlsPosition: options.controlsPosition,
    showFilenames: options.showFilenames,
    autoplay: options.autoplay,
    autoplayInterval: options.autoplayInterval,
    cycle: options.cycle,
    zoomMin: options.zoomMin,
    zoomMax: options.zoomMax,
    zoomStep: options.zoomStep,
    aspectRatio: options.aspectRatio,
    cloudimage: options.cloudimage,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const opts = {
      ...optionsRef.current,
      onSlideChange: (index: number) => optionsRef.current.onSlideChange?.(index),
    }

    const carousel = new CloudImageCarousel(el, opts)
    carousel.init()
    setInstance(carousel)

    return () => {
      carousel.destroy()
      setInstance(null)
    }
  }, [configKey])

  return { containerRef, instance }
}
