import assert from 'node:assert/strict'
import { analyzeResume, classify } from '../lib/analyze.js'
import { rankPool } from '../lib/rank.js'
import { rangeInLine, mergedMonths } from '../lib/dates.js'
import { splitSections } from '../lib/sections.js'

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log('ok   ', name)
  } catch (e) {
    console.error('FAIL ', name, '\n      ', e.message)
    process.exitCode = 1
  }
}

test('date range with months', () => {
  const r = rangeInLine('Analyst, Acme   Jan 2020 - Dec 2020')
  assert.ok(r)
  assert.equal(r.end - r.start, 11)
})

test('year-only range counts about the right number of months', () => {
  const r = rangeInLine('2019 - 2021')
  assert.equal(r.months, 24)
})

test('overlapping jobs are not double counted', () => {
  const a = rangeInLine('Jan 2020 - Dec 2021')
  const b = rangeInLine('Jun 2021 - Dec 2022')
  const merged = mergedMonths([a, b])
  assert.ok(merged < a.months + b.months)
  assert.equal(merged, 35)
})

test('section headings are recognised', () => {
  const { found } = splitSections('Name\nWORK EXPERIENCE\nx\nTechnical Skills:\ny\nEducation\nz')
  assert.deepEqual(found, ['experience', 'skills', 'education'])
})

const lcaText = `EXPERIENCE
LCA Consultant - Acme   Jan 2020 - Dec 2022
- Ran 4 LCA projects in GaBi following ISO 14040 and ISO 14044, built LCI models
EDUCATION
M.Tech Environmental Engineering 2018 - 2020
SKILLS
GaBi, SimaPro`

const uxText = `EXPERIENCE
Design Intern - Studio   Jun 2024 - Dec 2024
- User research, usability testing, wireframes, Figma prototypes, design system
EDUCATION
B.Des Design 2020 - 2024
SKILLS
Figma, Adobe XD
Portfolio: behance.net/me`

test('an LCA resume is classified as LCA', () => {
  const c = analyzeResume({ id: 'a', fileName: 'a.pdf', rawText: lcaText })
  assert.equal(c.label, 'lca')
  assert.ok(c.scores.lca.score > c.scores.uiux.score)
})

test('a UX resume is classified as UI/UX', () => {
  const c = analyzeResume({ id: 'b', fileName: 'b.pdf', rawText: uxText })
  assert.equal(c.label, 'uiux')
})

test('an unrelated resume is neither', () => {
  const c = analyzeResume({ id: 'c', fileName: 'c.pdf', rawText: 'EXPERIENCE\nBackend developer Jan 2021 - Dec 2022\nNode.js, SQL\nEDUCATION\nB.Tech Computer Science' })
  assert.equal(c.label, 'unsure')
})

test('empty text is reported as an error, not a crash', () => {
  const c = analyzeResume({ id: 'd', fileName: 'd.pdf', rawText: '' })
  assert.equal(c.label, 'unsure')
  assert.ok(c.flags.some((f) => f.level === 'error'))
})

test('ranking orders by score and shares rank on ties', () => {
  const a = analyzeResume({ id: 'a', fileName: 'a.pdf', rawText: lcaText })
  const b = analyzeResume({ id: 'b', fileName: 'b.pdf', rawText: uxText })
  const ranks = rankPool([b, a])
  assert.equal(ranks.lca.a, 1)
  assert.equal(ranks.uiux.b, 1)
})

test('classify handles the close-call case', () => {
  const part = (s) => ({ score: s, parts: [], relevantYears: 0 })
  assert.equal(classify({ lca: part(40), uiux: part(38) }).label, 'both')
  assert.equal(classify({ lca: part(30), uiux: part(24) }).label, 'unsure')
})

console.log(`\n${passed} passed`)
