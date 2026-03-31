import { useRef, useState } from 'react'

import { CloudImageCarouselViewer } from '../../src/react'
import type { CloudImageCarouselViewerRef, Theme } from '../../src/react'
import { useCloudImageCarousel } from '../../src/react'

const IMAGES = [
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/perfume.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg',
  'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/frog.png',
]

const IMAGES_WITH_ALT = [
  { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/hotel.jpg', alt: 'Luxury hotel lobby' },
  { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/birds.jpg', alt: 'Colorful birds in nature' },
  { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/mountains.jpg', alt: 'Mountain landscape at sunset' },
  { src: 'https://demo.cloudimg.io/v7/https://samples.scaleflex.com/house.jpg', alt: 'Modern house exterior' },
]

export function App() {
  return (
    <div className="app">
      <h1>React Integration</h1>
      <p className="subtitle">Component, hook, and ref API — all the ways to use CloudImage Carousel in React</p>

      <ComponentDemo />
      <RefDemo />
      <HookDemo />
      <DynamicPropsDemo />
    </div>
  )
}

// ==========================================================================
// 1. Basic component usage
// ==========================================================================

function ComponentDemo() {
  return (
    <div className="section">
      <span className="label label--component">Component</span>
      <h2>Basic Component</h2>
      <p>Drop-in component with props. The simplest way to use it.</p>

      <div className="viewer">
        <CloudImageCarouselViewer
          images={IMAGES}
          showBullets
          showThumbnails
          transitionEffect="slide"
        />
      </div>

      <div className="code-block">
        <code>{`import { CloudImageCarouselViewer } from '@cloudimage/carousel/react'

<CloudImageCarouselViewer
  images={['img1.jpg', 'img2.jpg']}
  showBullets
  showThumbnails
  transitionEffect="slide"
/>`}</code>
      </div>
    </div>
  )
}

// ==========================================================================
// 2. Ref API — imperative control
// ==========================================================================

function RefDemo() {
  const ref = useRef<CloudImageCarouselViewerRef>(null)

  return (
    <div className="section">
      <span className="label label--ref">Ref API</span>
      <h2>Imperative Control via Ref</h2>
      <p>Use a ref to call methods: next, prev, goToSlide, zoom, fullscreen, theme switching.</p>

      <div className="viewer">
        <CloudImageCarouselViewer
          ref={ref}
          images={IMAGES_WITH_ALT}
          theme="dark"
          showBullets
          transitionEffect="fade"
        />
      </div>

      <div className="controls-bar">
        <button onClick={() => ref.current?.prev()}>Prev</button>
        <button onClick={() => ref.current?.next()}>Next</button>
        <button onClick={() => ref.current?.goToSlide(0)}>Go to 1</button>
        <button onClick={() => ref.current?.goToSlide(3)}>Go to 4</button>
        <button onClick={() => ref.current?.zoomIn()}>Zoom In</button>
        <button onClick={() => ref.current?.zoomOut()}>Zoom Out</button>
        <button onClick={() => ref.current?.resetZoom()}>Reset Zoom</button>
        <button onClick={() => ref.current?.toggleFullscreen()}>Fullscreen</button>
        <button onClick={() => ref.current?.setTheme('light')}>Light</button>
        <button onClick={() => ref.current?.setTheme('dark')}>Dark</button>
      </div>

      <div className="code-block">
        <code>{`const ref = useRef<CloudImageCarouselViewerRef>(null)

<CloudImageCarouselViewer ref={ref} images={images} theme="dark" />

<button onClick={() => ref.current?.next()}>Next</button>
<button onClick={() => ref.current?.setTheme('light')}>Light</button>`}</code>
      </div>
    </div>
  )
}

// ==========================================================================
// 3. Hook API — full control
// ==========================================================================

function HookDemo() {
  const { containerRef, instance } = useCloudImageCarousel({
    images: IMAGES,
    showThumbnails: false,
    showBullets: true,
    transitionEffect: 'fade',
    controlsPosition: 'bottom',
  })

  return (
    <div className="section">
      <span className="label label--hook">Hook</span>
      <h2>useCloudImageCarousel Hook</h2>
      <p>For maximum flexibility — you own the container element and the instance.</p>

      <div className="viewer">
        <div ref={containerRef} />
      </div>

      <div className="controls-bar">
        <button onClick={() => instance?.prev()}>Prev</button>
        <button onClick={() => instance?.next()}>Next</button>
        <button onClick={() => instance?.toggleFullscreen()}>Fullscreen</button>
      </div>

      <div className="code-block">
        <code>{`import { useCloudImageCarousel } from '@cloudimage/carousel/react'

const { containerRef, instance } = useCloudImageCarousel({
  images: ['img1.jpg', 'img2.jpg'],
  controlsPosition: 'bottom',
})

return <div ref={containerRef} />
// instance?.next(), instance?.zoomIn(), etc.`}</code>
      </div>
    </div>
  )
}

// ==========================================================================
// 4. Dynamic props — theme + transition switching
// ==========================================================================

function DynamicPropsDemo() {
  const [theme, setTheme] = useState<Theme>('light')
  const [transition, setTransition] = useState<'slide' | 'fade'>('slide')
  const [bullets, setBullets] = useState(true)
  const [thumbnails, setThumbnails] = useState(true)

  return (
    <div className="section">
      <span className="label label--component">Dynamic Props</span>
      <h2>Reactive Config</h2>
      <p>Change props and the carousel re-initializes automatically.</p>

      <div className="viewer">
        <CloudImageCarouselViewer
          images={IMAGES}
          theme={theme}
          transitionEffect={transition}
          showBullets={bullets}
          showThumbnails={thumbnails}
        />
      </div>

      <div className="controls-bar">
        <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
          <option value="light">Light theme</option>
          <option value="dark">Dark theme</option>
        </select>
        <select value={transition} onChange={(e) => setTransition(e.target.value as 'slide' | 'fade')}>
          <option value="slide">Slide transition</option>
          <option value="fade">Fade transition</option>
        </select>
        <button onClick={() => setBullets((b) => !b)}>
          {bullets ? 'Hide' : 'Show'} Bullets
        </button>
        <button onClick={() => setThumbnails((t) => !t)}>
          {thumbnails ? 'Hide' : 'Show'} Thumbnails
        </button>
      </div>

      <div className="code-block">
        <code>{`const [theme, setTheme] = useState<Theme>('light')
const [transition, setTransition] = useState('slide')

<CloudImageCarouselViewer
  images={images}
  theme={theme}
  transitionEffect={transition}
  showBullets={bullets}
  showThumbnails={thumbnails}
/>

// Change state → carousel re-initializes`}</code>
      </div>
    </div>
  )
}
