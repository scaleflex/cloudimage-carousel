# Zoom & Pan Controls

## Overview

The carousel's zoom and pan system uses CSS transforms on the active image wrapper for GPU-accelerated rendering. It supports mouse wheel (with Ctrl/Cmd modifier), pinch-to-zoom, double-click/tap, and drag-to-pan.

## Architecture

`ZoomPanControls` is instantiated by the core carousel and receives configuration for min/max zoom and zoom step. It manages:

- Zoom state (`zoom` level, `panX`, `panY`)
- CSS transform application
- Input listeners (wheel, pointer, touch)
- Event emission for zoom changes

## Input Methods

| Input | Behavior |
|---|---|
| **Ctrl+scroll / Cmd+scroll** | Zoom centered on cursor position |
| **Pinch gesture** | Zoom centered between two touch points |
| **Double-click / Double-tap** | Toggle between 1x and 2x |
| **Click-drag / Touch-drag** | Pan when zoom > 1 |

## Wheel Gating

Regular scroll events pass through to the page. Only `Ctrl+scroll` (or `Cmd+scroll` on Mac) triggers zoom. This prevents accidental zoom when users intend to scroll the page.

A scroll hint toast appears when the user scrolls without the modifier key over a zoom-enabled container.

## Pan Boundaries

The image cannot be panned beyond its edges. Pan coordinates are clamped so the visible area always shows image content:

```
maxPanX = (imageWidth * zoom - containerWidth) / 2
maxPanY = (imageHeight * zoom - containerHeight) / 2
```

## Cloudimage Integration

When Cloudimage CDN is enabled, zoom level changes trigger a re-request for higher-resolution images:

```
requestedWidth = containerWidth * zoomLevel * devicePixelRatio
```

This is debounced to avoid excessive CDN requests during continuous zoom.

## Event Emission

`ZoomPanControls` extends a simple event emitter pattern:

```ts
zoomPanControls.on('zoom', (level) => { ... })
zoomPanControls.off('zoom', handler)
```

The carousel uses this to refresh Cloudimage URLs when zoom changes.
