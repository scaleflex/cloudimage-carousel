import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
