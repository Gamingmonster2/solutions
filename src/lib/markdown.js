import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true, gfm: true })

/** Markdown -> sanitized HTML, safe to inject with dangerouslySetInnerHTML. */
export function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(String(text ?? '')))
}

/** Strip markdown so long answers do not sound strange when read aloud. */
export function textForSpeech(markdown) {
  return String(markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' code block omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
