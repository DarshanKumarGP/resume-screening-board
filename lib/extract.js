import { extractText, getDocumentProxy } from 'unpdf'
import mammoth from 'mammoth'

const SUPPORTED = ['pdf', 'docx', 'txt', 'md']

export function extensionOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '')
  return m ? m[1].toLowerCase() : ''
}

export function isSupported(name) {
  return SUPPORTED.includes(extensionOf(name))
}

export async function extractFromBuffer(buffer, fileName) {
  const ext = extensionOf(fileName)
  const warnings = []

  if (ext === 'pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { totalPages, text } = await extractText(pdf, { mergePages: true })
    if (totalPages > 5) warnings.push(`This PDF has ${totalPages} pages, which is long for a resume.`)
    return { text, warnings }
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    if (result.messages && result.messages.length) {
      warnings.push('Some formatting in the Word file could not be converted and may be missing.')
    }
    return { text: result.value, warnings }
  }

  if (ext === 'txt' || ext === 'md') {
    return { text: Buffer.from(buffer).toString('utf8'), warnings }
  }

  if (ext === 'doc') {
    throw new Error('Old .doc files are not supported. Save the file as .docx or PDF and try again.')
  }
  throw new Error(`Files of type .${ext || 'unknown'} are not supported. Use PDF, DOCX or TXT.`)
}
