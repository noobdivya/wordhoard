import { toast } from './toast'

export type Accent = 'en-GB' | 'en-US'

function synthesise(word: string, accent: Accent) {
  if (!('speechSynthesis' in window)) {
    toast("Audio isn't available in this browser. Use the phonetic spelling instead.")
    return
  }
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = accent
  utterance.rate = 0.85
  const voice = speechSynthesis.getVoices().find((v) => v.lang === accent)
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
}

/** Plays a recording when there is one, otherwise the browser's own voice. */
export function pronounce(word: string, accent: Accent, recording?: string) {
  if (!recording) return synthesise(word, accent)
  // Recordings are Ogg files, which some browsers cannot play
  new Audio(recording).play().catch(() => synthesise(word, accent))
}
