export const CAROUSEL_CONTROLS = {
  PREV: 'prev',
  NEXT: 'next',
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',
  ZOOM_RESET: 'zoom-reset',
  FULLSCREEN: 'fullscreen',
} as const

/** Delay (ms) before auto-hiding navigation controls after interaction */
export const CONTROLS_HIDE_DELAY = 3000 as const

/** Transparent 1x1 SVG used as placeholder while images lazy-load */
export const PLACEHOLDER_SVG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E' as const

export const KEYBOARD_KEYS = {
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ESCAPE: 'Escape',
  PLUS: '+',
  EQUAL: '=',
  MINUS: '-',
  ZERO: '0',
  F: 'f',
} as const
