import fs from 'node:fs'
import path from 'node:path'
import Dashboard from '../components/Dashboard.jsx'
import processed from '../data/processed.json'
import { ROLES, CLASSIFY, LABELS } from '../lib/config.js'

function readJd(name) {
  return fs.readFileSync(path.join(process.cwd(), 'data', 'jds', name), 'utf8')
}

export default function Page() {
  const jds = { lca: readJd('lca.txt'), uiux: readJd('uiux.txt') }
  const roles = Object.fromEntries(
    Object.values(ROLES).map((r) => [
      r.id,
      {
        id: r.id,
        name: r.name,
        short: r.short,
        summary: r.summary,
        minYears: r.minYears,
        groups: r.groups.map((g) => ({ key: g.key, label: g.label, max: g.max, why: g.why }))
      }
    ])
  )
  return (
    <Dashboard
      initialCandidates={processed.candidates}
      generatedAt={processed.generatedAt}
      roles={roles}
      jds={jds}
      classify={CLASSIFY}
      labels={LABELS}
    />
  )
}
