// Lucide icon SVGs — consistent with @cloudimage/hotspot styling
// All icons use viewBox="0 0 24 24", rendered at 18×18px via CSS

export const ICONS = {
  PREV: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m15 18-6-6 6-6"/>
</svg>`,
  NEXT: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m9 18 6-6-6-6"/>
</svg>`,
  FULLSCREEN: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="15 3 21 3 21 9"/>
  <polyline points="9 21 3 21 3 15"/>
  <line x1="21" x2="14" y1="3" y2="10"/>
  <line x1="3" x2="10" y1="21" y2="14"/>
</svg>`,
  EXIT_FULLSCREEN: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 14 10 14 10 20"/>
  <polyline points="20 10 14 10 14 4"/>
  <line x1="14" x2="21" y1="10" y2="3"/>
  <line x1="3" x2="10" y1="21" y2="14"/>
</svg>`,
  PAUSE: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="14" y="4" width="4" height="16" rx="1"/>
  <rect x="6" y="4" width="4" height="16" rx="1"/>
</svg>`,
  PLAY: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="6 3 20 12 6 21 6 3"/>
</svg>`,
} as const
