# Cloudimage CDN Integration

## Overview

When a `cloudimage` configuration with a valid `token` is provided, the carousel automatically requests optimally-sized images from the Scaleflex Cloudimage CDN. This is entirely optional — without it, raw image URLs are used as-is.

## URL Construction

```
https://{token}.{domain}/{apiVersion}/{src}?width={requestedWidth}&{params}
```

**Example:**

```
https://demo.cloudimg.io/v7/https://example.com/photo.jpg?width=800&q=80
```

## Width Calculation

1. Read `container.offsetWidth`
2. Multiply by `window.devicePixelRatio`
3. Round up to nearest `limitFactor` (default: 100px) for CDN cache efficiency
4. When zoomed: multiply by zoom level for sharpness

```ts
requestedWidth = Math.ceil((containerWidth * dpr * zoom) / limitFactor) * limitFactor
```

## Resize Handling

A `ResizeObserver` monitors the container. When the rounded width crosses a `limitFactor` boundary, new Cloudimage URLs are built for all loaded images.

- Debounced at ~100ms to avoid excessive requests during window resize
- Only affects already-loaded images (lazy-loaded images get correct URLs on load)

## Thumbnails

Thumbnails use a smaller requested width based on the thumbnail container size divided by image count, always at zoom=1.

## Configuration

```ts
interface CloudimageConfig {
  token: string;         // Required — e.g. 'demo'
  apiVersion?: string;   // Default: 'v7'
  domain?: string;       // Default: 'cloudimg.io'
  limitFactor?: number;  // Default: 100
  params?: string;       // Custom URL params — e.g. 'q=80&org_if_sml=1'
}
```

## Files

- `src/utils/cloudimage.ts` — URL transformation and resize handler
