/**
 * Get the filename without the extension
 * @param {string} url - The URL of the image
 * @returns {string} - The filename without the extension
 */
const getFilenameWithoutExtension = (url) => {
  const filename = url.split('/').pop()
  return filename.split('.')[0]
}

export { getFilenameWithoutExtension }
