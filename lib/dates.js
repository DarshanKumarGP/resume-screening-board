const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const MON = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?'
const OPEN_END = 'present|current|ongoing|till date|to date|now|today'
const YEAR = '(?:19|20)\\d{2}'

const wordRange = new RegExp(
  `(?:${MON}[\\s,'\\-]*)?(${YEAR})\\s*(?:-|\u2013|\u2014|to|till|until)\\s*(?:${MON}[\\s,'\\-]*)?(${YEAR}|${OPEN_END})`,
  'i'
)
const slashRange = new RegExp(
  `(\\d{1,2})\\s*[/.]\\s*(${YEAR})\\s*(?:-|\u2013|\u2014|to)\\s*(?:(\\d{1,2})\\s*[/.]\\s*(${YEAR})|(${OPEN_END}))`,
  'i'
)

function nowIndex() {
  const d = new Date()
  return d.getFullYear() * 12 + d.getMonth()
}

function build(startYear, startMonth, endYear, endMonth, openEnd) {
  const now = nowIndex()
  const sy = Number(startYear)
  if (sy < 1985) return null
  let s, e
  if (startMonth) s = sy * 12 + (startMonth - 1)
  else s = sy * 12 + 6
  if (openEnd) {
    e = now
  } else {
    const ey = Number(endYear)
    if (endMonth) e = ey * 12 + (endMonth - 1)
    else e = ey * 12 + 6
    if (!startMonth && !endMonth && ey === sy) e = s + 6
  }
  if (e < s || e - s > 40 * 12 || s > now + 6) return null
  if (e > now) e = now
  return { start: s, end: e, months: e - s + (startMonth && (endMonth || openEnd) ? 1 : 0) }
}

export function rangeInLine(line) {
  let m = slashRange.exec(line)
  if (m) {
    const open = m[5]
    return build(m[2], Number(m[1]), m[4], m[3] ? Number(m[3]) : null, !!open)
  }
  m = wordRange.exec(line)
  if (m) {
    const startMonth = m[1] ? MONTHS[m[1].toLowerCase().slice(0, 3)] : null
    const endMonth = m[3] ? MONTHS[m[3].toLowerCase().slice(0, 3)] : null
    const endToken = m[4]
    const open = new RegExp(`^(${OPEN_END})$`, 'i').test(endToken)
    return build(m[2], startMonth, open ? null : endToken, endMonth, open)
  }
  return null
}

export function findRanges(lines) {
  const out = []
  lines.forEach((line, i) => {
    const r = rangeInLine(line)
    if (r) out.push({ ...r, line: i })
  })
  return out
}

export function mergedMonths(intervals) {
  if (!intervals.length) return 0
  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  let total = 0
  let cur = { ...sorted[0] }
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i]
    if (n.start <= cur.end) cur.end = Math.max(cur.end, n.end)
    else {
      total += cur.end - cur.start
      cur = { ...n }
    }
  }
  total += cur.end - cur.start
  return Math.max(total, 0)
}

const NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function label(range) {
  const f = (i) => `${NAMES[i % 12]} ${Math.floor(i / 12)}`
  return `${f(range.start)} to ${range.end >= nowIndex() ? 'present' : f(range.end)}`
}
