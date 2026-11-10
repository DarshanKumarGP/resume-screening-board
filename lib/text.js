const LIGATURES = { '\ufb01': 'fi', '\ufb02': 'fl', '\ufb00': 'ff', '\ufb03': 'ffi', '\ufb04': 'ffl' }

export function cleanText(raw) {
  let t = String(raw || '')
  t = t.replace(/\u0000/g, '').replace(/\r\n?/g, '\n')
  t = t.replace(/[\ufb00-\ufb04]/g, (c) => LIGATURES[c])
  t = t.replace(/[\u2022\u25aa\u25cf\u25e6\u2023\u2043\uf0b7\uf0a7\u00b7\u25a0\u2219]/g, '- ')
  t = t.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ')
  t = t.replace(/(\w)-\n(\w)/g, '$1$2')
  t = t.replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n')
  return t.trim()
}

export function snippetAround(text, index, length, before = 55, after = 75) {
  const start = Math.max(0, index - before)
  const end = Math.min(text.length, index + length + after)
  let s = text.slice(start, end).replace(/\s+/g, ' ').trim()
  if (start > 0) s = '...' + s
  if (end < text.length) s = s + '...'
  return s
}
