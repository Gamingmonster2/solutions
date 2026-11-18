/** Thin wrappers around the browser Speech APIs (ported from chat.txt). */
import { textForSpeech } from '@/lib/markdown'

export function speechSupported() {
  return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

function pickVoice(text) {
  const voices = window.speechSynthesis.getVoices() ?? []
  const isArabic = /[\u0600-\u06FF]/.test(text)

  if (isArabic) {
    return voices.find((voice) => /ar(-|_)/i.test(voice.lang)) ?? voices.find((voice) => /ar/i.test(voice.lang)) ?? null
  }
  return voices.find((voice) => /en-US/i.test(voice.lang))
    ?? voices.find((voice) => /en-GB/i.test(voice.lang))
    ?? voices.find((voice) => /en/i.test(voice.lang))
    ?? null
}

export function speakText(text, { rate = 1, lang = 'en', onEnd, onError } = {}) {
  if (!speechSupported()) return null
  const clean = textForSpeech(text)
  if (!clean) return null

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = rate
  utterance.pitch = 1
  utterance.volume = 1

  const voice = pickVoice(clean)
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  } else {
    utterance.lang = /[\u0600-\u06FF]/.test(clean) ? 'ar-SA' : lang === 'ar' ? 'ar-SA' : 'en-US'
  }

  utterance.onend = () => onEnd?.()
  utterance.onerror = (event) => onError?.(event)
  window.speechSynthesis.speak(utterance)
  return utterance
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel()
}

export function createRecognition({ lang = 'ar-SA', onResult, onStart, onEnd, onError } = {}) {
  const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = lang

  recognition.onstart = () => onStart?.()
  recognition.onresult = (event) => {
    let transcript = ''
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript
    }
    onResult?.(transcript)
  }
  recognition.onerror = (event) => {
    onError?.(event)
    onEnd?.()
  }
  recognition.onend = () => onEnd?.()
  return recognition
}
