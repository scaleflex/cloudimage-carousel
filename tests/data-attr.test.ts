import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { CloudImageCarousel } from '../src/core/carousel'

describe('Data attribute initialization', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('initializes from data-ci-carousel-images', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg', 'b.jpg'])
    const carousel = new CloudImageCarousel(root)
    carousel.init()

    const slides = root.querySelectorAll('.ci-carousel-image-wrapper')
    expect(slides.length).toBe(2)

    carousel.destroy()
  })

  it('reads theme from data attribute', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg'])
    root.dataset.ciCarouselTheme = 'dark'
    const carousel = new CloudImageCarousel(root)
    carousel.init()

    expect(root.classList.contains('ci-carousel-theme-dark')).toBe(true)

    carousel.destroy()
  })

  it('reads boolean attributes', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg', 'b.jpg'])
    root.dataset.ciCarouselShowBullets = 'true'
    root.dataset.ciCarouselShowThumbnails = 'false'
    const carousel = new CloudImageCarousel(root)
    carousel.init()

    expect(root.querySelectorAll('.ci-carousel-bullet').length).toBe(2)
    expect(root.querySelectorAll('.ci-carousel-thumbnail').length).toBe(0)

    carousel.destroy()
  })

  it('reads numeric attributes', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg'])
    root.dataset.ciCarouselZoomMax = '8'
    root.dataset.ciCarouselZoomMin = '0.5'
    root.dataset.ciCarouselZoomStep = '0.5'

    // Config is parsed during construction — verify by checking no error
    const carousel = new CloudImageCarousel(root)
    carousel.init()
    carousel.destroy()
  })

  it('reads transition effect', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg', 'b.jpg'])
    root.dataset.ciCarouselTransition = 'slide'
    const carousel = new CloudImageCarousel(root)
    carousel.init()

    const wrapper = root.querySelector('.ci-carousel-image-wrapper')
    expect(wrapper?.classList.contains('slide')).toBe(true)

    carousel.destroy()
  })

  it('reads controls position', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg'])
    root.dataset.ciCarouselControlsPosition = 'bottom'
    root.dataset.ciCarouselShowControls = 'true'
    const carousel = new CloudImageCarousel(root)
    carousel.init()

    const controls = root.querySelector('.ci-carousel-controls')
    expect(controls?.classList.contains('ci-carousel-controls--bottom')).toBe(true)

    carousel.destroy()
  })

  it('JS options override data attributes', () => {
    root.dataset.ciCarouselImages = JSON.stringify(['a.jpg'])
    root.dataset.ciCarouselTheme = 'dark'

    const carousel = new CloudImageCarousel(root, { theme: 'light' })
    carousel.init()

    expect(root.classList.contains('ci-carousel-theme-dark')).toBe(false)

    carousel.destroy()
  })

  it('autoInit finds and initializes all matching elements', () => {
    const el1 = document.createElement('div')
    el1.dataset.ciCarouselImages = JSON.stringify(['a.jpg'])
    document.body.appendChild(el1)

    const el2 = document.createElement('div')
    el2.dataset.ciCarouselImages = JSON.stringify(['b.jpg'])
    document.body.appendChild(el2)

    const instances = CloudImageCarousel.autoInit()
    expect(instances.length).toBe(2)

    instances.forEach((c) => c.destroy())
    el1.remove()
    el2.remove()
  })

  it('autoInit with scoped root', () => {
    const wrapper = document.createElement('div')
    document.body.appendChild(wrapper)

    const el = document.createElement('div')
    el.dataset.ciCarouselImages = JSON.stringify(['a.jpg'])
    wrapper.appendChild(el)

    // Outside wrapper — should not be found
    const outside = document.createElement('div')
    outside.dataset.ciCarouselImages = JSON.stringify(['b.jpg'])
    document.body.appendChild(outside)

    const instances = CloudImageCarousel.autoInit(wrapper)
    expect(instances.length).toBe(1)

    instances.forEach((c) => c.destroy())
    wrapper.remove()
    outside.remove()
  })
})
