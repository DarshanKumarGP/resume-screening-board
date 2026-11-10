import { ROLES, ROLE_IDS, CLASSIFY, MIN_TEXT_CHARS } from './config.js'
import { cleanText, snippetAround } from './text.js'
import { splitSections } from './sections.js'
import { findRanges, mergedMonths, label as rangeLabel } from './dates.js'

const regexCache = new Map()

function termRegex(term) {
  if (regexCache.has(term)) return regexCache.get(term)
  const parts = term.aliases.map((a) =>
    a
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '[\\s\\-]*')
  )
  const re = new RegExp(`(?<![a-z0-9])(?:${parts.join('|')})s?(?![a-z0-9])`, 'gi')
  regexCache.set(term, re)
  return re
}

function countMatches(text, term) {
  const re = termRegex(term)
  re.lastIndex = 0
  const hits = []
  let m
  while ((m = re.exec(text)) !== null) {
    hits.push({ index: m.index, length: m[0].length })
    if (m[0].length === 0) re.lastIndex++
  }
  return hits
}

function matchTerms(group, text, body) {
  const matched = []
  let credit = 0
  for (const term of group.terms) {
    const all = countMatches(text, term)
    if (!all.length) continue
    const inBody = countMatches(body, term)
    const skillsOnly = inBody.length === 0
    const source = skillsOnly ? text : body
    const first = skillsOnly ? all[0] : inBody[0]
    matched.push({
      name: term.name,
      count: all.length,
      skillsOnly,
      snippet: snippetAround(source, first.index, first.length)
    })
    credit += term.weight * (skillsOnly ? 0.7 : 1)
  }
  return { matched, credit }
}

function textMatchesGroups(role, groupKeys, text) {
  for (const g of role.groups) {
    if (!groupKeys.includes(g.key)) continue
    for (const t of g.terms) {
      if (countMatches(text, t).length) return true
    }
  }
  return false
}

function buildEntries(lines, ranges) {
  return ranges.map((r, i) => {
    const prev = ranges[i - 1]
    const next = ranges[i + 1]
    const above = lines[r.line - 1]
    const useAbove = !!(above && above.trim() && !/^[-*]\s/.test(above.trim()) && (!prev || r.line - 1 > prev.line))
    const start = useAbove ? r.line - 1 : r.line
    const end = next ? Math.max(r.line + 1, next.line - 1) : lines.length
    return {
      title: (useAbove ? above : lines[r.line]).replace(/\s+/g, ' ').trim().slice(0, 110),
      period: rangeLabel(r),
      start: r.start,
      end: r.end,
      months: r.months,
      text: lines.slice(start, end).join('\n')
    }
  })
}

function projectBlocks(lines) {
  const blocks = []
  let cur = null
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const isBullet = /^[-*]\s/.test(line)
    const looksLikeTitle = !isBullet && line.length <= 90 && /^[A-Z0-9(]/.test(line)
    if (looksLikeTitle || !cur) {
      cur = { title: line.slice(0, 110), text: line }
      blocks.push(cur)
    } else {
      cur.text += '\n' + line
    }
  }
  return blocks
}

const DEGREE_WORDS = /\b(ph\.?\s?d|doctorate|bachelor'?s?|master'?s?|diploma|post[\s-]?graduate|pgdm|undergraduate|graduate)\b/i
const DEGREE_ABBR = /\b(B\.?\s?Tech|M\.?\s?Tech|B\.?\s?E\.?|M\.?\s?E\.?|B\.?\s?Sc\.?|M\.?\s?Sc\.?|B\.?\s?Des\.?|M\.?\s?Des\.?|B\.?\s?A\.?|M\.?\s?A\.?|B\.?\s?Com\.?|M\.?\s?Com\.?|B\.?\s?Arch\.?|M\.?\s?Arch\.?|MBA|BBA|BCA|MCA|B\.?\s?F\.?\s?A|M\.?\s?F\.?\s?A)(?![A-Za-z])/

function degreeLevel(line) {
  if (/ph\.?\s?d|doctorate/i.test(line)) return 4
  if (/master|post[\s-]?graduate|pgdm|\bM\.?\s?(Tech|E|Sc|Des|A|Com|Arch|FA)\b|\bMBA\b|\bMCA\b/i.test(line)) return 3
  if (/bachelor|undergraduate|\bB\.?\s?(Tech|E|Sc|Des|A|Com|Arch|FA)\b|\bBBA\b|\bBCA\b/i.test(line)) return 2
  if (/diploma/i.test(line)) return 1
  return 2
}

function parseEducation(eduLines) {
  const out = []
  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i].trim()
    if (!line) continue
    if (DEGREE_WORDS.test(line) || DEGREE_ABBR.test(line)) {
      const context = [line, eduLines[i + 1] || ''].join(' ').replace(/\s+/g, ' ').trim()
      out.push({ text: line.slice(0, 150), context, level: degreeLevel(line) })
    }
    if (out.length >= 4) break
  }
  return out
}

function educationFraction(role, degrees) {
  if (!degrees.length) return { fraction: 0, note: 'No degree line recognised.' }
  const best = Math.max(...degrees.map((d) => d.level))
  const ctx = degrees.map((d) => d.context).join(' ')
  const levelPart = best >= 2 ? 0.5 : 0.25
  let fieldPart = 0
  let fieldNote = 'field not related to the role'
  if (role.education.strong.test(ctx)) {
    fieldPart = 0.5
    fieldNote = 'field closely related to the role'
  } else if (role.education.ok.test(ctx)) {
    fieldPart = 0.3
    fieldNote = 'general science or engineering field'
  }
  return { fraction: levelPart + fieldPart, note: `Degree found, ${fieldNote}.` }
}

function skillTokens(lines) {
  const tokens = []
  for (const line of lines) {
    const cleaned = line.replace(/^[-*]\s*/, '').replace(/^[A-Za-z ]{2,25}:\s*/, '')
    for (const piece of cleaned.split(/[,|;/\u2022]/)) {
      const t = piece.trim()
      if (t.length >= 2 && t.length <= 30 && !tokens.includes(t)) tokens.push(t)
      if (tokens.length >= 30) return tokens
    }
  }
  return tokens
}

function extractLinks(text) {
  const re = /(?:https?:\/\/|www\.)[^\s)>\]]+|(?:linkedin|github|behance|dribbble)\.com\/[^\s)>\]]*/gi
  const found = []
  for (const m of text.matchAll(re)) {
    const url = m[0].replace(/[.,;]+$/, '')
    if (!found.includes(url)) found.push(url)
    if (found.length >= 8) break
  }
  return found
}

function statedYears(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|professional\s+|total\s+|industry\s+|work\s+)*experience/i)
  return m ? Number(m[1]) : null
}

function scoreRole(role, ctx) {
  const parts = []
  let total = 0
  const relevantEntries = ctx.entries.filter(
    (e) => textMatchesGroups(role, role.relevanceGroups, e.text) || role.titleRe.test(e.title)
  )
  const relevantBlocks = ctx.blocks.filter(
    (b) => textMatchesGroups(role, role.relevanceGroups, b.text) || role.titleRe.test(b.title)
  )
  const relevantMonths = mergedMonths(relevantEntries.map((e) => ({ start: e.start, end: e.end })))
  const relevantYears = Math.round((relevantMonths / 12) * 10) / 10
  let projectCount = relevantEntries.length + relevantBlocks.length

  for (const g of role.groups) {
    let fraction = 0
    let matched = []
    let note = ''
    if (g.kind === 'terms') {
      const r = matchTerms(g, ctx.text, ctx.body)
      matched = r.matched
      fraction = Math.min(1, r.credit / g.target)
      note = matched.length ? `${matched.length} of ${g.terms.length} terms found.` : 'None of the expected terms were found.'
    } else if (g.kind === 'experience') {
      fraction = Math.min(1, relevantYears / g.fullYears)
      note = relevantEntries.length
        ? `${relevantYears} years across ${relevantEntries.length} relevant dated role${relevantEntries.length > 1 ? 's' : ''}.`
        : 'No dated role mentioning the role keywords was found.'
    } else if (g.kind === 'projects') {
      let count = projectCount
      if (g.projectRe) {
        const m = ctx.text.match(g.projectRe)
        if (m) count = Math.max(count, Number(m[1]))
      }
      projectCount = count
      fraction = Math.min(1, count / g.fullCount)
      note = `${count} relevant project or role${count === 1 ? '' : 's'} found (full marks at ${g.fullCount}).`
    } else if (g.kind === 'education') {
      const e = educationFraction(role, ctx.degrees)
      fraction = e.fraction
      note = e.note
    }
    const points = Math.round(fraction * g.max * 10) / 10
    total += points
    parts.push({ key: g.key, label: g.label, max: g.max, points, why: g.why, note, matched })
  }

  return {
    score: Math.round(total * 10) / 10,
    parts,
    relevantYears,
    projectCount,
    relevantEntries: relevantEntries.map((e) => ({ title: e.title, period: e.period }))
  }
}

export function classify(scores, readable = true) {
  const { strong, weak, margin } = CLASSIFY
  const l = scores.lca.score
  const u = scores.uiux.score
  if (!readable) return { label: 'unsure', reason: 'The file could not be read, so no comparison was made.' }
  const gap = Math.round(Math.abs(l - u) * 10) / 10
  if (Math.max(l, u) < weak) {
    return { label: 'unsure', reason: `Both scores are below ${weak} (LCA ${l}, UI/UX ${u}), so the resume matches neither role.` }
  }
  if (l >= strong && u >= strong) {
    return { label: 'both', reason: `Both roles score ${strong} or higher (LCA ${l}, UI/UX ${u}).` }
  }
  if (l >= strong && l - u >= margin) {
    return { label: 'lca', reason: `LCA ${l} leads UI/UX ${u} by ${gap} points.` }
  }
  if (u >= strong && u - l >= margin) {
    return { label: 'uiux', reason: `UI/UX ${u} leads LCA ${l} by ${gap} points.` }
  }
  return {
    label: 'unsure',
    reason: `No role clears the bar with a ${margin} point lead (LCA ${l}, UI/UX ${u}). Needs a human look.`
  }
}

export function analyzeResume({ id, fileName, source, rawText, extractWarnings = [], extractError = null }) {
  const flags = []
  extractWarnings.forEach((m) => flags.push({ level: 'warn', message: m }))

  const text = cleanText(rawText)
  const base = { id, fileName, source: source || null, chars: text.length }

  if (extractError || text.length === 0) {
    flags.unshift({
      level: 'error',
      message: extractError || 'No text could be read from this file. It may be a scanned image; this prototype does not do OCR.'
    })
    const empty = { score: 0, parts: [], relevantYears: 0, projectCount: 0, relevantEntries: [] }
    const scores = { lca: empty, uiux: empty }
    const c = classify(scores, false)
    return {
      ...base,
      text: '',
      sectionsFound: [],
      education: [],
      skillsListed: [],
      links: [],
      experience: { totalYears: 0, statedYears: null, entries: [] },
      projects: [],
      scores,
      label: c.label,
      labelReason: c.reason,
      flags
    }
  }

  if (text.length < MIN_TEXT_CHARS) {
    flags.push({
      level: 'warn',
      message: `Only ${text.length} characters were extracted. Part of the resume may be an image, so scores could be low for that reason.`
    })
  }

  const { sections, found, lines } = splitSections(text)
  const hasSections = found.some((k) => ['experience', 'education', 'skills', 'projects'].includes(k))
  if (!hasSections) {
    flags.push({
      level: 'warn',
      message: 'No section headings were recognised, so skills and dates were read from the whole text.'
    })
  }

  const skillsText = (sections.skills || []).join('\n')
  const body = skillsText ? text.replace(skillsText, ' ') : text

  let expLines = sections.experience
  let expFromWhole = false
  if (!expLines || !expLines.length) {
    expLines = lines
    expFromWhole = true
  }
  let ranges = findRanges(expLines)
  if (expFromWhole) {
    const institution = /university|college|institute|school|cgpa|gpa|percentage/i
    ranges = ranges.filter((r) => {
      const own = expLines[r.line]
      const near = [expLines[r.line - 1], expLines[r.line + 1]].join(' ')
      return !(DEGREE_WORDS.test(own) || DEGREE_ABBR.test(own) || institution.test(own) || institution.test(near))
    })
  }
  const entries = buildEntries(expLines, ranges)
  const totalMonths = mergedMonths(entries.map((e) => ({ start: e.start, end: e.end })))
  const totalYears = Math.round((totalMonths / 12) * 10) / 10
  const stated = statedYears(text)

  if (!entries.length) {
    flags.push({
      level: sections.experience ? 'warn' : 'info',
      message: sections.experience
        ? 'An experience section exists but no date ranges could be read, so experience counts as 0 years.'
        : 'No dated work experience was found, so experience counts as 0 years. Fine for a fresher, worth checking otherwise.'
    })
  } else if (expFromWhole) {
    flags.push({ level: 'info', message: 'No experience heading found, so dates were picked up from the whole resume.' })
  }
  if (stated !== null && Math.abs(stated - totalYears) > 2) {
    flags.push({
      level: 'warn',
      message: `The resume says ${stated} years of experience but the dated roles add up to ${totalYears}.`
    })
  }

  const eduLines = sections.education && sections.education.length ? sections.education : lines
  const degrees = parseEducation(eduLines)
  if (!degrees.length) {
    flags.push({ level: 'warn', message: 'No degree or education line was recognised.' })
  }

  const blocks = projectBlocks(sections.projects || [])
  const ctx = { text, body, entries, blocks, degrees }
  const scores = {}
  for (const id of ROLE_IDS) scores[id] = scoreRole(ROLES[id], ctx)

  if (scores.lca.score >= CLASSIFY.weak && scores.lca.relevantYears < ROLES.lca.minYears) {
    flags.push({
      level: 'info',
      message: `Only ${scores.lca.relevantYears} years of dated LCA work found; the LCA JD asks for at least ${ROLES.lca.minYears}.`
    })
  }

  const c = classify(scores)
  return {
    ...base,
    text,
    sectionsFound: found,
    education: degrees.map((d) => ({ text: d.text, level: d.level })),
    skillsListed: skillTokens(sections.skills || []),
    links: extractLinks(text),
    experience: {
      totalYears,
      statedYears: stated,
      entries: entries.map((e) => ({ title: e.title, period: e.period, months: e.months }))
    },
    projects: blocks.slice(0, 6).map((b) => b.title),
    scores,
    label: c.label,
    labelReason: c.reason,
    flags
  }
}
