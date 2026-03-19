# Transitions API

## Overview

The carousel supports four transition effects that animate between slides. Each uses CSS-only animations for GPU-accelerated performance.

## Available Effects

### Slide

Horizontal slide: the outgoing slide moves left/right while the incoming slide enters from the opposite direction.

```css
/* Direction-aware: uses data-direction="next"|"prev" on the container */
.ci-carousel-image-wrapper.slide.active {
  transform: translateX(0);
}
.ci-carousel-images-container[data-direction="next"] .ci-carousel-image-wrapper.slide.exiting {
  transform: translateX(-100%);
}
```

### Fade

Crossfade: opacity transition between outgoing and incoming slides.

### Zoom

Scale transition: outgoing slide scales down while incoming scales up.

### Flip

3D card-flip: the container rotates along the Y-axis to reveal the next slide.

## CSS Variables

All transitions respect these timing variables:

```css
--ci-carousel-easing: cubic-bezier(0.16, 1, 0.3, 1);
--ci-carousel-transition-fast: 0.3s;
--ci-carousel-transition-normal: 0.5s;
--ci-carousel-transition-slow: 0.7s;
```

## Implementation

Transitions are implemented via CSS classes applied to `.ci-carousel-image-wrapper`:

1. **Active slide** gets class `active`
2. **Exiting slide** gets class `exiting`
3. **Direction** is set via `data-direction="next"|"prev"` on `.ci-carousel-images-container`
4. The transition effect name (e.g., `slide`, `fade`) is applied as a class on each wrapper

The `transitionend` event (with a timeout fallback) is used to clean up the `exiting` class.

## Reduced Motion

When `prefers-reduced-motion: reduce` is active, all transition durations are set to `0.01ms`, making slide changes instant.
