'use client'

import { useEffect, useRef } from 'react'

function Breakdown({ role, result }) {
  if (!result.parts.length) {
    return <p className="small muted">No score because the file could not be read.</p>
  }
  return (
    <div className="parts">
      {result.parts.map((p) => (
        <div key={p.key} className="part">
          <div className="partHead">
            <span>{p.label}</span>
            <span className="num">{p.points} / {p.max}</span>
          </div>
          <div className="bar thin" aria-hidden="true">
            <div className={`fill ${role.id}`} style={{ width: `${(p.points / p.max) * 100}%` }} />
          </div>
          <p className="small muted">{p.note}</p>
          {p.matched.length > 0 && (
            <details className="fold inner">
              <summary>{p.matched.length} matched, show where</summary>
              <ul className="evidenceList">
                {p.matched.map((m) => (
                  <li key={m.name}>
                    <span className="chip plain">{m.name}{m.count > 1 ? ` x${m.count}` : ''}</span>
                    {m.skillsOnly && <span className="small muted"> only in the skills list, counted at 70%</span>}
                    <span className="snippet">{m.snippet}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}

export default function CandidateDrawer({ candidate: c, roles, activeRole, ranks, total, labels, onClose, onRemove }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (closeRef.current) closeRef.current.focus()
  }, [c.id])

  const order = [activeRole, ...Object.keys(roles).filter((r) => r !== activeRole)]

  return (
    <div className="scrim" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label={`Details for ${c.fileName}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawerHead">
          <div>
            <h2>{c.fileName}</h2>
            <div className="headMeta">
              <span className={`chip ${c.label}`}>{labels[c.label]}</span>
              {c.uploaded && <span className="tag">New upload</span>}
            </div>
          </div>
          <button ref={closeRef} className="btn" onClick={onClose}>Close</button>
        </div>

        <p className="small">{c.labelReason}</p>

        <div className="rankRow">
          {Object.values(roles).map((r) => (
            <div key={r.id} className="rankBox">
              <span className="small muted">{r.name}</span>
              <strong>{c.scores[r.id].score}</strong>
              <span className="small">rank {ranks[r.id][c.id]} of {total}</span>
            </div>
          ))}
        </div>

        <div className="actions">
          {c.source ? (
            <a className="btn" href={c.source} target="_blank" rel="noreferrer">Open original resume</a>
          ) : (
            <span className="small muted">Original file is not available.</span>
          )}
          {onRemove && <button className="btn" onClick={onRemove}>Remove from this session</button>}
        </div>

        {c.flags.length > 0 && (
          <section>
            <h3>What to check</h3>
            <ul className="flags">
              {c.flags.map((f, i) => (
                <li key={i} className={f.level}>
                  <span className="flagLevel">{f.level === 'error' ? 'Error' : f.level === 'warn' ? 'Check' : 'Note'}</span>
                  {f.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        {order.map((rid) => (
          <section key={rid}>
            <h3>Score for {roles[rid].name}: {c.scores[rid].score} out of 100</h3>
            <Breakdown role={roles[rid]} result={c.scores[rid]} />
          </section>
        ))}

        <section>
          <h3>Extracted information</h3>
          <dl className="facts">
            <dt>Experience</dt>
            <dd>
              {c.experience.entries.length ? (
                <>
                  <p className="small">{c.experience.totalYears} years in total from dated roles{c.experience.statedYears !== null ? `, resume states ${c.experience.statedYears}` : ''}.</p>
                  <ul className="plain">
                    {c.experience.entries.map((e, i) => (
                      <li key={i}>{e.title} <span className="muted">({e.period})</span></li>
                    ))}
                  </ul>
                </>
              ) : (
                <span className="muted">No dated roles found</span>
              )}
            </dd>
            <dt>Education</dt>
            <dd>
              {c.education.length ? (
                <ul className="plain">{c.education.map((e, i) => <li key={i}>{e.text}</li>)}</ul>
              ) : (
                <span className="muted">Not found</span>
              )}
            </dd>
            <dt>Skills listed</dt>
            <dd>{c.skillsListed.length ? c.skillsListed.join(', ') : <span className="muted">No skills section found</span>}</dd>
            <dt>Projects</dt>
            <dd>
              {c.projects.length ? (
                <ul className="plain">{c.projects.map((p, i) => <li key={i}>{p}</li>)}</ul>
              ) : (
                <span className="muted">No projects section found</span>
              )}
            </dd>
            <dt>Links</dt>
            <dd>{c.links.length ? c.links.join(', ') : <span className="muted">None found in the text</span>}</dd>
            <dt>Sections found</dt>
            <dd>{c.sectionsFound.length ? c.sectionsFound.join(', ') : <span className="muted">None</span>}</dd>
          </dl>
        </section>

        {c.text && (
          <details className="fold">
            <summary>Text read from the file ({c.chars} characters)</summary>
            <pre className="jd">{c.text}</pre>
          </details>
        )}
      </aside>
    </div>
  )
}
