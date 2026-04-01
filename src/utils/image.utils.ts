import { ImageSource } from "../core/types";

/**
 * Get the filename without the extension from a URL.
 */
export const getFilenameWithoutExtension = (url: string): string => {
  const filename = url.split('/').pop() ?? ''
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.slice(0, lastDot) : filename
}


export const normalizeImage = (entry: ImageSource, index: number): { src: string; alt: string } => {
  if (typeof entry === 'string') {
    return { src: entry, alt: `Image ${index + 1}` }
  }
  return {
    src: entry.src || '',
    alt: entry.alt || `Image ${index + 1}`,
  }
}