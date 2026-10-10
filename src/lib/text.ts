export const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

export const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

export const wordPath = (word: string) => `/word/${encodeURIComponent(word)}`
