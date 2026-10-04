// Version Comparison Module - Atlas Release Platform
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { releaseApi } from '../api'

export function VersionCompare({ releaseId, from = 1, to = 2 }) {
  const [fromVer, setFromVer] = useState(from)
  const [toVer, setToVer] = useState(to)

  const versionsQuery = useQuery({
    queryKey: ['versions', releaseId],
    queryFn: () => releaseApi.versions(releaseId),
    enabled: Boolean(releaseId)
  })

  const vFromQuery = useQuery({
    queryKey: ['version', releaseId, fromVer],
    queryFn: () => releaseApi.version(releaseId, fromVer),
    enabled: Boolean(releaseId && fromVer)
  })

  const vToQuery = useQuery({
    queryKey: ['version', releaseId, toVer],
    queryFn: () => releaseApi.version(releaseId, toVer),
    enabled: Boolean(releaseId && toVer)
  })

  const versionsList = versionsQuery.data || []
  const pkgFrom = vFromQuery.data?.package || {}
  const pkgTo = vToQuery.data?.package || {}

  const categories = [
    { key: 'features', title: 'Completed Features' },
    { key: 'bugFixes', title: 'Bug Fixes' },
    { key: 'changedBehaviour', title: 'Changed Behaviour' },
    { key: 'knownLimitations', title: 'Known Limitations' },
    { key: 'qaSummary', title: 'QA Summary' },
    { key: 'migrationNotes', title: 'Migration & Config Notes' }
  ]

  const formatVal = val => {
    if (!val) return '—'
    if (Array.isArray(val)) {
      const items = val.map(i => (typeof i === 'string' ? i : i.text || '')).filter(Boolean)
      return items.length > 0 ? items.join('\n• ') : '—'
    }
    return String(val)
  }

  return (
    <section className="panel feature-page" style={{ width: '100%' }}>
      <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Version Comparison</h2>
          <p>Side-by-side facts comparison between release versions.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <small style={{ fontWeight: 600, color: '#64748b' }}>From:</small>
            <select
              value={fromVer}
              onChange={e => setFromVer(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
            >
              {versionsList.map(v => (
                <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber} ({v.status})</option>
              ))}
            </select>
          </div>

          <span style={{ color: '#0f766e', fontWeight: 700 }}>⇄</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <small style={{ fontWeight: 600, color: '#64748b' }}>To:</small>
            <select
              value={toVer}
              onChange={e => setToVer(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
            >
              {versionsList.map(v => (
                <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber} ({v.status})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {vFromQuery.isLoading || vToQuery.isLoading ? (
          <div className="state-card">Loading version comparison data...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map(cat => {
              const textFrom = formatVal(pkgFrom[cat.key])
              const textTo = formatVal(pkgTo[cat.key])
              const isDifferent = textFrom !== textTo

              return (
                <div
                  key={cat.key}
                  style={{
                    border: `1px solid ${isDifferent ? '#fde68a' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    background: isDifferent ? '#fffbeb' : '#ffffff',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      background: isDifferent ? '#fef3c7' : '#f8faf9',
                      padding: '10px 16px',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{cat.title}</strong>
                    {isDifferent ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                        Modified in v{toVer}
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>Unchanged</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>VERSION {fromVer}</small>
                      {textFrom}
                    </div>

                    <div style={{ background: isDifferent ? '#ecfdf5' : '#f1f5f9', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                      <small style={{ display: 'block', color: isDifferent ? '#047857' : '#64748b', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>VERSION {toVer}</small>
                      {textTo}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
