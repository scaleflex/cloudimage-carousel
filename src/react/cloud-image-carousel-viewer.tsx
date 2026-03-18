import { forwardRef, useImperativeHandle } from 'react'

import type { Theme } from '../core/types'

import type { CloudImageCarouselViewerProps, CloudImageCarouselViewerRef } from './types'
import { useCloudImageCarousel } from './use-cloud-image-carousel'

/**
 * React component wrapper for CloudImageCarousel.
 *
 * Supports all carousel config as props, plus `className`, `style`, and ref API
 * for imperative control.
 *
 * @example
 * ```tsx
 * import { CloudImageCarouselViewer } from 'js-cloudimage-carousel/react'
 *
 * function App() {
 *   const ref = useRef<CloudImageCarouselViewerRef>(null)
 *
 *   return (
 *     <>
 *       <CloudImageCarouselViewer
 *         ref={ref}
 *         images={['img1.jpg', 'img2.jpg']}
 *         theme="dark"
 *         showBullets
 *       />
 *       <button onClick={() => ref.current?.next()}>Next</button>
 *     </>
 *   )
 * }
 * ```
 */
export const CloudImageCarouselViewer = forwardRef<CloudImageCarouselViewerRef, CloudImageCarouselViewerProps>(
  function CloudImageCarouselViewer(
    { className, style, onSlideChange, ...config },
    ref,
  ) {
    const { containerRef, instance } = useCloudImageCarousel({ ...config, onSlideChange })

    // Expose imperative API via ref
    useImperativeHandle(
      ref,
      () => ({
        next: () => instance?.next(),
        prev: () => instance?.prev(),
        goToSlide: (index: number) => instance?.goToSlide(index),
        zoomIn: () => instance?.zoomIn(),
        zoomOut: () => instance?.zoomOut(),
        resetZoom: () => instance?.resetZoom(),
        toggleFullscreen: () => instance?.toggleFullscreen(),
        startAutoplay: () => instance?.startAutoplay(),
        stopAutoplay: () => instance?.stopAutoplay(),
        pauseAutoplay: () => instance?.pauseAutoplay(),
        resumeAutoplay: () => instance?.resumeAutoplay(),
        setTheme: (theme: Theme) => instance?.setTheme(theme),
        getInstance: () => instance,
      }),
      [instance],
    )

    return <div ref={containerRef as React.RefObject<HTMLDivElement>} className={className} style={style} />
  },
)
