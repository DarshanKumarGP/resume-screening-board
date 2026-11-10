import { NextResponse } from 'next/server'
import { extractFromBuffer, isSupported } from '../../../lib/extract.js'
import { analyzeResume } from '../../../lib/analyze.js'
import { rankPool } from '../../../lib/rank.js'
import processed from '../../../data/processed.json'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_BYTES = 4 * 1024 * 1024

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request) {
  let form
  try {
    form = await request.formData()
  } catch {
    return fail('The upload could not be read. Send the resume as a file field named "file".')
  }

  const file = form.get('file')
  if (!file || typeof file === 'string') return fail('No file was attached.')
  if (file.size === 0) return fail('The file is empty.')
  if (file.size > MAX_BYTES) return fail('The file is larger than 4 MB. Try a smaller copy of the resume.', 413)
  if (!isSupported(file.name)) return fail('Only PDF, DOCX and TXT resumes are supported.', 415)

  const id = 'upload-' + Date.now().toString(36)
  let candidate
  try {
    const buffer = await file.arrayBuffer()
    const { text, warnings } = await extractFromBuffer(buffer, file.name)
    candidate = analyzeResume({ id, fileName: file.name, source: null, rawText: text, extractWarnings: warnings })
  } catch (err) {
    candidate = analyzeResume({
      id,
      fileName: file.name,
      source: null,
      rawText: '',
      extractError: `Could not parse this file: ${err.message}`
    })
  }

  const pile = [...processed.candidates, candidate]
  const ranks = rankPool(pile)
  const placement = {}
  for (const role of ['lca', 'uiux']) {
    placement[role] = { rank: ranks[role][id], of: pile.length }
  }

  return NextResponse.json({ candidate, placement })
}
