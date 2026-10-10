import { useEffect } from 'react'

const SITE = 'Wordhoard'
const DEFAULT_DESCRIPTION =
  "A learner's dictionary with clear definitions, real examples, UK and US pronunciation and CEFR levels."

/** Sets the browser tab title and the page description for the current view. */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} Dictionary`
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', description || DEFAULT_DESCRIPTION)
  }, [title, description])
}
