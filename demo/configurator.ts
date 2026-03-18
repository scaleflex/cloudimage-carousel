import CloudImageCarousel from '../src/index'
import type { CloudImageCarouselConfig } from '../src/core/types'

const DEMO_IMAGES = [
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/perfume.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/frog.png',
]

let instance: CloudImageCarousel | null = null

export function initConfigurator(): void {
  const viewerEl = document.getElementById('configurator-carousel')
  if (!viewerEl) return

  const cfgThumbnails = document.getElementById('cfg-thumbnails') as HTMLInputElement
  const cfgBullets = document.getElementById('cfg-bullets') as HTMLInputElement
  const cfgControls = document.getElementById('cfg-controls') as HTMLInputElement
  const cfgFilenames = document.getElementById('cfg-filenames') as HTMLInputElement
  const cfgAutoplay = document.getElementById('cfg-autoplay') as HTMLInputElement
  const cfgCycle = document.getElementById('cfg-cycle') as HTMLInputElement
  const cfgTheme = document.getElementById('cfg-theme') as HTMLSelectElement
  const cfgTransition = document.getElementById('cfg-transition') as HTMLSelectElement
  const cfgControlsPosition = document.getElementById('cfg-controls-position') as HTMLSelectElement
  const cfgZoomMin = document.getElementById('cfg-zoom-min') as HTMLInputElement
  const cfgZoomMax = document.getElementById('cfg-zoom-max') as HTMLInputElement
  const cfgZoomStep = document.getElementById('cfg-zoom-step') as HTMLInputElement
  const cfgCode = document.querySelector('#cfg-code code') as HTMLElement
  const cfgCopy = document.getElementById('cfg-copy') as HTMLButtonElement

  function getConfig(): Partial<CloudImageCarouselConfig> {
    return {
      images: DEMO_IMAGES,
      showThumbnails: cfgThumbnails.checked,
      showBullets: cfgBullets.checked,
      showControls: cfgControls.checked,
      showFilenames: cfgFilenames.checked,
      autoplay: cfgAutoplay.checked,
      cycle: cfgCycle.checked,
      theme: cfgTheme.value as 'light' | 'dark',
      transitionEffect: cfgTransition.value as 'fade' | 'slide' | 'zoom' | 'flip',
      controlsPosition: cfgControlsPosition.value as 'center' | 'bottom',
      zoomMin: parseFloat(cfgZoomMin.value),
      zoomMax: parseFloat(cfgZoomMax.value),
      zoomStep: parseFloat(cfgZoomStep.value),
    }
  }

  function generateCode(config: Partial<CloudImageCarouselConfig>): string {
    const opts: string[] = []
    opts.push(`  images: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],`)
    if (!config.showThumbnails) opts.push(`  showThumbnails: false,`)
    if (config.showBullets) opts.push(`  showBullets: true,`)
    if (!config.showControls) opts.push(`  showControls: false,`)
    if (config.showFilenames) opts.push(`  showFilenames: true,`)
    if (config.autoplay) opts.push(`  autoplay: true,`)
    if (!config.cycle) opts.push(`  cycle: false,`)
    if (config.theme !== 'light') opts.push(`  theme: '${config.theme}',`)
    if (config.transitionEffect !== 'fade') opts.push(`  transitionEffect: '${config.transitionEffect}',`)
    if (config.controlsPosition !== 'center') opts.push(`  controlsPosition: '${config.controlsPosition}',`)
    if (config.zoomMin !== 1) opts.push(`  zoomMin: ${config.zoomMin},`)
    if (config.zoomMax !== 4) opts.push(`  zoomMax: ${config.zoomMax},`)
    if (config.zoomStep !== 0.3) opts.push(`  zoomStep: ${config.zoomStep},`)

    return `const carousel = new CloudImageCarousel('#el', {\n${opts.join('\n')}\n})\ncarousel.init()`
  }

  function rebuild(): void {
    const config = getConfig()

    // Controls position only relevant when controls are visible
    const posLabel = cfgControlsPosition.closest('label') as HTMLElement
    posLabel.style.display = cfgControls.checked ? '' : 'none'

    // Destroy and recreate (carousel doesn't have an update() method)
    if (instance) {
      viewerEl!.style.minHeight = `${viewerEl!.offsetHeight}px`
      instance.destroy()
      instance = null
    }

    instance = new CloudImageCarousel(viewerEl!, config)
    instance.init()

    // Release min-height after images load
    const img = viewerEl!.querySelector('img')
    const release = () => {
      viewerEl!.style.minHeight = ''
    }
    if (img && !img.complete) {
      img.addEventListener('load', release, { once: true })
      img.addEventListener('error', release, { once: true })
    } else {
      requestAnimationFrame(release)
    }

    // Update code display
    cfgCode.textContent = generateCode(config)
  }

  // Bind all controls to rebuild
  ;[cfgThumbnails, cfgBullets, cfgControls, cfgFilenames, cfgAutoplay, cfgCycle].forEach((el) =>
    el.addEventListener('change', rebuild),
  )
  ;[cfgTheme, cfgTransition, cfgControlsPosition].forEach((el) => el.addEventListener('change', rebuild))
  ;[cfgZoomMin, cfgZoomMax, cfgZoomStep].forEach((el) => el.addEventListener('change', rebuild))

  // Copy button
  cfgCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(cfgCode.textContent || '').then(() => {
      cfgCopy.textContent = 'Copied!'
      setTimeout(() => {
        cfgCopy.textContent = 'Copy to Clipboard'
      }, 2000)
    })
  })

  // Initial build
  rebuild()
}
