import CloudImageCarousel from '../src/index'
import { initConfigurator } from './configurator'

const DEMO_IMAGES = [
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/perfume.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/frog.png',
]

const ALL_IMAGES = [
  ...DEMO_IMAGES,
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/andromeda.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/earth1.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/colours.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/landscape.jpg',
]

// ==========================================================================
// Hero carousel
// ==========================================================================

new CloudImageCarousel('#hero-carousel', {
  images: ALL_IMAGES,
  showThumbnails: false,
  showBullets: true,
  transitionEffect: 'fade',
  autoplay: true,
  autoplayInterval: 4000,
}).init()

// ==========================================================================
// Light theme
// ==========================================================================

new CloudImageCarousel('#theme-light', {
  images: DEMO_IMAGES,
  theme: 'light',
  showBullets: true,
  controlsPosition: 'bottom',
  transitionEffect: 'slide',
}).init()

// ==========================================================================
// Dark theme
// ==========================================================================

new CloudImageCarousel('#theme-dark', {
  images: DEMO_IMAGES,
  theme: 'dark',
  showBullets: true,
  controlsPosition: 'bottom',
  transitionEffect: 'slide',
}).init()

// ==========================================================================
// Custom green styling — no theme prop, CSS variable overrides only
// ==========================================================================

new CloudImageCarousel('#theme-custom', {
  images: DEMO_IMAGES,
  showBullets: true,
  controlsPosition: 'bottom',
  transitionEffect: 'slide',
}).init()

// ==========================================================================
// Controls: center (default)
// ==========================================================================

new CloudImageCarousel('#controls-center', {
  images: DEMO_IMAGES,
  controlsPosition: 'center',
  showThumbnails: false,
  showBullets: true,
  transitionEffect: 'fade',
}).init()

// ==========================================================================
// Controls: bottom
// ==========================================================================

new CloudImageCarousel('#controls-bottom', {
  images: DEMO_IMAGES,
  controlsPosition: 'bottom',
  showThumbnails: false,
  showBullets: true,
  transitionEffect: 'fade',
}).init()

// ==========================================================================
// Transition: slide
// ==========================================================================

new CloudImageCarousel('#transition-slide', {
  images: DEMO_IMAGES,
  transitionEffect: 'slide',
  showThumbnails: false,
  showBullets: true,
}).init()

// ==========================================================================
// Transition: fade
// ==========================================================================

new CloudImageCarousel('#transition-fade', {
  images: DEMO_IMAGES,
  transitionEffect: 'fade',
  showThumbnails: false,
  showBullets: true,
}).init()

// ==========================================================================
// Transition: zoom
// ==========================================================================

new CloudImageCarousel('#transition-zoom', {
  images: DEMO_IMAGES,
  transitionEffect: 'zoom',
  showThumbnails: false,
  showBullets: true,
}).init()

// ==========================================================================
// Transition: flip
// ==========================================================================

new CloudImageCarousel('#transition-flip', {
  images: DEMO_IMAGES,
  transitionEffect: 'flip',
  showThumbnails: false,
  showBullets: true,
}).init()

// ==========================================================================
// Zoom: default config
// ==========================================================================

new CloudImageCarousel('#zoom-default', {
  images: DEMO_IMAGES,
  showThumbnails: false,
  showBullets: true,
  transitionEffect: 'fade',
}).init()

// ==========================================================================
// Zoom: extended range
// ==========================================================================

new CloudImageCarousel('#zoom-extended', {
  images: DEMO_IMAGES,
  showThumbnails: false,
  showBullets: true,
  transitionEffect: 'fade',
  zoomMin: 1,
  zoomMax: 8,
  zoomStep: 0.5,
}).init()

// ==========================================================================
// Interactive Configurator
// ==========================================================================

initConfigurator()

// ==========================================================================
// Alt text demo — images as objects
// ==========================================================================

new CloudImageCarousel('#alt-text-demo', {
  images: [
    { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg', alt: 'Luxury hotel lobby' },
    { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg', alt: 'Colorful birds in nature' },
    { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg', alt: 'Mountain landscape at sunset' },
  ],
  showFilenames: true,
  showBullets: true,
  showThumbnails: true,
  transitionEffect: 'fade',
}).init()

// ==========================================================================
// Also by Scaleflex — slide auto-rotation
// ==========================================================================

{
  const slides = document.querySelectorAll<HTMLElement>('.demo-also-slide')
  const dotsContainer = document.getElementById('also-dots')
  if (slides.length > 0 && dotsContainer) {
    let current = 0
    let animating = false
    let timer: ReturnType<typeof setInterval>

    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button')
      dot.className = `demo-also-dot${i === 0 ? ' demo-also-dot--active' : ''}`
      dot.setAttribute('aria-label', `Slide ${i + 1}`)
      dot.addEventListener('click', () => goTo(i))
      dotsContainer.appendChild(dot)
    }

    function clearAnimClasses(el: HTMLElement) {
      el.classList.remove(
        'demo-also-slide--enter-right',
        'demo-also-slide--enter-left',
        'demo-also-slide--leave-left',
        'demo-also-slide--leave-right',
      )
    }

    function goTo(index: number) {
      if (index === current || animating) return
      animating = true
      const forward = index > current || (current === slides.length - 1 && index === 0)
      const prev = slides[current]
      const next = slides[index]

      clearAnimClasses(prev)
      prev.classList.remove('demo-also-slide--active')
      prev.classList.add(forward ? 'demo-also-slide--leave-left' : 'demo-also-slide--leave-right')

      clearAnimClasses(next)
      next.classList.add(forward ? 'demo-also-slide--enter-right' : 'demo-also-slide--enter-left')

      next.addEventListener('animationend', function handler() {
        next.removeEventListener('animationend', handler)
        clearAnimClasses(prev)
        clearAnimClasses(next)
        next.classList.add('demo-also-slide--active')
        animating = false
      })

      current = index
      dotsContainer!.querySelectorAll('.demo-also-dot').forEach((d, i) => {
        d.classList.toggle('demo-also-dot--active', i === current)
      })
      resetTimer()
    }

    function resetTimer() {
      clearInterval(timer)
      timer = setInterval(() => {
        goTo((current + 1) % slides.length)
      }, 5000)
    }

    resetTimer()
  }
}

// ==========================================================================
// Nav: scroll shadow + active section highlighting
// ==========================================================================

{
  const nav = document.getElementById('demo-nav')
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.demo-nav-links a')
  const sections = document.querySelectorAll<HTMLElement>('section[id]')

  const updateNav = (): void => {
    // Shadow on scroll
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 10)
    }

    // Active section
    let currentId = ''
    const offset = 120
    for (const section of sections) {
      if (section.offsetTop - offset <= window.scrollY) {
        currentId = section.id
      }
    }
    for (const link of navLinks) {
      const href = link.getAttribute('href')
      link.classList.toggle('active', href === `#${currentId}`)
    }
  }

  // Smooth scroll for nav link clicks (manual offset to respect sticky nav)
  for (const link of navLinks) {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      if (!href?.startsWith('#')) return
      const target = document.getElementById(href.slice(1))
      if (!target) return
      e.preventDefault()
      const navHeight = nav ? nav.offsetHeight : 0
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12
      window.scrollTo({ top, behavior: 'smooth' })
    })
  }

  window.addEventListener('scroll', updateNav, { passive: true })
  updateNav()
}

// ==========================================================================
// Mobile burger menu
// ==========================================================================

{
  const nav = document.getElementById('demo-nav')
  const burger = document.getElementById('nav-burger')
  const navLinks = document.querySelectorAll('.demo-nav-links a')

  if (nav && burger) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open')
      burger.setAttribute('aria-expanded', String(open))
    })

    for (const link of navLinks) {
      link.addEventListener('click', () => {
        nav.classList.remove('open')
        burger.setAttribute('aria-expanded', 'false')
      })
    }
  }
}

// ==========================================================================
// Copy to clipboard
// ==========================================================================

document.querySelectorAll('.demo-copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const code = btn.closest('.demo-code')?.querySelector('code')
    if (!code) return
    navigator.clipboard.writeText(code.textContent || '')
      .then(() => {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 2000)
      })
      .catch(() => {
        btn.textContent = 'Failed'
        setTimeout(() => {
          btn.textContent = 'Copy'
        }, 2000)
      })
  })
})
