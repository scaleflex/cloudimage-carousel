# js-cloudimage-carousel — Specification

> Lightweight image carousel with zoom, swipe, transitions, and accessibility. Zero dependencies.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Features](#2-core-features)
3. [API Design](#3-api-design)
4. [Visual Design](#4-visual-design)
5. [Zoom & Pan](#5-zoom--pan)
6. [Transitions](#6-transitions)
7. [React Wrapper API](#7-react-wrapper-api)
8. [Accessibility](#8-accessibility)
9. [Build & Distribution](#9-build--distribution)
10. [Project Structure](#10-project-structure)
11. [GitHub Pages Demo](#11-github-pages-demo)
12. [Additional Features](#12-additional-features)
13. [Competitor Feature Matrix](#13-competitor-feature-matrix)
14. [Roadmap](#14-roadmap)

---

## 1. Project Overview

### What

`js-cloudimage-carousel` is an open-source JavaScript library for creating image carousels and image viewers. It provides a lightweight, accessible, and feature-rich carousel component with built-in zoom, swipe gestures, multiple transition effects, and optional Cloudimage CDN integration for responsive image delivery.

### Why

The existing ecosystem for image carousels has significant gaps:

- Most libraries are **heavy** and require jQuery or large framework dependencies
- **Accessibility** (WCAG compliance, keyboard navigation, screen readers) is poorly covered or absent
- **Built-in zoom & pan** is rarely combined with carousel navigation in a single package
- **TypeScript support** is often incomplete or nonexistent
- No modern library offers **both vanilla JS and React** with a proper build pipeline
- **HTML data-attribute initialization** for CDN/no-build usage is uncommon
- **CSS variable theming** for easy customization without JavaScript is rare

### Positioning

`js-cloudimage-carousel` fills these gaps by providing:

- A **zero-dependency**, TypeScript-first library
- **Combined zoom/pan + carousel** in a single package
- **Four transition effects** — slide, fade, zoom, and flip
- **Two equal initialization methods** — JavaScript API and HTML data-attributes
- **WCAG 2.1 AA** accessibility compliance out of the box
- **CSS variable theming** for easy customization (30+ properties)
- A **React wrapper** with SSR support
- **Modern build output** — ESM, CJS, and UMD in a single package
- **< 15 KB gzipped** bundle size (JS + CSS)

### Key Inspirations

- **Scaleflex `js-cloudimage-hotspot`** — same build system pattern, React wrapper architecture, accessibility approach, deployment pipeline
- **Scaleflex `cloudimage-360`** — CDN integration pattern, UMD global naming convention

---

## 2. Core Features

### v1.0 Feature Set

| Feature | Description |
|---|---|
| **Image Carousel** | Navigate between images with thumbnails, bullets, swipe gestures, or keyboard |
| **Transitions** | Four effects: slide, fade, zoom, and flip — configurable via CSS variables |
| **Zoom & Pan** | CSS transform-based, GPU-accelerated; Ctrl+scroll, double-click, pinch-to-zoom, drag-to-pan |
| **Fullscreen** | Browser Fullscreen API toggle with focus trapping |
| **Autoplay** | Configurable interval with pause/resume controls (WCAG 2.2.2 compliant) |
| **Accessibility** | WCAG 2.1 AA; full keyboard navigation; ARIA attributes; focus management; reduced motion |
| **Theming** | CSS variables as primary customization; light and dark built-in themes |
| **Two Init Methods** | JavaScript API (`new CloudImageCarousel()`) and HTML data-attributes (`data-ci-carousel-*`) — fully equivalent |
| **React Wrapper** | Separate entry point with component, hook, and ref API |
| **TypeScript** | Full type definitions, exported interfaces and types |
| **Cloudimage Integration** | Optional responsive image loading via Scaleflex Cloudimage CDN |
| **Lazy Loading** | IntersectionObserver-based with eager fallback |
| **Swipe Gestures** | Touch support for mobile navigation |
| **Thumbnails** | Configurable thumbnail strip with active state |
| **Bullets** | Indicator dots with `aria-pressed` for accessibility |
| **Build Formats** | ESM + CJS + UMD; single CDN file; `window.CloudImageCarousel` global |

---

## 3. API Design

The library provides two fully equivalent initialization methods. Every configuration option available in the JavaScript API is also expressible via HTML data-attributes.

### 3.1 JavaScript API

```js
const carousel = new CloudImageCarousel(element, config);
carousel.init();
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `element` | `HTMLElement \| string` | Container element or CSS selector |
| `config` | `Partial<CloudImageCarouselConfig>` | Configuration object |

**`CloudImageCarouselConfig` interface:**

```ts
interface CloudImageCarouselConfig {
  /** Image sources — strings or { src, alt } objects */
  images?: ImageSource[];

  /** Enable automatic slide advancement (default: false) */
  autoplay?: boolean;

  /** Autoplay interval in milliseconds, min 100 (default: 3000) */
  autoplayInterval?: number;

  /** Loop from last slide back to first (default: true) */
  cycle?: boolean;

  /** Show filename overlay on each slide (default: false) */
  showFilenames?: boolean;

  /** Show thumbnail strip below the carousel (default: true) */
  showThumbnails?: boolean;

  /** Show bullet indicators (default: false) */
  showBullets?: boolean;

  /** Show navigation controls — prev/next/fullscreen (default: true) */
  showControls?: boolean;

  /** Position of prev/next navigation arrows (default: 'center') */
  controlsPosition?: 'center' | 'bottom';

  /** Color theme (default: 'light') */
  theme?: 'light' | 'dark';

  /** Slide transition effect (default: 'fade') */
  transitionEffect?: 'slide' | 'fade' | 'zoom' | 'flip';

  /** Minimum zoom level (default: 1) */
  zoomMin?: number;

  /** Maximum zoom level (default: 4) */
  zoomMax?: number;

  /** Zoom step increment (default: 0.3) */
  zoomStep?: number;

  /** Callback fired after a slide change */
  onSlideChange?: (index: number) => void;

  /** Callback fired when an image fails to load */
  onError?: (src: string, index: number) => void;

  /** Optional Cloudimage CDN integration */
  cloudimage?: CloudimageConfig;
}
```

**`CloudimageConfig` interface:**

```ts
interface CloudimageConfig {
  /** Cloudimage customer token (e.g. 'demo'). Enables Cloudimage when set. */
  token: string;
  /** API version (default: 'v7') */
  apiVersion?: string;
  /** Custom Cloudimage domain (default: 'cloudimg.io') */
  domain?: string;
  /** Round widths to the nearest N pixels (default: 100) */
  limitFactor?: number;
  /** Custom URL params appended to CDN URL (e.g. 'q=80&org_if_sml=1') */
  params?: string;
}
```

**`ImageSource` type:**

```ts
type ImageSource = string | { src: string; alt?: string };
```

When a string is provided, alt text defaults to "Image N" (where N is the 1-based index).

**Instance methods:**

```ts
interface CloudImageCarouselInstance {
  /** Initialize the carousel (build DOM, attach events) */
  init(): void;

  /** Navigate to the next slide */
  next(): void;

  /** Navigate to the previous slide */
  prev(): void;

  /** Navigate to a specific slide by index */
  goToSlide(index: number): void;

  /** Zoom in (centered) */
  zoomIn(): void;

  /** Zoom out (centered) */
  zoomOut(): void;

  /** Reset zoom to 1x */
  resetZoom(): void;

  /** Toggle browser fullscreen */
  toggleFullscreen(): void;

  /** Start autoplay */
  startAutoplay(): void;

  /** Stop autoplay */
  stopAutoplay(): void;

  /** Pause autoplay (can be resumed) */
  pauseAutoplay(): void;

  /** Resume paused autoplay */
  resumeAutoplay(): void;

  /** Switch theme at runtime */
  setTheme(theme: 'light' | 'dark'): void;

  /** Replace images after initialization */
  loadImages(sources: ImageSource[]): void;

  /** Tear down the carousel and clean up all resources */
  destroy(): void;

  /** Current slide index */
  readonly currentIndex: number;

  /** Whether the carousel is in fullscreen mode */
  readonly isFullscreen: boolean;

  /** Whether autoplay is paused */
  readonly isAutoplayPaused: boolean;
}
```

**Usage example:**

```js
import { CloudImageCarousel } from 'js-cloudimage-carousel';

const carousel = new CloudImageCarousel('#my-carousel', {
  images: [
    { src: 'photo1.jpg', alt: 'Living room' },
    { src: 'photo2.jpg', alt: 'Kitchen' },
    { src: 'photo3.jpg', alt: 'Bedroom' },
  ],
  theme: 'light',
  showBullets: true,
  transitionEffect: 'slide',
  onSlideChange(index) {
    console.log('Slide changed to:', index);
  },
});

carousel.init();
```

### 3.2 HTML Data-Attribute Initialization

All configuration is expressed via `data-ci-carousel-*` attributes on the container element. Images are passed as a JSON array in `data-ci-carousel-images`.

```html
<div
  data-ci-carousel-images='["photo1.jpg", "photo2.jpg", "photo3.jpg"]'
  data-ci-carousel-theme="dark"
  data-ci-carousel-show-bullets="true"
  data-ci-carousel-transition="fade"
  data-ci-carousel-autoplay="true"
  data-ci-carousel-autoplay-interval="5000"
  data-ci-carousel-show-thumbnails="true"
  data-ci-carousel-controls-position="center"
  data-ci-carousel-cycle="true"
  data-ci-carousel-zoom-max="4"
  data-ci-carousel-zoom-min="1"
  data-ci-carousel-zoom-step="0.3"
></div>
```

**Auto-initialization (CDN usage):**

```html
<link rel="stylesheet" href="js-cloudimage-carousel.min.css" />
<script src="js-cloudimage-carousel.min.js"></script>
<script>CloudImageCarousel.autoInit();</script>
```

`CloudImageCarousel.autoInit()` scans the DOM for all elements with `data-ci-carousel-images` and initializes each one. It returns an array of `CloudImageCarousel` instances.

```ts
CloudImageCarousel.autoInit(root?: HTMLElement | Document): CloudImageCarousel[];
```

**Attribute mapping:**

| HTML Attribute | Config Property | Type |
|---|---|---|
| `data-ci-carousel-images` | `images` | `JSON string -> ImageSource[]` |
| `data-ci-carousel-autoplay` | `autoplay` | `'true' \| 'false'` |
| `data-ci-carousel-autoplay-interval` | `autoplayInterval` | `string -> number` |
| `data-ci-carousel-cycle` | `cycle` | `'true' \| 'false'` |
| `data-ci-carousel-show-filenames` | `showFilenames` | `'true' \| 'false'` |
| `data-ci-carousel-show-thumbnails` | `showThumbnails` | `'true' \| 'false'` |
| `data-ci-carousel-show-bullets` | `showBullets` | `'true' \| 'false'` |
| `data-ci-carousel-show-controls` | `showControls` | `'true' \| 'false'` |
| `data-ci-carousel-controls-position` | `controlsPosition` | `'center' \| 'bottom'` |
| `data-ci-carousel-theme` | `theme` | `'light' \| 'dark'` |
| `data-ci-carousel-transition` | `transitionEffect` | `'slide' \| 'fade' \| 'zoom' \| 'flip'` |
| `data-ci-carousel-zoom-min` | `zoomMin` | `string -> number` |
| `data-ci-carousel-zoom-max` | `zoomMax` | `string -> number` |
| `data-ci-carousel-zoom-step` | `zoomStep` | `string -> number` |
| `data-ci-carousel-ci-token` | `cloudimage.token` | `string` |
| `data-ci-carousel-ci-api-version` | `cloudimage.apiVersion` | `string` |
| `data-ci-carousel-ci-domain` | `cloudimage.domain` | `string` |
| `data-ci-carousel-ci-limit-factor` | `cloudimage.limitFactor` | `string -> number` |
| `data-ci-carousel-ci-params` | `cloudimage.params` | `string` |

> **Note:** Callback options (`onSlideChange`, `onError`) are only available via the JavaScript API, as functions cannot be expressed as HTML attributes. To attach callbacks to HTML-initialized instances, retrieve the instance from `autoInit()` return value.

---

## 4. Visual Design

### 4.1 CSS Variables (Primary Theming Mechanism)

All visual customization is done via CSS custom properties. Consumers override colors and sizes by setting CSS variables on the `.ci-carousel` container or any ancestor element.

```css
/* === Container === */
--ci-carousel-bg: #efefef;
--ci-carousel-border-radius: 16px;
--ci-carousel-shadow: 0 8px 43px rgba(0, 0, 0, 0.09);

/* === Controls === */
--ci-carousel-btn-size: 44px;
--ci-carousel-btn-bg: rgba(255, 255, 255, 0.9);
--ci-carousel-btn-color: #1a1a1a;
--ci-carousel-btn-hover-bg: rgba(255, 255, 255, 1);
--ci-carousel-btn-border: 1px solid rgba(0, 0, 0, 0.1);
--ci-carousel-btn-radius: 50%;
--ci-carousel-btn-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
--ci-carousel-controls-offset: 16px;
--ci-carousel-controls-transition: opacity 0.3s ease-in-out;

/* === Bullets === */
--ci-carousel-bullet-size: 8px;
--ci-carousel-bullet-bg: rgba(0, 0, 0, 0.4);
--ci-carousel-bullet-active-bg: #1a1a1a;
--ci-carousel-bullet-gap: 15px;
--ci-carousel-bullets-bg: #ffffff;
--ci-carousel-bullets-padding: 12px 16px;

/* === Thumbnails === */
--ci-carousel-thumbnail-width: 88px;
--ci-carousel-thumbnail-height: 66px;
--ci-carousel-thumbnail-radius: 12px;
--ci-carousel-thumbnail-active-border: 0 0 0 2px #000000;
--ci-carousel-thumbnails-bg: #ffffff;
--ci-carousel-thumbnails-gap: 16px;
--ci-carousel-thumbnails-padding: 24px;
--ci-carousel-thumbnails-border: none;

/* === Scroll Hint === */
--ci-carousel-hint-bg: rgba(0, 0, 0, 0.7);
--ci-carousel-hint-color: #ffffff;

/* === Filename Overlay === */
--ci-carousel-filename-color: #ffffff;
--ci-carousel-filename-bg: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
--ci-carousel-filename-size: 13px;

/* === Focus === */
--ci-carousel-focus-color: rgba(66, 153, 225, 0.6);

/* === Transitions === */
--ci-carousel-easing: cubic-bezier(0.16, 1, 0.3, 1);
--ci-carousel-transition-fast: 0.3s;
--ci-carousel-transition-normal: 0.5s;
--ci-carousel-transition-slow: 0.7s;

/* === Fullscreen === */
--ci-carousel-fullscreen-bg: rgba(0, 0, 0, 0.95);
```

**Custom theming example:**

```css
/* Brand-colored carousel */
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

### 4.2 Light & Dark Themes

Themes are implemented as sets of CSS variable overrides. Setting `theme: 'dark'` (or `data-ci-carousel-theme="dark"`) applies the `ci-carousel-theme-dark` class to the container, which activates dark variable values.

**Dark theme overrides:**

```css
.ci-carousel-theme-dark {
  --ci-carousel-bg: #1a1a2e;
  --ci-carousel-btn-bg: rgba(255, 255, 255, 0.15);
  --ci-carousel-btn-color: #f0f0f0;
  --ci-carousel-btn-hover-bg: rgba(255, 255, 255, 0.25);
  --ci-carousel-btn-border: 1px solid rgba(255, 255, 255, 0.1);
  --ci-carousel-bullet-bg: rgba(255, 255, 255, 0.4);
  --ci-carousel-bullet-active-bg: #ffffff;
  --ci-carousel-thumbnails-bg: #1a1a2e;
  --ci-carousel-thumbnail-active-border: 0 0 0 2px #ffffff;
}
```

### 4.3 Reduced Motion

All animations and transitions respect the `prefers-reduced-motion: reduce` media query:

```css
@media (prefers-reduced-motion: reduce) {
  .ci-carousel,
  .ci-carousel * {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

When reduced motion is preferred:
- Slide transitions are instant
- Zoom transitions are instant
- Control hover animations are disabled
- Autoplay still functions but transitions are instant

---

## 5. Zoom & Pan

### 5.1 Implementation

Zoom and pan use CSS transforms on the image wrapper element for GPU-accelerated rendering:

```
<div class="ci-carousel-main">                    <- outer container (overflow: hidden)
  <div class="ci-carousel-images-container">
    <div class="ci-carousel-image-wrapper">        <- receives transform: scale() translate()
      <img class="ci-carousel-image" />
    </div>
  </div>
</div>
```

The image wrapper receives:

```css
transform: scale(var(--zoom)) translate(var(--pan-x), var(--pan-y));
transform-origin: 0 0;
will-change: transform;
```

### 5.2 Input Methods

| Input | Behavior |
|---|---|
| **Ctrl+scroll / Cmd+scroll** | Zoom in/out centered on cursor position |
| **Pinch gesture** | Zoom in/out centered between two touch points |
| **Double-click / Double-tap** | Toggle between 1x and 2x zoom |
| **Click-drag / Touch-drag** | Pan when zoomed in (zoom level > 1) |
| **Keyboard `+` / `=`** | Zoom in |
| **Keyboard `-`** | Zoom out |
| **Keyboard `0`** | Reset zoom |
| **Programmatic** | `carousel.zoomIn()`, `carousel.zoomOut()`, `carousel.resetZoom()` |

### 5.3 Zoom Constraints

- **Min zoom:** 1 (default) — configurable via `zoomMin`
- **Max zoom:** 4 (default) — configurable via `zoomMax`
- **Zoom step:** 0.3 (default) — configurable via `zoomStep`
- **Pan boundaries:** The image cannot be panned beyond its edges; the visible area always shows image content
- **Smooth transitions:** Zoom level changes animate with CSS transition

### 5.4 Scroll / Wheel Gating & Scroll Hint

To prevent accidental zoom when users intend to scroll the page, the library gates wheel-based zoom behind a modifier key:

- **Regular scroll** (no modifier key): passes through to the page — the container does not intercept it
- **Ctrl+scroll** (or **Cmd+scroll** on Mac): triggers zoom in/out centered on cursor position

When a user scrolls without the modifier key over a zoom-enabled container, a **scroll hint toast** appears:

```
+-----------------------------------------+
|                                         |
|              [image]                    |
|                                         |
|       +---------------------------+     |
|       | Ctrl + scroll or pinch    |     |
|       | to zoom                   |     |
|       +---------------------------+     |
+-----------------------------------------+
```

- The hint auto-hides after a brief duration
- `aria-hidden="true"` — decorative hint, not for screen readers

### 5.5 Fullscreen

When navigation controls are shown (default), a fullscreen toggle button appears at the top-right corner of the container. It uses the browser's Fullscreen API with webkit prefixed fallbacks for Safari.

- **Enter fullscreen:** Container expands to fill the viewport with a dark background; image uses `object-fit: contain`
- **Exit fullscreen:** Returns to normal layout
- **Icons:** SVG maximize/minimize icons
- **ARIA:** `aria-label="Toggle fullscreen"`
- **Keyboard:** `F` key toggles fullscreen
- **Focus trapping:** Tab key cycles within the fullscreen container
- **Graceful degradation:** If the Fullscreen API is not supported by the browser, the button is not rendered

---

## 6. Transitions

### 6.1 Available Effects

| Effect | Description |
|---|---|
| **`slide`** | Horizontal slide with previous image sliding out and next image sliding in |
| **`fade`** | Crossfade between images with opacity transition |
| **`zoom`** | Current image scales down while next image scales up into view |
| **`flip`** | 3D card-flip rotation effect |

### 6.2 Transition Timing

All transitions use the configurable easing and duration CSS variables:

```css
--ci-carousel-easing: cubic-bezier(0.16, 1, 0.3, 1);
--ci-carousel-transition-normal: 0.5s;
```

### 6.3 Transition Classes

Each transition effect applies CSS classes to the active and incoming slides:

- `.ci-carousel-slide--active` — currently visible slide
- `.ci-carousel-slide--enter` — incoming slide
- `.ci-carousel-slide--exit` — outgoing slide

The transition effect name is set as a data attribute on the images container, and CSS rules handle the animation per effect type.

---

## 7. React Wrapper API

### 7.1 Entry Point

```ts
import { CloudImageCarouselViewer, useCloudImageCarousel } from 'js-cloudimage-carousel/react';
```

The React wrapper is a **separate entry point** to avoid bundling React for vanilla JS consumers. React is an **optional peer dependency**.

### 7.2 `<CloudImageCarouselViewer>` Component

```tsx
interface CloudImageCarouselViewerProps {
  images?: ImageSource[];
  autoplay?: boolean;
  autoplayInterval?: number;
  cycle?: boolean;
  showFilenames?: boolean;
  showThumbnails?: boolean;
  showBullets?: boolean;
  showControls?: boolean;
  controlsPosition?: 'center' | 'bottom';
  theme?: 'light' | 'dark';
  transitionEffect?: 'slide' | 'fade' | 'zoom' | 'flip';
  zoomMin?: number;
  zoomMax?: number;
  zoomStep?: number;
  cloudimage?: CloudimageConfig;
  onSlideChange?: (index: number) => void;
  onError?: (src: string, index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

**Usage example:**

```tsx
import { CloudImageCarouselViewer } from 'js-cloudimage-carousel/react';

function Gallery() {
  return (
    <CloudImageCarouselViewer
      images={['photo1.jpg', 'photo2.jpg', 'photo3.jpg']}
      theme="dark"
      showBullets
      transitionEffect="slide"
      onSlideChange={(index) => console.log('Slide:', index)}
    />
  );
}
```

### 7.3 `useCloudImageCarousel` Hook

Provides direct access to the vanilla `CloudImageCarousel` instance for imperative control:

```tsx
import { useCloudImageCarousel } from 'js-cloudimage-carousel/react';

function Gallery() {
  const { containerRef, instance } = useCloudImageCarousel({
    images: ['photo1.jpg', 'photo2.jpg'],
    controlsPosition: 'bottom',
  });

  return (
    <>
      <div ref={containerRef} />
      <button onClick={() => instance?.next()}>Next</button>
      <button onClick={() => instance?.zoomIn()}>Zoom In</button>
    </>
  );
}
```

### 7.4 Ref API

The `<CloudImageCarouselViewer>` component forwards a ref exposing instance methods:

```tsx
import { useRef } from 'react';
import { CloudImageCarouselViewer, CloudImageCarouselViewerRef } from 'js-cloudimage-carousel/react';

function Gallery() {
  const ref = useRef<CloudImageCarouselViewerRef>(null);

  return (
    <>
      <CloudImageCarouselViewer ref={ref} images={['photo1.jpg', 'photo2.jpg']} />
      <button onClick={() => ref.current?.next()}>Next</button>
      <button onClick={() => ref.current?.zoomIn()}>Zoom In</button>
      <button onClick={() => ref.current?.setTheme('dark')}>Dark</button>
    </>
  );
}
```

### 7.5 SSR Safety

The React wrapper is SSR-safe:

- The vanilla core is instantiated inside `useEffect` (client-only)
- No `window`, `document`, or `navigator` access during server rendering
- The component renders an empty container `<div>` on the server; hydration attaches the carousel

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

The library targets WCAG 2.1 Level AA conformance across all interactive elements.

### 8.2 Keyboard Navigation

| Key | Action |
|---|---|
| `ArrowLeft` | Navigate to previous slide |
| `ArrowRight` | Navigate to next slide |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `F` | Toggle fullscreen |
| `Escape` | Reset zoom; exit fullscreen |
| `Tab` | Navigate between interactive elements |
| `Shift + Tab` | Navigate backwards between interactive elements |
| `Enter` / `Space` | Activate focused button (thumbnail, bullet, control) |

### 8.3 ARIA Attributes

**Carousel container:**

```html
<div class="ci-carousel" role="region" aria-roledescription="carousel" aria-label="Image carousel">
```

**Slide:**

```html
<div class="ci-carousel-image-wrapper" role="group" aria-roledescription="slide" aria-label="Slide 1 of 5">
  <img class="ci-carousel-image" alt="Living room" />
</div>
```

**Navigation buttons:**

```html
<button class="ci-carousel-prev" aria-label="Previous slide">
<button class="ci-carousel-next" aria-label="Next slide">
<button class="ci-carousel-fullscreen" aria-label="Toggle fullscreen">
```

**Bullet indicators:**

```html
<button class="ci-carousel-bullet" aria-label="Go to slide 1" aria-pressed="true">
```

**Thumbnails:**

```html
<button class="ci-carousel-thumbnail" aria-label="Go to slide 1" aria-pressed="true">
  <img alt="Living room thumbnail" />
</button>
```

### 8.4 Live Region

A visually hidden live region announces slide changes to screen readers:

```html
<div class="ci-carousel-sr-only" aria-live="polite" aria-atomic="true">
  Slide 2 of 5: Kitchen
</div>
```

### 8.5 Focus Management

- **Focus ring:** Interactive elements display a visible focus ring when focused via keyboard (`:focus-visible`), styled with `outline` using `--ci-carousel-focus-color`
- **Focus trapping in fullscreen:** When fullscreen is active, `Tab` cycles within the carousel container to prevent focus from escaping behind the fullscreen overlay
- **Autoplay pause on focus:** When any carousel element receives keyboard focus, autoplay pauses automatically (WCAG 2.2.2)

### 8.6 Reduced Motion

All animations and transitions respect the `prefers-reduced-motion: reduce` media query (see [Section 4.3](#43-reduced-motion)).

---

## 9. Build & Distribution

### 9.1 Build Tool

**Vite** is used as the build tool in library mode, following the pattern established by Scaleflex's `js-cloudimage-hotspot` project.

### 9.2 Output Formats

| Format | File | Use Case |
|---|---|---|
| **ESM** | `dist/js-cloudimage-carousel.esm.js` | Modern bundlers (Webpack, Vite, Rollup) |
| **CJS** | `dist/js-cloudimage-carousel.cjs.js` | Node.js, legacy bundlers |
| **UMD** | `dist/js-cloudimage-carousel.min.js` | CDN `<script>` tag, exposes `window.CloudImageCarousel` |
| **CSS** | `dist/js-cloudimage-carousel.min.css` | Stylesheet (also inlined in UMD) |
| **TypeScript** | `dist/types/index.d.ts` | Type definitions |
| **React ESM** | `dist/react/index.js` | React wrapper (ESM) |
| **React CJS** | `dist/react/index.cjs` | React wrapper (CJS) |
| **React Types** | `dist/types/react/index.d.ts` | React wrapper type definitions |

### 9.3 `package.json` Configuration

```json
{
  "name": "js-cloudimage-carousel",
  "version": "1.0.1",
  "description": "A JavaScript carousel/image viewer plugin by CloudImage (Scaleflex)",
  "license": "MIT",
  "author": "CloudImage by Scaleflex",
  "main": "dist/js-cloudimage-carousel.cjs.js",
  "module": "dist/js-cloudimage-carousel.esm.js",
  "unpkg": "dist/js-cloudimage-carousel.min.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/js-cloudimage-carousel.esm.js",
      "require": "./dist/js-cloudimage-carousel.cjs.js"
    },
    "./react": {
      "types": "./dist/types/react/index.d.ts",
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  }
}
```

### 9.4 npm Scripts

| Script | Description |
|---|---|
| `dev` | Start Vite dev server with demo page |
| `dev:react` | Start Vite dev server with React demo |
| `build` | Build all formats (main bundle + React wrapper + type declarations) |
| `build:bundle` | Build main bundle only (ESM + CJS + UMD) |
| `build:react` | Build React wrapper only |
| `build:demo` | Build GitHub Pages demo site |
| `typecheck` | Run TypeScript type checking |
| `typecheck:emit` | Emit type declarations to `dist/` |
| `test` | Run tests with Vitest |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests with coverage report |
| `lint` | Run ESLint |
| `format` | Format all files with Prettier |
| `format:check` | Check formatting |

### 9.5 Bundle Size Targets

| Bundle | Target |
|---|---|
| Core (UMD, minified + gzipped) | < 15 KB |
| Core (ESM, minified + gzipped) | < 12 KB |
| React wrapper (ESM, minified + gzipped) | < 3 KB |
| CSS (minified + gzipped) | < 5 KB |

### 9.6 Zero Runtime Dependencies

The library has **zero runtime dependencies**. All functionality — zoom/pan, transitions, swipe gestures, fullscreen, lazy loading — is implemented within the library itself.

---

## 10. Project Structure

```
js-cloudimage-carousel/
├── src/
│   ├── index.ts                         # Main entry — exports CloudImageCarousel
│   ├── core/
│   │   ├── carousel.ts                  # Core class: lifecycle, navigation, public API
│   │   ├── config.ts                    # Config merging/validation
│   │   └── types.ts                     # TypeScript interfaces and types
│   ├── controls/
│   │   ├── controls.ts                  # Nav buttons (prev/next), fullscreen, keyboard
│   │   ├── swipe.controls.ts            # Touch/swipe gestures
│   │   └── zoom-pan.controls.ts         # Custom zoom/pan implementation
│   ├── constants/
│   │   ├── classes.constants.ts         # CSS class name strings
│   │   ├── controls.constants.ts        # Control-related constants + keyboard keys
│   │   ├── events.constants.ts          # DOM event name strings
│   │   ├── icons.contants.ts            # SVG icon markup (note: typo is intentional)
│   │   ├── transition.constants.ts      # Transition effect names
│   │   └── index.ts                     # Barrel export
│   ├── fullscreen/
│   │   └── fullscreen.ts               # Fullscreen control (uses Fullscreen API)
│   ├── utils/
│   │   ├── cloudimage.ts               # Cloudimage CDN URL transforms
│   │   ├── dom.utils.ts                # DOM helper functions
│   │   ├── image.utils.ts              # Image URL utilities
│   │   ├── throttling.utils.ts         # Throttle/debounce
│   │   └── index.ts                    # Barrel export
│   ├── styles/
│   │   └── index.css                   # Complete consolidated stylesheet
│   └── react/
│       ├── cloud-image-carousel-viewer.tsx  # React component wrapper
│       ├── use-cloud-image-carousel.ts      # React hook
│       ├── types.ts                         # React-specific types
│       └── index.ts                         # Barrel export
├── demo/
│   ├── index.html                       # Interactive demo page (GitHub Pages)
│   ├── demo.css                         # Demo-specific layout styles
│   ├── demo.ts                          # Demo initialization
│   ├── configurator.ts                  # Interactive playground with code generation
│   └── react-demo/
│       ├── index.html                   # React demo entry
│       ├── App.tsx                      # React demo application
│       └── main.tsx                     # React demo mount
├── examples/
│   ├── vanilla/
│   │   ├── index.html                   # Vanilla JS CodeSandbox example
│   │   ├── index.js                     # Vanilla JS example code
│   │   ├── package.json                 # Example dependencies
│   │   └── sandbox.config.json          # CodeSandbox config
│   └── react/
│       ├── index.html                   # React CodeSandbox example
│       ├── package.json                 # Example dependencies
│       └── src/
│           ├── App.tsx                  # React example app
│           └── main.tsx                 # React example mount
├── config/
│   ├── vite.config.ts                   # Main bundle build config
│   ├── vite.react.config.ts             # React wrapper build config
│   ├── vite.dev.config.ts              # Dev server config
│   ├── vite.react-demo.config.ts       # React demo dev server config
│   └── vite.demo.config.ts             # Demo build config (GitHub Pages)
├── dist/                                # Built output (CDN bundles committed)
│   ├── js-cloudimage-carousel.min.js
│   └── js-cloudimage-carousel.min.js.map
├── .github/
│   └── workflows/
│       └── deploy-pages.yml             # GitHub Pages deployment workflow
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .eslintrc.cjs
├── .prettierrc.json
├── .gitignore
├── LICENSE
├── README.md
├── CHANGELOG.md
└── SPECS.md                             # This file
```

---

## 11. GitHub Pages Demo

The demo site is hosted at `https://scaleflex.github.io/js-cloudimage-carousel/` and deployed via GitHub Actions on push to `master`.

### 11.1 Demo Sections

| Section | Description |
|---|---|
| **Hero** | Gradient background with animated heading, feature pills (Zoom & Pan, 4 Transitions, WCAG 2.1 AA, Dark Mode, React Ready), dual CTA buttons (Get Started / GitHub), and a live carousel viewer |
| **Getting Started** | Side-by-side npm and CDN installation cards with dark-themed code blocks and copy-to-clipboard |
| **Transition Effects** | Interactive comparison of all four transition effects (slide, fade, zoom, flip) with live examples |
| **Themes** | Light and dark theme demonstrations |
| **Interactive Configurator** | Two-panel layout (controls + preview) with toggles and selects for all config options, real-time generated code with copy button |
| **Footer** | Scaleflex logo, links to documentation, GitHub, npm |

### 11.2 Interactive Configurator

A panel that lets visitors:

- Toggle configuration options: autoplay, cycle, show thumbnails, show bullets, show filenames, show controls
- Select values: theme, transition effect, controls position
- Configure zoom: min, max, step
- See the generated JavaScript code update in real-time
- Copy the generated code to clipboard

### 11.3 Demo Images

Demo images are high-quality, royalty-free photographs served via Scaleflex CDN.

---

## 12. Additional Features

### 12.1 Lazy Loading

Images use `IntersectionObserver` to defer loading until the carousel container enters the viewport. A `data-src` attribute holds the real image URL, swapped to `src` when the container becomes visible.

- Enabled by default
- Falls back to eager loading if `IntersectionObserver` is not available
- The container maintains its aspect ratio to prevent layout shift

### 12.2 Cloudimage CDN Integration

When a `cloudimage` configuration is provided with a valid `token`, the library automatically requests optimally-sized images from the Scaleflex Cloudimage CDN.

#### How it works

1. **Detect container width:** Read `container.offsetWidth` to determine the displayed image width
2. **Multiply by device pixel ratio:** `requestedWidth = containerWidth * window.devicePixelRatio`
3. **Round to `limitFactor`:** Round `requestedWidth` up to the nearest `limitFactor` (default: 100px) for better CDN cache hit rates
4. **Build Cloudimage URL:** Construct the optimized image URL
5. **Set as `<img>` src:** The built URL replaces the raw `src` on the image element

#### URL construction

```
https://{token}.{domain}/{apiVersion}/{src}?width={requestedWidth}&{params}
```

With defaults:

```
https://demo.cloudimg.io/v7/https://example.com/photo.jpg?width=800
```

#### When disabled

If `cloudimage` is not provided in the config, or `cloudimage.token` is falsy, the library uses the raw `src` URL unchanged.

#### Resize handling

A `ResizeObserver` monitors the container element. When the container width changes such that the rounded requested width crosses a `limitFactor` boundary, new Cloudimage URLs are built and image `src` attributes are updated.

#### Interaction with zoom

When zoom level > 1, the requested image width accounts for the zoom level to maintain sharpness:

```
requestedWidth = containerWidth * zoomLevel * devicePixelRatio
```

### 12.3 Image Error Handling

When an image fails to load, the carousel:

- Fires the `onError(src, index)` callback if provided
- Displays a graceful fallback state for the broken image
- Does not break navigation — other slides remain fully functional

### 12.4 Autoplay (WCAG 2.2.2 Compliant)

Autoplay advances slides automatically at a configurable interval (default: 3000ms, minimum: 100ms).

- **Pause on hover:** Autoplay pauses when the cursor enters the carousel
- **Pause on focus:** Autoplay pauses when any carousel element receives keyboard focus
- **Resume on leave:** Autoplay resumes when cursor/focus leaves the carousel
- **Programmatic control:** `startAutoplay()`, `stopAutoplay()`, `pauseAutoplay()`, `resumeAutoplay()`
- **WCAG 2.2.2:** Users can pause, stop, or hide auto-updating content

### 12.5 Analytics Hooks

Event callbacks enable integration with analytics platforms:

```js
const carousel = new CloudImageCarousel('#el', {
  images: ['photo1.jpg', 'photo2.jpg'],
  onSlideChange(index) {
    analytics.track('carousel_slide', { index });
  },
  onError(src, index) {
    analytics.track('image_error', { src, index });
  },
});
```

---

## 13. Competitor Feature Matrix

| Feature | js-cloudimage-carousel | Swiper | Slick | Flickity | Splide |
|---|---|---|---|---|---|
| Zero dependencies | Yes | Yes | jQuery | jQuery | Yes |
| TypeScript | Full | Full | No | No | Full |
| Zoom & pan built-in | Yes | Plugin | No | No | No |
| WCAG 2.1 AA | Yes | Partial | No | Partial | Yes |
| CSS variable theming | Yes | Yes | No | No | Partial |
| React wrapper | Yes | Yes | Community | Community | Yes |
| Data-attr init | Yes | No | No | No | Yes |
| Transitions | 4 types | Custom | 1 | 1 | 2 |
| Cloudimage CDN | Native | No | No | No | No |
| Bundle size (gzip) | < 15 KB | ~40 KB | ~25 KB | ~10 KB | ~15 KB |

---

## 14. Roadmap

### v1.1 (Planned)

- **Video slides** — support for video sources alongside images
- **Lightbox mode** — overlay gallery with backdrop
- **Lazy thumbnail loading** — defer thumbnail loading for large galleries
- **RTL support** — right-to-left layout and navigation

### v1.2 (Planned)

- **Virtual slides** — only render visible slides for large galleries (100+ images)
- **Vue wrapper** — `<CICarousel>` component for Vue 3
- **Svelte wrapper** — `<CICarousel>` component for Svelte
- **Adaptive image loading** — connection-aware quality selection
