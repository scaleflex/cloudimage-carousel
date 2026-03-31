/**
 * Debounce function to limit the rate at which a function can fire.
 * Returns the debounced function with a .cancel() method for cleanup.
 */
export interface DebouncedFn<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void
  cancel(): void
}

export const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number): DebouncedFn<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const debounced = function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  } as DebouncedFn<T>

  debounced.cancel = () => {
    clearTimeout(timeout)
    timeout = undefined
  }

  return debounced
}
