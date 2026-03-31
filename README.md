<p align="center">
     <img src="https://scaleflex.cloudimg.io/v7/plugins/scaleflex/logo.png?vh=b0a502&radius=25&w=700" alt="Scaleflex" width="350">
</p>

<h1 align="center">@cloudimage/carousel</h1>

<p align="center">
  Lightweight image carousel with zoom, swipe, transitions, and accessibility. Zero dependencies.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cloudimage/carousel"><img src="https://img.shields.io/npm/v/@cloudimage/carousel.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@cloudimage/carousel"><img src="https://img.shields.io/npm/dm/@cloudimage/carousel.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/scaleflex/cloudimage-carousel/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cloudimage/carousel.svg?style=flat-square" alt="license"></a>
  <a href="https://bundlephobia.com/package/@cloudimage/carousel"><img src="https://badgen.net/bundlephobia/minzip/@cloudimage/carousel" alt="bundle size"></a>
</p>

<p align="center">
  <a href="https://scaleflex.github.io/cloudimage-carousel/">Live Demo</a> |
  <a href="https://codesandbox.io/p/devbox/github/scaleflex/cloudimage-carousel/tree/master/examples/vanilla">Vanilla Sandbox</a> |
  <a href="https://codesandbox.io/p/devbox/github/scaleflex/cloudimage-carousel/tree/master/examples/react">React Sandbox</a>
</p>

---

## Why @cloudimage/carousel?

Most carousel libraries are bloated, inaccessible, or require heavy frameworks. This library was built to fill the gap:

- **Lightweight** — under 10 KB gzipped (JS + CSS) with zero runtime dependencies
- **Accessible by default** — WCAG 2.1 AA compliant out of the box
- **Framework-agnostic** — works with vanilla JS, React, or any framework
- **Built-in zoom & pan** — Ctrl+scroll, double-click, pinch-to-zoom, drag-to-pan
- **Four transitions** — slide, fade, zoom, and flip with configurable easing
- **CSS variable theming** — light/dark themes, 30+ customizable properties
- **Optional Cloudimage CDN** — serve optimally-sized images automatically

---

## Features

- **Image carousel** — Navigate between images with thumbnails, bullets, or swipe gestures
- **Zoom & pan** — CSS transform-based with mouse wheel, pinch-to-zoom, double-click, drag-to-pan
- **Configurable zoom** — Custom min/max/step via config
- **Transitions** — Slide, fade, zoom, and flip effects with CSS variable timing
- **WCAG 2.1 AA** — Full keyboard navigation, ARIA attributes, focus management, reduced motion
- **CSS variable theming** — Light and dark themes, fully customizable
- **Two init methods** — JavaScript API and HTML data-attributes
- **React wrapper** — Separate entry point with component, hook, and ref API
- **TypeScript** — Full type definitions
- **Cloudimage CDN** — Optional responsive image loading
- **Autoplay** — With pause/resume controls (WCAG 2.2.2 compliant)
- **Fullscreen** — With focus trapping for accessibility
- **Image error handling** — Graceful fallback for broken images with optional callback
- **Lazy loading** — IntersectionObserver-based with eager fallback

## Installation

```bash
npm install @cloudimage/carousel
```

### CDN

```html
<script src="https://scaleflex.cloudimg.io/v7/plugins/carousel/1.0.3/carousel.min.js?func=proxy"></script>
```

## Quick Start

### JavaScript API

```js
import { CloudImageCarousel } from '@cloudimage/carousel'

const carousel = new CloudImageCarousel('#my-carousel', {
  images: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
  theme: 'light',
  showBullets: true,
  transitionEffect: 'slide',
})

carousel.init()
```

### HTML Data-Attributes

```html
<div
  data-ci-carousel-images='["photo1.jpg", "photo2.jpg", "photo3.jpg"]'
  data-ci-carousel-theme="dark"
  data-ci-carousel-show-bullets="true"
  data-ci-carousel-transition="fade"
></div>

<script>
  CloudImageCarousel.autoInit()
</script>
```

## API Reference

### Constructor

```ts
new CloudImageCarousel(element: HTMLElement | string, config?: Partial<CloudImageCarouselConfig>)
```

### Config

| Option             | Type                                    | Default    | Description                                     |
| ------------------ | --------------------------------------- | ---------- | ----------------------------------------------- |
| `images`           | `ImageSource[]`                         | `[]`       | Array of image URLs or `{ src, alt }` objects   |
| `autoplay`         | `boolean`                               | `false`    | Enable automatic slide advancement              |
| `autoplayInterval` | `number`                                | `3000`     | Autoplay interval in ms (min 100)               |
| `cycle`            | `boolean`                               | `true`     | Loop from last slide back to first              |
| `showFilenames`    | `boolean`                               | `false`    | Show filename overlay on each slide             |
| `showThumbnails`   | `boolean`                               | `true`     | Show thumbnail strip below the carousel         |
| `showBullets`      | `boolean`                               | `false`    | Show bullet indicators                          |
| `showControls`     | `boolean`                               | `true`     | Show navigation controls (prev/next/fullscreen) |
| `controlsPosition` | `'center' \| 'bottom'`                  | `'center'` | Position of navigation arrows                   |
| `theme`            | `'light' \| 'dark'`                     | `'light'`  | Color theme                                     |
| `transitionEffect` | `'slide' \| 'fade' \| 'zoom' \| 'flip'` | `'fade'`   | Slide transition effect                         |
| `zoomMin`          | `number`                                | `1`        | Minimum zoom level                              |
| `zoomMax`          | `number`                                | `4`        | Maximum zoom level                              |
| `zoomStep`         | `number`                                | `0.3`      | Zoom step increment                             |
| `onSlideChange`    | `(index: number) => void`               | —          | Callback fired after a slide change             |
| `onError`          | `(src: string, index: number) => void`  | —          | Callback fired when an image fails to load      |
| `cloudimage`       | `CloudimageConfig`                      | —          | Cloudimage CDN config                           |

### CloudimageConfig

| Field         | Type     | Default         | Description                                    |
| ------------- | -------- | --------------- | ---------------------------------------------- |
| `token`       | `string` | —               | Cloudimage customer token (required)           |
| `apiVersion`  | `string` | `'v7'`          | API version                                    |
| `domain`      | `string` | `'cloudimg.io'` | Custom domain                                  |
| `limitFactor` | `number` | `100`           | Round widths to nearest N pixels               |
| `params`      | `string` | —               | Custom URL params (e.g. `'q=80&org_if_sml=1'`) |

### Instance Methods

```ts
carousel.init(): void
carousel.next(): void
carousel.prev(): void
carousel.goToSlide(index: number): void
carousel.zoomIn(): void
carousel.zoomOut(): void
carousel.resetZoom(): void
carousel.toggleFullscreen(): void
carousel.startAutoplay(): void
carousel.stopAutoplay(): void
carousel.pauseAutoplay(): void
carousel.resumeAutoplay(): void
carousel.setTheme(theme: 'light' | 'dark'): void
carousel.loadImages(sources: ImageSource[]): void
carousel.destroy(): void
```

### Static Methods

```ts
CloudImageCarousel.autoInit(root?: HTMLElement | Document): CloudImageCarousel[]
```

## React Usage

```tsx
import { CloudImageCarouselViewer, useCloudImageCarousel } from '@cloudimage/carousel/react'

// Component
function Gallery() {
  return (
    <CloudImageCarouselViewer
      images={['photo1.jpg', 'photo2.jpg']}
      theme="dark"
      showBullets
      onSlideChange={(index) => console.log('Slide:', index)}
    />
  )
}

// Hook
function Gallery() {
  const { containerRef, instance } = useCloudImageCarousel({
    images: ['photo1.jpg', 'photo2.jpg'],
    controlsPosition: 'bottom',
  })

  return (
    <>
      <div ref={containerRef} />
      <button onClick={() => instance?.next()}>Next</button>
    </>
  )
}

// Ref API
function Gallery() {
  const ref = useRef<CloudImageCarouselViewerRef>(null)

  return (
    <>
      <CloudImageCarouselViewer ref={ref} images={['photo1.jpg', 'photo2.jpg']} />
      <button onClick={() => ref.current?.next()}>Next</button>
      <button onClick={() => ref.current?.zoomIn()}>Zoom In</button>
      <button onClick={() => ref.current?.setTheme('dark')}>Dark</button>
    </>
  )
}
```

## Theming

All visuals are customizable via CSS variables:

```css
.my-carousel .ci-carousel {
  --ci-carousel-bg: #0f172a;
  --ci-carousel-btn-bg: rgba(59, 130, 246, 0.85);
  --ci-carousel-btn-color: #ffffff;
  --ci-carousel-btn-hover-bg: rgba(59, 130, 246, 1);
  --ci-carousel-bullet-active-bg: #3b82f6;
  --ci-carousel-thumbnail-active-border: 0 0 0 2px #3b82f6;
  --ci-carousel-thumbnails-bg: #0f172a;
}
```

Set `theme: 'dark'` for the built-in dark theme.

## Accessibility

- All interactive elements are `<button>` elements with `aria-label`
- `ArrowLeft` / `ArrowRight` navigates between slides
- `+` / `=` zooms in, `-` zooms out, `0` resets zoom
- `F` toggles fullscreen
- `Escape` resets zoom
- Focus trapping in fullscreen mode
- Live region announcements for screen readers
- `aria-pressed` on bullets and thumbnails
- `prefers-reduced-motion` disables all animations

## Cloudimage Integration

```js
new CloudImageCarousel('#el', {
  images: ['photo1.jpg', 'photo2.jpg'],
  cloudimage: {
    token: 'demo',
    limitFactor: 100,
    params: 'q=80',
  },
})
```

Images are automatically served at optimal resolution based on container size and zoom level.

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 80+     |
| Firefox | 80+     |
| Safari  | 14+     |
| Edge    | 80+     |

## License

[MIT](./LICENSE)

<p align="center">
  Made with care by the <a href="https://www.scaleflex.com">Scaleflex</a> team
</p>
