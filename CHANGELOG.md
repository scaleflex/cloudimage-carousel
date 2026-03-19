# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-17

### Changed

- Renamed package from `js-carousel` to `js-cloudimage-carousel`
- Migrated build system from Webpack/Babel to Vite (library mode) with ESM + CJS + UMD outputs
- Rewrote codebase in TypeScript
- Consolidated all CSS into single stylesheet with CSS custom properties for theming
- Adopted cleanup stack pattern (`this.cleanups[]`) for robust teardown (following hotspot pattern)
- Immutable config objects via spread-based `mergeConfig()` pattern

### Added

- **React wrapper** — `<CloudImageCarouselViewer>` component, `useCloudImageCarousel` hook, and ref API via `js-cloudimage-carousel/react`
- **HTML data-attribute initialization** — `data-ci-carousel-*` attributes with `CloudImageCarousel.autoInit()`
- **Four transition effects** — slide, fade, zoom, and flip with configurable easing via CSS variables
- **CSS variable theming** — light and dark themes with 30+ customizable `--ci-carousel-*` properties
- **Zoom & pan** — Ctrl+scroll, double-click, pinch-to-zoom, drag-to-pan with configurable min/max/step
- **Autoplay** — with pause/resume controls (WCAG 2.2.2 compliant)
- **Fullscreen mode** — via Fullscreen API with focus trapping for accessibility
- **Accessibility (WCAG 2.1 AA)** — full keyboard navigation, ARIA attributes, focus management, live region announcements, `prefers-reduced-motion` support
- **Cloudimage CDN integration** — optional responsive image loading with automatic `srcset` generation
- **Lazy loading** — IntersectionObserver-based with eager fallback
- **Image error handling** — graceful fallback for broken images with optional `onError` callback
- **Swipe gestures** — touch support for mobile navigation
- **Thumbnail strip** — with configurable visibility and active state
- **Bullet indicators** — with `aria-pressed` for accessibility
- **Filename overlay** — optional filename display on each slide
- **TypeScript declarations** — full type definitions for all exports
- **Comprehensive demo** — interactive showcase, configurator, and React demo
- **GitHub Pages deployment** — automated via GitHub Actions

## [1.0.0] - 2026-03-15

### Features

- **Image carousel** — navigate between images with thumbnails, bullets, or swipe gestures
- **Zoom & pan** — CSS transform-based with mouse wheel, pinch-to-zoom, double-click, drag-to-pan
- **Transitions** — slide and fade effects
- **Navigation controls** — prev/next arrows and fullscreen toggle
- **Cloudimage CDN** — optional responsive image loading via Scaleflex CDN
- **Zero runtime dependencies**
- **Output formats** — ESM, CJS, and UMD bundles

[1.0.1]: https://github.com/scaleflex/js-cloudimage-carousel/releases/tag/v1.0.1
[1.0.0]: https://github.com/scaleflex/js-cloudimage-carousel/releases/tag/v1.0.0
