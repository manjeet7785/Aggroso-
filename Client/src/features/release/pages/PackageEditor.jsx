import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { releaseApi } from '../api'

const fields = [
  ['features', 'Completed features'],
  ['bugFixes', 'Bug fixes'],
  ['changedBehaviour', 'Changed behaviour'],
  ['knownLimitations', 'Known limitations'],
  ['qaSummary', 'QA summary'],
  ['migrationNotes', 'Migration & configuration notes'],
  ['affectedUserGroups', 'Affected user groups'],
]
const itemFields = new Set(['features', 'bugFixes', 'changedBehaviour', 'knownLimitations'])

export function PackageEditor({ releaseId, version, packageData, onSaved }) {
  const queryClient = useQueryClient()
  const [activeField, setActiveField] = useState('features')
  const [draft, setDraft] = useState(packageData || {})

  useEffect(() => { if (packageData) setDraft(packageData) }, [packageData])

  const readiness = useQuery({
    queryKey: ['release-readiness', releaseId, version],
    queryFn: () => releaseApi.readiness(releaseId, version),
    enabled: Boolean(releaseId && version)
  })

  const save = useMutation({
    mutationFn: payload => releaseApi.updateVersion(releaseId, version, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['version', releaseId, version] })
      queryClient.invalidateQueries({ queryKey: ['release-readiness', releaseId, version] })
      onSaved?.()
    }
  })

  const activeValue = Array.isArray(draft[activeField]) ? draft[activeField].map(item => item.text || item).join('\n') : draft[activeField] || ''
  
  const setActiveValue = value => setDraft(current => ({
    ...current,
    [activeField]: itemFields.has(activeField)
      ? (value ? [{ itemId: `${activeField}-1`, text: value, evidenceRefs: [] }] : [])
      : activeField === 'affectedUserGroups'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : value
  }))

  const hasValue = key => {
    const val = draft[key]
    if (Array.isArray(val)) return val.length > 0 && Boolean(val[0]?.text || val[0])
    return Boolean(val && val.trim())
  }

  const issues = readiness.data?.issues || []
  const score = readiness.isLoading ? 0 : Math.max(0, 100 - issues.length * 12)
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="workspace-grid">
      <section className="editor-panel panel">
        <div className="panel-heading">
          <div>
            <h2>Release package details</h2>
            <p>Source facts and release specifications for this version.</p>
          </div>
          <span className="badge draft">Draft v{version}</span>
        </div>
        <div className="package-body">
          <div className="section-list">
            {fields.map(([key, label]) => {
              const filled = hasValue(key)
              return (
                <button
                  key={key}
                  className={`${activeField === key ? 'selected' : ''} ${filled ? 'has-data' : ''}`}
                  onClick={() => setActiveField(key)}
                >
                  <span className={`check ${filled ? 'done' : ''}`}>{filled ? '✓' : '•'}</span>
                  <span className="label-text">{label}</span>
                  <span className="list-arrow">›</span>
                </button>
              )
            })}
          </div>
          <div className="section-editor">
            <div className="section-editor-header">
              <label htmlFor="package-copy">
                {fields.find(([key]) => key === activeField)?.[1]}
                <span className="required">Fact source</span>
              </label>
              <small className="char-hint">{activeValue.length} characters</small>
            </div>
            <textarea
              id="package-copy"
              value={activeValue}
              onChange={e => setActiveValue(e.target.value)}
              placeholder={`Enter details for ${fields.find(([key]) => key === activeField)?.[1].toLowerCase()}...`}
            />
            <div className="editor-footer">
              <span className="footer-status">
                {save.isSuccess ? '✓ Changes saved to MongoDB' : 'Unsaved changes in draft'}
              </span>
              <button
                className="button primary-button save-btn"
                onClick={() => save.mutate({ package: draft })}
                disabled={save.isPending}
              >
                {save.isPending ? 'Saving...' : 'Save package'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="analysis-column">
        <div className="readiness-card panel">
          <div className="panel-heading compact">
            <div>
              <h2>Readiness check</h2>
              <p>Automated validation</p>
            </div>
            <div className="score-wrap" style={{ color: scoreColor }}>
              <span className="readiness-score">{readiness.isLoading ? '—' : `${score}%`}</span>
            </div>
          </div>

          <div className="score-progress-bar">
            <div
              className="score-progress-fill"
              style={{ width: `${score}%`, backgroundColor: scoreColor }}
            />
          </div>

          {readiness.isLoading ? (
            <div className="state-copy">Checking readiness...</div>
          ) : (
            <ul className="check-list">
              {issues.length ? (
                issues.map((issue, idx) => (
                  <li key={issue.id || idx}>
                    <span className="check warning">!</span>
                    <div>
                      <strong>{issue.message}</strong>
                      <small className="severity-badge">{issue.severity || 'warning'}</small>
                    </div>
                  </li>
                ))
              ) : (
                <li>
                  <span className="check good">✓</span>
                  <div>
                    <strong>Package ready for review</strong>
                    <small>All required facts filled</small>
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}