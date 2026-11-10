'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { rankPool } from '../lib/rank.js'
import CandidateDrawer from './CandidateDrawer.jsx'

const SORTS = [
  { value: 'score', label: 'Score' },
  { value: 'relExp', label: 'Relevant experience' },
  { value: 'totalExp', label: 'Total experience' },
  { value: 'name', label: 'File name' }
]

function topEvidence(candidate, roleId, limit = 4) {
  const parts = candidate.scores[roleId].parts || []
  const names = []
  for (const p of parts) {
    for (const m of p.matched || []) {
      if (!names.includes(m.name)) names.push(m.name)
    }
  }
  return names.slice(0, limit)
}

function hasLevel(candidate, level) {
  return candidate.flags.some((f) => f.level === level)
}

function csvCell(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export default function Dashboard({ initialCandidates, generatedAt, roles, jds, classify, labels }) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [roleId, setRoleId] = useState('lca')
  const [query, setQuery] = useState('')
  const [labelFilter, setLabelFilter] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [sortBy, setSortBy] = useState('score')
  const [issuesOnly, setIssuesOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [upload, setUpload] = useState({ busy: false, error: '', notice: '' })
  const fileInput = useRef(null)

  const role = roles[roleId]
  const ranks = useMemo(() => rankPool(candidates), [candidates])

  const counts = useMemo(() => {
    const out = {}
    for (const r of Object.keys(roles)) {
      out[r] = candidates.filter((c) => c.label === r || c.label === 'both').length
    }
    return out
  }, [candidates, roles])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = candidates.filter((c) => {
      if (labelFilter !== 'all' && c.label !== labelFilter) return false
      if (c.scores[roleId].score < minScore) return false
      if (issuesOnly && !c.flags.some((f) => f.level !== 'info')) return false
      if (q) {
        const hay = (c.fileName + ' ' + topEvidence(c, roleId, 40).join(' ') + ' ' + c.skillsListed.join(' ')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const byRank = (a, b) => ranks[roleId][a.id] - ranks[roleId][b.id]
    list.sort((a, b) => {
      if (sortBy === 'relExp') return b.scores[roleId].relevantYears - a.scores[roleId].relevantYears || byRank(a, b)
      if (sortBy === 'totalExp') return b.experience.totalYears - a.experience.totalYears || byRank(a, b)
      if (sortBy === 'name') return a.fileName.localeCompare(b.fileName, undefined, { numeric: true })
      return byRank(a, b)
    })
    return list
  }, [candidates, roleId, query, labelFilter, minScore, sortBy, issuesOnly, ranks])

  const selected = candidates.find((c) => c.id === selectedId) || null

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleUpload(event) {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    setUpload({ busy: true, error: '', notice: '' })
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }
      if (!res.ok || !data || !data.candidate) {
        throw new Error((data && data.error) || `The server returned an error (${res.status}).`)
      }
      const candidate = { ...data.candidate, uploaded: true, source: URL.createObjectURL(file) }
      const pile = [...candidates, candidate]
      const placed = rankPool(pile)
      setCandidates(pile)
      setSelectedId(candidate.id)
      setQuery('')
      setLabelFilter('all')
      setMinScore(0)
      setIssuesOnly(false)
      const unreadable = hasLevel(candidate, 'error')
      setUpload({
        busy: false,
        error: '',
        notice: unreadable
          ? `${candidate.fileName} was added but could not be read. See the details panel.`
          : `${candidate.fileName} ranks #${placed.lca[candidate.id]} of ${pile.length} for LCA and #${placed.uiux[candidate.id]} of ${pile.length} for UI/UX.`
      })
    } catch (err) {
      setUpload({ busy: false, error: err.message, notice: '' })
    }
  }

  function removeUpload(id) {
    setCandidates((list) => list.filter((c) => c.id !== id))
    setSelectedId(null)
    setUpload({ busy: false, error: '', notice: '' })
  }

  function exportCsv() {
    const head = ['Rank', 'File', 'Classification', 'Score', 'Relevant years', 'Total years', 'Evidence', 'Issues']
    const lines = rows.map((c) =>
      [
        ranks[roleId][c.id],
        c.fileName,
        labels[c.label],
        c.scores[roleId].score,
        c.scores[roleId].relevantYears,
        c.experience.totalYears,
        topEvidence(c, roleId, 6).join('; '),
        c.flags.filter((f) => f.level !== 'info').map((f) => f.message).join(' | ')
      ]
        .map(csvCell)
        .join(',')
    )
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ranking-${roleId}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const filtersActive = query || labelFilter !== 'all' || minScore > 0 || issuesOnly

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>Resume screening board</h1>
          <p className="muted">
            {candidates.length} resumes
            {generatedAt ? `, processed ${new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>
        </div>
        <div className="upload">
          <input ref={fileInput} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} hidden />
          <button className="btn primary" onClick={() => fileInput.current && fileInput.current.click()} disabled={upload.busy}>
            {upload.busy ? 'Reading resume...' : 'Test a new resume'}
          </button>
        </div>
      </header>

      {upload.error && (
        <div className="banner error" role="alert">
          <strong>Upload failed.</strong> {upload.error}
          <button className="link" onClick={() => setUpload({ busy: false, error: '', notice: '' })}>Dismiss</button>
        </div>
      )}
      {upload.notice && (
        <div className="banner ok" role="status">
          {upload.notice}
          <button className="link" onClick={() => setUpload({ busy: false, error: '', notice: '' })}>Dismiss</button>
        </div>
      )}

      <div className="layout">
        <aside className="rail">
          <div className="roleSwitch" role="tablist" aria-label="Job profile">
            {Object.values(roles).map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={roleId === r.id}
                className={`roleTab ${r.id} ${roleId === r.id ? 'active' : ''}`}
                onClick={() => setRoleId(r.id)}
              >
                <span className="roleName">{r.name}</span>
                <span className="roleCount">{counts[r.id]} matching resumes</span>
              </button>
            ))}
          </div>

          <p className="roleSummary">{role.summary}</p>

          <details className="fold">
            <summary>Job description</summary>
            <pre className="jd">{jds[roleId]}</pre>
          </details>

          <details className="fold" open>
            <summary>How the score works</summary>
            <p className="small">
              Each resume gets a score out of 100 for this role. The parts below add up to the total, and the same
              rules are applied to every resume.
            </p>
            <ul className="rubric">
              {role.groups.map((g) => (
                <li key={g.key}>
                  <span className="pts">{g.max}</span>
                  <span>
                    <strong>{g.label}</strong>
                    <span className="small block">{g.why}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="small">
              A skill listed only under a skills heading counts for 70% of its value, because it is not shown in
              any job or project. Ranks sort by score, then relevant years, then total years.
            </p>
          </details>

          <details className="fold">
            <summary>How resumes are classified</summary>
            <ul className="plain small">
              <li>LCA or UI/UX: that score is at least {classify.strong} and leads the other by {classify.margin} points or more.</li>
              <li>Both: each score is at least {classify.strong}.</li>
              <li>Neither / uncertain: both scores are under {classify.weak}, the scores are too close to call, or the file could not be read.</li>
            </ul>
          </details>
        </aside>

        <main className="main">
          <div className="controls">
            <label className="field grow">
              <span>Search</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="File name or skill, e.g. Figma" />
            </label>
            <label className="field">
              <span>Classification</span>
              <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}>
                <option value="all">All</option>
                {Object.entries(labels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field narrow">
              <span>Minimum score</span>
              <input type="number" min="0" max="100" value={minScore} onChange={(e) => setMinScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            </label>
            <label className="field">
              <span>Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
              <span>Only files with issues</span>
            </label>
          </div>

          <div className="tableHead">
            <p>
              Showing {rows.length} of {candidates.length} for <strong>{role.name}</strong>
            </p>
            <div className="tableActions">
              {filtersActive && (
                <button className="btn" onClick={() => { setQuery(''); setLabelFilter('all'); setMinScore(0); setIssuesOnly(false) }}>Clear filters</button>
              )}
              <button className="btn" onClick={exportCsv} disabled={!rows.length}>Download CSV</button>
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="empty">
              <h2>No resumes loaded yet</h2>
              <p>Put the resume files in <code>public/resumes</code> and run <code>npm run ingest</code>, then restart the app. You can also try the upload button to score a single file.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty">
              <h2>No resumes match these filters</h2>
              <p>Lower the minimum score or clear the filters to see everyone again.</p>
            </div>
          ) : (
            <div className="tableWrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th className="c-rank">Rank</th>
                    <th>Resume</th>
                    <th>Classification</th>
                    <th className="c-score">Score</th>
                    <th className="c-exp">Relevant experience</th>
                    <th>Evidence found</th>
                    <th className="c-issue">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const s = c.scores[roleId]
                    const errors = c.flags.filter((f) => f.level === 'error').length
                    const warns = c.flags.filter((f) => f.level === 'warn').length
                    const evidence = topEvidence(c, roleId)
                    return (
                      <tr key={c.id} className={selectedId === c.id ? 'selected' : ''} onClick={() => setSelectedId(c.id)}>
                        <td className="c-rank">{ranks[roleId][c.id]}</td>
                        <td>
                          <button className="rowButton" onClick={(e) => { e.stopPropagation(); setSelectedId(c.id) }}>
                            {c.fileName}
                          </button>
                          {c.uploaded && <span className="tag">New upload</span>}
                        </td>
                        <td>
                          <span className={`chip ${c.label}`}>{labels[c.label]}</span>
                        </td>
                        <td className="c-score">
                          <div className="bar" aria-hidden="true">
                            <div className={`fill ${roleId}`} style={{ width: `${s.score}%` }} />
                          </div>
                          <span className="num">{s.score}</span>
                        </td>
                        <td className="c-exp">{s.relevantYears > 0 ? `${s.relevantYears} yrs` : 'None found'}</td>
                        <td className="evidence">{evidence.length ? evidence.join(', ') : <span className="muted">Nothing matched</span>}</td>
                        <td className="c-issue">
                          {errors > 0 && <span className="issue bad">Unreadable</span>}
                          {errors === 0 && warns > 0 && <span className="issue warn">{warns} to check</span>}
                          {errors === 0 && warns === 0 && <span className="muted">None</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {selected && (
        <CandidateDrawer
          candidate={selected}
          roles={roles}
          activeRole={roleId}
          ranks={ranks}
          total={candidates.length}
          labels={labels}
          onClose={() => setSelectedId(null)}
          onRemove={selected.uploaded ? () => removeUpload(selected.id) : null}
        />
      )}
    </div>
  )
}
