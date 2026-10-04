import { useState, useEffect } from 'react'

export function EvidencePage({ evidence = [], onChange }) {
  const [rows, setRows] = useState(evidence)

  useEffect(() => { setRows(evidence) }, [evidence])

  const update = (index, key, value) => {
    const next = rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row)
    setRows(next)
    onChange?.(next)
  }

  const addRow = () => {
    const next = [...rows, { evidenceId: `test-ref-${rows.length + 1}`, kind: 'test', description: '', status: 'passed', itemRefs: [] }]
    setRows(next)
    onChange?.(next)
  }

  const deleteRow = index => {
    const next = rows.filter((_, idx) => idx !== index)
    setRows(next)
    onChange?.(next)
  }

  const passedCount = rows.filter(r => r.status === 'passed').length
  const failedCount = rows.filter(r => r.status === 'failed').length

  return (
    <section className="panel feature-page" style={{ width: '100%' }}>
      <div className="panel-heading">
        <div>
          <h2>Release Evidence & Test Audit</h2>
          <p>Stable evidence records linked to release package claims.</p>
        </div>
        <div className="panel-heading-actions">
          <div className="evidence-summary-badge">
            <span style={{ color: '#10b981', fontWeight: 700 }}>{passedCount} Passed</span>
            {failedCount > 0 && <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: '8px' }}>{failedCount} Failed</span>}
          </div>
          <button className="button primary-button" onClick={addRow}>+ Add evidence entry</button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {rows.length === 0 ? (
          <div className="state-card" style={{ marginTop: 0 }}>
            <h2>No evidence records attached</h2>
            <p>Add QA test cases, ticket references, or build verification hashes to back up this release.</p>
            <button className="button primary-button" onClick={addRow}>+ Add first evidence item</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rows.map((row, index) => (
              <div
                key={row.evidenceId || index}
                className="evidence-row-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 140px 40px',
                  gap: '16px',
                  alignItems: 'center',
                  background: '#f8faf9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', background: '#ccfbf1', padding: '3px 8px', borderRadius: '4px' }}>
                    {row.evidenceId}
                  </span>
                </div>
                <input
                  type="text"
                  value={row.description || ''}
                  placeholder="Enter test description or evidence details..."
                  onChange={e => update(index, 'description', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                />
                <select
                  value={row.status || 'not_run'}
                  onChange={e => update(index, 'status', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    background: row.status === 'passed' ? '#ecfdf5' : row.status === 'failed' ? '#fef2f2' : '#f1f5f9',
                    color: row.status === 'passed' ? '#047857' : row.status === 'failed' ? '#b91c1c' : '#475569'
                  }}
                >
                  <option value="passed">✓ Passed</option>
                  <option value="failed">✕ Failed</option>
                  <option value="not_run">⏳ Not Run</option>
                </select>
                <button
                  onClick={() => deleteRow(index)}
                  title="Remove evidence"
                  style={{
                    border: 0,
                    background: 'none',
                    color: '#ef4444',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}