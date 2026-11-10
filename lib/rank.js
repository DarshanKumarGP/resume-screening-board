import { ROLE_IDS } from './config.js'

function compare(role) {
  return (a, b) => {
    const sa = a.scores[role]
    const sb = b.scores[role]
    if (sb.score !== sa.score) return sb.score - sa.score
    if (sb.relevantYears !== sa.relevantYears) return sb.relevantYears - sa.relevantYears
    if (b.experience.totalYears !== a.experience.totalYears) return b.experience.totalYears - a.experience.totalYears
    return a.fileName.localeCompare(b.fileName)
  }
}

export function rankPool(candidates) {
  const out = {}
  for (const role of ROLE_IDS) {
    const sorted = [...candidates].sort(compare(role))
    out[role] = {}
    sorted.forEach((c, i) => {
      const prev = sorted[i - 1]
      const tied = prev && prev.scores[role].score === c.scores[role].score && prev.scores[role].relevantYears === c.scores[role].relevantYears
      out[role][c.id] = tied ? out[role][prev.id] : i + 1
    })
  }
  return out
}
