# Implementation Record: js-cloudimage-carousel

## Summary

Built `js-cloudimage-carousel` — a zero-dependency TypeScript library for image carousels with zoom/pan, swipe gestures, four transition effects, and WCAG 2.1 AA accessibility. Evolved from a legacy Webpack/Babel/jQuery codebase (`js-carousel`) into a modern Vite-based library following the patterns established by `js-cloudimage-hotspot`.

## Actual Metrics

| Metric | Value |
|--------|-------|
| Tests | 178 across 12 test files |
| ESM bundle | 12.81 KB gzipped |
| CJS bundle | 11.39 KB gzipped |
| UMD bundle | 11.47 KB gzipped |
| React ESM | 10.97 KB gzipped |
| React CJS | 9.47 KB gzipped |
| Source files | 28 (TypeScript + CSS) |
| Source lines | ~3,300 |
| Test lines | ~2,000 |
| Runtime dependencies | Zero |
| Current version | 1.0.1 |

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Vite library mode over Webpack | Faster builds, native ESM/CJS/UMD output, aligns with hotspot project |
| CSS custom properties over JS theming | 30+ `--ci-carousel-*` variables enable consumer customization without JS; follows hotspot's `--ci-hotspot-*` pattern |
| Cleanup stack (`this.cleanups[]`) | All event listeners, observers, and intervals pushed to array; `destroy()` iterates and calls all. Prevents memory leaks. Adopted from hotspot. |
| Immutable config merging | `mergeConfig()` spreads defaults → data attributes → JS options. Never mutates input. Adopted from hotspot's `config.ts` pattern. |
| Dedicated `a11y/` folder | Extracted accessibility utilities (live region, focus trap, ARIA management) into reusable functions. Mirrors hotspot's `src/a11y/` structure. |
| Custom zoom/pan (no library) | Replaced Panzoom.js and Hammer.js dependencies with custom CSS transform-based implementation. Zero dependencies. |
| Separate React entry point | `js-cloudimage-carousel/react` avoids bundling React for vanilla JS consumers. Optional peer dependency. |
| `autoInit()` static method | Scans DOM for `data-ci-carousel-images` attributes, matching hotspot's `autoInit()` pattern for CDN/no-build usage. |

## Issues Encountered & Resolved

| Issue | File | Resolution |
|-------|------|------------|
| Panzoom.js breaking swipe navigation | `swipe.controls.ts` | Replaced Panzoom.js with custom `ZoomPanControls` class using CSS transforms directly |
| Hammer.js increasing bundle size | `swipe.controls.ts` | Replaced with native `touchstart`/`touchend` listeners with velocity and threshold checks |
| Accidental zoom on page scroll | `zoom-pan.controls.ts` | Gated wheel zoom behind `Ctrl/Cmd` modifier key; added scroll hint toast |
| Focus escaping fullscreen overlay | `carousel.ts` | Implemented focus trap via `createFocusTrap()` in `a11y/focus.ts` with `isActive` guard |
| Autoplay violating WCAG 2.2.2 | `controls.ts` | Added pause/play button with `aria-label` updates; pause on hover and keyboard focus |
| Layout shift during slide transitions | `carousel.ts` | Used `getBoundingClientRect()` force-reflow before adding `active` class; `transitionend` + timeout fallback for cleanup |
| `icons.contants.ts` filename typo | — | Documented as intentional in CLAUDE.md; all imports reference the typo consistently |
| React StrictMode double-mount | `carousel.ts` | `destroy()` restores container to original state (removes all classes, ARIA attrs, innerHTML) so re-mount works cleanly |
| Rollup default export warning | `vite.config.ts` | Used `rollupOptions.output.exports: 'default'` for the main bundle |
| Data attribute parsing edge cases | `config.ts` | Boolean strings (`'true'`/`'false'`), numeric strings, JSON arrays all handled with type-safe parsing |
| IntersectionObserver not available | `carousel.ts` | Fallback to eager loading when `IntersectionObserver` is not in `window` |
| Cloudimage CDN cache efficiency | `cloudimage.ts` | `roundToLimitFactor()` rounds requested widths to nearest N pixels (default: 100) to improve CDN hit rates |

---

## Phase 1: Legacy Codebase (Pre-Rewrite)

**Status: SUPERSEDED**

The original `js-carousel` was a vanilla JavaScript project using:

- **Webpack + Babel** for bundling
- **Panzoom.js** for zoom/pan functionality
- **Hammer.js** for touch gesture support
- No TypeScript, no tests, no accessibility

### Original Files

| File | Description |
|------|-------------|
| `src/carousel.js` | Single 800+ line file with all carousel logic |
| `src/carousel.css` | Styles without CSS variables |
| `webpack.config.js` | Webpack 5 build config |
| `.babelrc` | Babel transpilation config |
| `examples/index.html` | Single example page |

### Issues with Legacy

- **Bundle size**: Panzoom.js + Hammer.js added ~30 KB
- **No types**: Zero TypeScript, difficult to maintain
- **No tests**: No test framework configured
- **No accessibility**: No ARIA attributes, no keyboard navigation
- **No theming**: Hard-coded colors, no CSS variables
- **No React**: Vanilla JS only

---

## Phase 2: Project Scaffolding & Build Pipeline

**Status: COMPLETED**

**Goal:** Replace Webpack/Babel with Vite, add TypeScript, configure testing.

### Files

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Rewritten | Vite, vitest, TypeScript, eslint, prettier; `exports` map for `.` and `./react`; `main`, `module`, `unpkg`, `types`, `sideEffects: false` |
| `tsconfig.json` | Created | Target ES2020, module ESNext, moduleResolution bundler, jsx react-jsx, strict |
| `tsconfig.build.json` | Created | Extends base, `emitDeclarationOnly`, excludes tests |
| `tsconfig.react.json` | Created | Extends base, scoped to `src/react` |
| `config/vite.config.ts` | Created | Library mode: ESM + CJS + UMD, global name `CloudImageCarousel` |
| `config/vite.react.config.ts` | Created | Library mode: externalized React, ESM + CJS to `dist/react/` |
| `config/vite.dev.config.ts` | Created | Dev server on port 3300 for demo |
| `config/vite.react-demo.config.ts` | Created | Dev server for React demo |
| `config/vite.demo.config.ts` | Created | Production build for GitHub Pages demo |
| `.eslintrc.cjs` | Created | TypeScript-eslint recommended rules |
| `.prettierrc` | Created | No semicolons, single quotes, 120 width, sorted imports |
| `vitest.config.ts` | Created | jsdom environment, V8 coverage |
| `tests/setup.ts` | Created | `@testing-library/jest-dom/vitest` |

### Results

- `npm run build` produces 3 bundle formats + React bundles + type declarations
- `npm run typecheck` passes
- `npm test` framework ready
- UMD bundle exposes `window.CloudImageCarousel`

---

## Phase 3: Core Types & Configuration

**Status: COMPLETED**

**Goal:** Define TypeScript interfaces and implement config merging/validation.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/core/types.ts` | Created | `CloudImageCarouselConfig`, `CloudImageCarouselInstance`, `ImageSource`, `NormalizedImage`, `CloudimageConfig`, `TransitionEffect`, `ControlsPosition`, `Theme` |
| `src/core/config.ts` | Created | `mergeConfig()` (immutable spread merge), `validateConfig()` (clamp values, fix invalid types), `parseDataAttributes()` (read `data-ci-carousel-*` attributes) |
| `tests/config.test.ts` | Created | 26 tests: merge behavior, validation edge cases, data attribute parsing |

### Results

- Config pipeline: defaults → data attributes → JS options
- All boolean/numeric/string/JSON attributes parsed correctly
- Invalid values (wrong types, out of range) are silently corrected

---

## Phase 4: Utility Layer & CSS Foundation

**Status: COMPLETED**

**Goal:** Build shared utilities and the complete stylesheet.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/utils/dom.utils.ts` | Created | `isBrowser()` SSR guard, `createButton()` helper with class/icon/label/handler |
| `src/utils/image.utils.ts` | Created | `normalizeImage()` (string/object → `{src, alt}`), `getFilenameWithoutExtension()` |
| `src/utils/cloudimage.ts` | Created | `buildCloudimageUrl()`, `roundToLimitFactor()`, `getOptimalWidth()`, `transformImageSrc()`, `createContainerResizeHandler()` (ResizeObserver + boundary detection) |
| `src/utils/throttling.utils.ts` | Created | `throttle()`, `debounce()` utilities |
| `src/utils/index.ts` | Created | Barrel export |
| `src/styles/index.css` | Created | Complete stylesheet: 30+ CSS variables, container/main/images layout, controls, bullets, thumbnails, transitions (slide/fade/zoom/flip), dark theme overrides, fullscreen, scroll hint, filename overlay, error state, `prefers-reduced-motion` |
| `tests/dom.test.ts` | Created | 6 tests: browser detection, button creation |
| `tests/image.test.ts` | Created | 10 tests: filename extraction, image normalization |
| `tests/cloudimage.test.ts` | Created | 17 tests: URL construction, limit factor, DPR, zoom |

### Results

- `roundToLimitFactor(373 * 2, 100)` → `800` confirmed
- `buildCloudimageUrl(src, { token: 'demo' }, 400, 1, 2)` → URL with `width=800` confirmed
- CSS variables enable full theming without JavaScript

---

## Phase 5: Constants & Icons

**Status: COMPLETED**

**Goal:** Extract all magic strings into typed constants.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/constants/classes.constants.ts` | Created | All CSS class names: `CI_HOST_CONTAINER_CLASS`, `CI_CAROUSEL_MAIN_CLASS`, `CI_CAROUSEL_IMAGE_CLASS`, etc. |
| `src/constants/controls.constants.ts` | Created | `KEYBOARD_KEYS` object with all key names |
| `src/constants/events.constants.ts` | Created | DOM event strings: `CLICK_EVENT`, `KEYDOWN_EVENT`, `MOUSEWHEEL_EVENT`, `DBLCLICK_EVENT` |
| `src/constants/icons.contants.ts` | Created | SVG icon markup for prev, next, fullscreen, exit-fullscreen, zoom controls |
| `src/constants/transition.constants.ts` | Created | Transition effect name constants |
| `src/constants/index.ts` | Created | Barrel export |

> **Note:** `icons.contants.ts` has a typo ("contants" missing 's'). This is an established filename — documented in CLAUDE.md as intentional to avoid import breakage.

---

## Phase 6: Core Carousel Class

**Status: COMPLETED**

**Goal:** Implement the main `CloudImageCarousel` class with lifecycle, navigation, and public API.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/core/carousel.ts` | Created | Core class: constructor (container resolution, config merge), `init()` (DOM structure, controls, observers), `loadImages()`, `renderImages()`, `goToSlide()`, `next()`, `prev()`, `zoomIn/Out/Reset()`, `toggleFullscreen()`, autoplay (`start/stop/pause/resume`), `setTheme()`, `destroy()`, `static autoInit()` |
| `src/index.ts` | Created | Re-exports `CloudImageCarousel` class as default and named export |
| `tests/core.test.ts` | Created | 38 tests: constructor validation, DOM structure, navigation, cycling, callbacks, theme, autoplay, destroy, autoInit |

### Key Patterns

- **Cleanup stack**: `this.cleanups: (() => void)[] = []` — every listener/observer/interval pushes its teardown function
- **Lazy loading**: `IntersectionObserver` with `data-src` → `src` swap; fallback to eager loading
- **Live region**: WCAG 4.1.3 — screen reader announces `"Slide N of M: alt text"` on navigation
- **Roving tabindex**: Arrow keys move focus between thumbnail/bullet buttons, updating `tabindex` attributes

---

## Phase 7: Controls, Zoom/Pan & Swipe

**Status: COMPLETED**

**Goal:** Implement navigation controls, keyboard handling, zoom/pan, and swipe gestures.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/controls/controls.ts` | Created | `CarouselControls`: prev/next/fullscreen/autoplay buttons, keyboard handler (`ArrowLeft/Right`, `+/-/0`, `F`, `Escape`), touch show/hide |
| `src/controls/zoom-pan.controls.ts` | Created | `ZoomPanControls`: CSS transform-based zoom/pan, Ctrl+scroll gating, double-click toggle, mouse drag, pinch gesture, scroll hint toast, zoom event emission |
| `src/controls/swipe.controls.ts` | Created | `SwipeControls`: touch swipe detection with threshold, velocity, cooldown, and zoom guard |
| `src/fullscreen/fullscreen.ts` | Created | `createFullscreenControl()`: Fullscreen API wrapper with webkit fallback, state tracking, cleanup |
| `tests/controls.test.ts` | Created | 15 tests: button creation, ARIA labels, keyboard events, autoplay toggle |
| `tests/swipe.test.ts` | Created | 5 tests: swipe detection, threshold, direction, cleanup |

### Key Decisions

- **No Panzoom.js**: Custom implementation using `transform: scale() translate()` with `will-change: transform` for GPU acceleration
- **No Hammer.js**: Native `touchstart`/`touchend` with velocity calculation (`Math.abs(deltaX) / elapsed`)
- **Modifier key gating**: `e.ctrlKey || e.metaKey` required for wheel zoom — prevents accidental zoom on scroll
- **Zoom event emission**: Simple listener pattern (`on/off`) so swipe controls and Cloudimage can react to zoom changes

---

## Phase 8: Accessibility Module

**Status: COMPLETED**

**Goal:** Extract accessibility utilities into dedicated `a11y/` folder following hotspot's pattern.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/a11y/aria.ts` | Created | `createLiveRegion()`, `createKeyboardHints()`, `announceToScreenReader()`, `applyContainerAria()`, `removeContainerAria()` |
| `src/a11y/focus.ts` | Created | `getFocusableElements()`, `createFocusTrap()` with `isActive` guard for fullscreen-only trapping |
| `src/a11y/index.ts` | Created | Barrel export |
| `src/core/carousel.ts` | Refactored | Replaced inline ARIA/focus code with `a11y/` imports |
| `tests/a11y.test.ts` | Created | 18 tests: container ARIA, slide ARIA, live region, thumbnails, bullets accessibility |
| `tests/a11y-utils.test.ts` | Created | 16 tests: live region creation, keyboard hints, announcements, focus trap, focusable elements |

### WCAG 2.1 AA Coverage

| Requirement | Implementation |
|-------------|----------------|
| **1.3.1 Info and Relationships** | `role="region"`, `aria-roledescription="carousel"`, `role="list"`/`role="listitem"` for slides |
| **2.1.1 Keyboard** | Full arrow key navigation, zoom keys, fullscreen key |
| **2.2.2 Pause, Stop, Hide** | Autoplay pause/play button, pause on focus |
| **2.4.3 Focus Order** | Roving tabindex in bullet/thumbnail groups |
| **2.4.7 Focus Visible** | `:focus-visible` outline with `--ci-carousel-focus-color` |
| **4.1.2 Name, Role, Value** | `aria-label` on all buttons, `aria-pressed` on bullets/thumbnails |
| **4.1.3 Status Messages** | Live region with `aria-live="polite"` for slide announcements |

---

## Phase 9: React Wrapper

**Status: COMPLETED**

**Goal:** Create React component, hook, and ref API as a separate entry point.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/react/cloud-image-carousel-viewer.tsx` | Created | `<CloudImageCarouselViewer>` component with `forwardRef`, creates vanilla instance in `useEffect` |
| `src/react/use-cloud-image-carousel.ts` | Created | `useCloudImageCarousel()` hook returning `{ containerRef, instance }` |
| `src/react/types.ts` | Created | `CloudImageCarouselViewerProps`, `CloudImageCarouselViewerRef` |
| `src/react/index.ts` | Created | Barrel export |

### Key Patterns

- **SSR safe**: Instance created in `useEffect` — no DOM access during server render
- **StrictMode safe**: `destroy()` in `useEffect` cleanup restores container; re-mount works cleanly
- **Ref API**: `forwardRef` + `useImperativeHandle` exposes `next()`, `prev()`, `zoomIn()`, etc.

---

## Phase 10: Demo & Deployment

**Status: COMPLETED**

**Goal:** Build interactive demo with configurator and set up GitHub Pages deployment.

### Files

| File | Action | Description |
|------|--------|-------------|
| `demo/index.html` | Created | Full demo page: hero, getting started, transitions, themes, configurator, footer |
| `demo/demo.ts` | Created | Demo initialization: multiple carousel instances with different configs |
| `demo/demo.css` | Created | Demo-specific layout styles, responsive design |
| `demo/configurator.ts` | Created | Interactive playground: toggles and selects update carousel config in real-time, generated code with copy button |
| `demo/react-demo/` | Created | React demo with `App.tsx`, component and hook examples |
| `.github/workflows/deploy-pages.yml` | Created | GitHub Actions: push to `master` → build demo → deploy to GitHub Pages |
| `config/vite.demo.config.ts` | Created | Production build: `base: '/js-cloudimage-carousel/'`, outputs to `dist-demo/` |

### Results

- `npm run build:demo` produces `dist-demo/` (38 KB HTML + 57 KB JS + 21 KB CSS)
- GitHub Pages URL: `https://scaleflex.github.io/js-cloudimage-carousel/`

---

## Phase 11: Documentation & Quality Alignment

**Status: COMPLETED**

**Goal:** Align project documentation and quality tooling with hotspot project.

### Files

| File | Action | Description |
|------|--------|-------------|
| `README.md` | Updated | Full API reference, React usage, theming, accessibility, CDN URL, buy-me-a-coffee |
| `CHANGELOG.md` | Created | Version history for 1.0.0 and 1.0.1 |
| `SPECS.md` | Created | Comprehensive specification: 14 sections covering API, visual design, zoom/pan, transitions, React, accessibility, build, structure, demo, roadmap |
| `IMPLEMENTATION.md` | Created | This file |
| `.eslintrc.cjs` | Created | Matches hotspot's ESLint config |
| `tsconfig.react.json` | Created | Dedicated React type emit config |
| `docs/transitions-api.md` | Created | Transition effects documentation |
| `docs/zoom-pan-controls.md` | Created | Zoom/pan architecture documentation |
| `docs/cloudimage-integration.md` | Created | CDN integration documentation |

### Test Coverage Expansion

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `tests/core.test.ts` | 38 | Constructor, init, navigation, cycling, callbacks, theme, autoplay, destroy, autoInit |
| `tests/config.test.ts` | 26 | Config merging, validation, data attribute parsing |
| `tests/a11y.test.ts` | 18 | Container ARIA, slide ARIA, live region, thumbnails, bullets |
| `tests/cloudimage.test.ts` | 17 | URL construction, limit factor, DPR, zoom, custom params |
| `tests/a11y-utils.test.ts` | 16 | Live region, keyboard hints, announcements, focus trap |
| `tests/controls.test.ts` | 15 | Navigation buttons, keyboard controls, autoplay button |
| `tests/edge-cases.test.ts` | 11 | Single image, empty array, boundaries, rapid ops, double destroy, error handling |
| `tests/image.test.ts` | 10 | Filename extraction, image normalization |
| `tests/data-attr.test.ts` | 9 | Data attribute init, boolean/numeric parsing, override priority, scoped autoInit |
| `tests/integration.test.ts` | 7 | Full lifecycle, thumbnails+bullets, theme switching, loadImages, multi-autoInit |
| `tests/dom.test.ts` | 6 | Browser detection, button creation |
| `tests/swipe.test.ts` | 5 | Swipe detection, threshold, direction, cleanup |
| **Total** | **178** | |

---

## Project Evolution Timeline

| Date | Event |
|------|-------|
| Initial | Legacy `js-carousel` created with Webpack, Babel, Panzoom.js, Hammer.js |
| Early development | Added zoom/pan, fullscreen, thumbnail options, configuration system |
| PCL-575 | Major rewrite: TypeScript, Vite, modular architecture, CSS variables |
| 2026-03-15 | v1.0.0 published to npm as `js-cloudimage-carousel` |
| 2026-03-17 | v1.0.1: React wrapper, data attributes, accessibility, theming, documentation |
| 2026-03-19 | Quality alignment: a11y module, ESLint, docs, test expansion (113 → 178 tests), GitHub Pages, SPECS.md |

---

## Hotspot Pattern Adoption Checklist

| Pattern | Status | Notes |
|---------|--------|-------|
| Cleanup stack (`this.cleanups[]`) | Adopted | All listeners, observers, intervals use cleanup stack |
| CSS variables for theming | Adopted | `--ci-carousel-*` prefix, 30+ variables |
| Modular architecture | Adopted | `a11y/`, `controls/`, `constants/`, `fullscreen/`, `utils/`, `react/` |
| Config merging/validation | Adopted | Immutable spread merge, separate `config.ts` |
| WCAG 2.1 AA accessibility | Adopted | Keyboard nav, ARIA, live region, focus management, reduced motion |
| Vitest + jsdom testing | Adopted | 178 tests across 12 files |
| Vite library mode | Adopted | ESM + CJS + UMD outputs, sourcemaps |
| React wrapper (separate entry) | Adopted | `js-cloudimage-carousel/react` with component, hook, ref API |
| GitHub Pages demo | Adopted | `deploy-pages.yml` workflow, `build:demo` script |
| Documentation suite | Adopted | README, CHANGELOG, SPECS, IMPLEMENTATION, docs/ folder |
| `sideEffects: false` | Adopted | Tree-shaking hint in package.json |
| ESLint configuration | Adopted | `.eslintrc.cjs` matching hotspot |
