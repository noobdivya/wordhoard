const KEY = 'wh-theme'

/** Switches between light and dark and remembers the choice. index.html applies it before first paint. */
export function toggleTheme() {
  const root = document.documentElement
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches
  const next = dark ? 'light' : 'dark'
  root.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* applies to this visit only */
  }
}
