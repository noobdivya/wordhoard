import { useSyncExternalStore } from 'react'

let message: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function emit(next: string | null) {
  message = next
  listeners.forEach((l) => l())
}

/** Shows a short status message at the bottom of the screen. */
export function toast(text: string) {
  clearTimeout(timer)
  emit(text)
  timer = setTimeout(() => emit(null), 2600)
}

export function useToastMessage() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => message,
  )
}
