import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractFromBuffer, isSupported } from '../lib/extract.js'
import { analyzeResume } from '../lib/analyze.js'
import { rankPool } from '../lib/rank.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resumeDir = path.join(root, 'public', 'resumes')
const outFile = path.join(root, 'data', 'processed.json')

const slug = (name) =>
  name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function main() {
  const names = (await fs.readdir(resumeDir))
    .filter((n) => !n.startsWith('.') && !n.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  if (!names.length) {
    console.error('No files found in public/resumes. Copy the resume files there first.')
    process.exit(1)
  }

  const candidates = []
  const usedIds = new Set()
  for (const name of names) {
    let id = slug(name) || 'resume'
    while (usedIds.has(id)) id += '-x'
    usedIds.add(id)
    const source = '/resumes/' + encodeURIComponent(name)

    if (!isSupported(name)) {
      candidates.push(
        analyzeResume({ id, fileName: name, source, rawText: '', extractError: `Unsupported file type (${path.extname(name) || 'none'}). Convert to PDF or DOCX.` })
      )
      continue
    }
    try {
      const buf = await fs.readFile(path.join(resumeDir, name))
      const { text, warnings } = await extractFromBuffer(buf, name)
      candidates.push(analyzeResume({ id, fileName: name, source, rawText: text, extractWarnings: warnings }))
    } catch (err) {
      candidates.push(analyzeResume({ id, fileName: name, source, rawText: '', extractError: `Could not parse this file: ${err.message}` }))
    }
  }

  await fs.writeFile(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), candidates }, null, 1))

  const ranks = rankPool(candidates)
  const byLabel = candidates.reduce((acc, c) => ((acc[c.label] = (acc[c.label] || 0) + 1), acc), {})
  console.log(`Processed ${candidates.length} files -> data/processed.json`)
  console.log('Classification:', byLabel)
  const bad = candidates.filter((c) => c.flags.some((f) => f.level === 'error'))
  const warn = candidates.filter((c) => c.flags.some((f) => f.level === 'warn') && !bad.includes(c))
  if (bad.length) console.log('\nUnreadable (' + bad.length + '):', bad.map((c) => c.fileName).join(', '))
  if (warn.length) console.log('\nWith warnings (' + warn.length + '):', warn.map((c) => c.fileName).join(', '))
  for (const role of ['lca', 'uiux']) {
    console.log(`\nTop 5 for ${role}:`)
    ;[...candidates]
      .sort((a, b) => ranks[role][a.id] - ranks[role][b.id])
      .slice(0, 5)
      .forEach((c) => console.log(`  #${ranks[role][c.id]}  ${String(c.scores[role].score).padStart(5)}  ${c.fileName}  [${c.label}]`))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
