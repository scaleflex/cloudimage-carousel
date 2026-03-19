import { describe, it, expect } from 'vitest'

import { getFilenameWithoutExtension, normalizeImage } from '../src/utils/image.utils'

describe('getFilenameWithoutExtension', () => {
  it('extracts filename from URL', () => {
    expect(getFilenameWithoutExtension('https://example.com/photos/sunset.jpg')).toBe('sunset')
  })

  it('handles URL without extension', () => {
    expect(getFilenameWithoutExtension('https://example.com/photos/sunset')).toBe('sunset')
  })

  it('handles filename with multiple dots', () => {
    expect(getFilenameWithoutExtension('https://example.com/my.photo.png')).toBe('my')
  })

  it('handles empty string', () => {
    expect(getFilenameWithoutExtension('')).toBe('')
  })

  it('handles simple filename', () => {
    expect(getFilenameWithoutExtension('image.png')).toBe('image')
  })
})

describe('normalizeImage', () => {
  it('normalizes a string to { src, alt }', () => {
    expect(normalizeImage('photo.jpg', 0)).toEqual({ src: 'photo.jpg', alt: 'Image 1' })
  })

  it('normalizes a string with correct index', () => {
    expect(normalizeImage('photo.jpg', 2)).toEqual({ src: 'photo.jpg', alt: 'Image 3' })
  })

  it('normalizes an object with src and alt', () => {
    expect(normalizeImage({ src: 'photo.jpg', alt: 'Sunset' }, 0)).toEqual({ src: 'photo.jpg', alt: 'Sunset' })
  })

  it('provides default alt for object without alt', () => {
    expect(normalizeImage({ src: 'photo.jpg' }, 1)).toEqual({ src: 'photo.jpg', alt: 'Image 2' })
  })

  it('handles object with empty src', () => {
    expect(normalizeImage({ src: '' }, 0)).toEqual({ src: '', alt: 'Image 1' })
  })
})
