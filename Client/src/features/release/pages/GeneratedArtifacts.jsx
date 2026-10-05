import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { releaseApi } from '../api'

export function CitationChip({ citation }) {
  return (
    <span className="citations" style={{ display: 'inline-flex', margin: '2px 4px 2px 0' }}>
      <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
        [{citation.type || 'ref'}:{citation.id}]
      </span>
    </span>
  )
}

export function GeneratedArtifacts({ releaseId, version, actorId }) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['release-statements', releaseId, version],
    queryFn: () => releaseApi.statements(releaseId, version),
    enabled: Boolean(releaseId && version)
  })

  const generate = useMutation({
    mutationFn: () => releaseApi.generate(releaseId, version, 'internal_summary'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['release-statements', releaseId, version] })
  })

  const approve = useMutation({
    mutationFn: sid => releaseApi.approveStatement(sid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['release-statements', releaseId, version] })
  })

  const reject = useMutation({
    mutationFn: sid => releaseApi.rejectStatement(sid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['release-statements', releaseId, version] })
  })

  return (
    <section className="panel feature-page" style={{ width: '100%' }}>
      <div className="panel-heading">
        <div>
          <h2>AI-Generated Statements & Briefs</h2>
          <p>Every statement remains proposed until explicit human approval.</p>
        </div>
        <button
          className="button primary-button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}
        >
          {generate.isPending ? '✨ Generating...' : '✨ Generate internal brief'}
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {query.isLoading && <div className="state-card">Generating statements from package facts...</div>}
        
        {!query.isLoading && (!query.data || query.data.length === 0) && (
          <div className="state-card" style={{ marginTop: 0 }}>
            <h2>No AI statements generated yet</h2>
            <p>Click "Generate internal brief" above to transform package details into structured statements.</p>
            <button className="button primary-button" onClick={() => generate.mutate()} disabled={generate.isPending}>
              {generate.isPending ? 'Generating...' : '✨ Generate First Brief'}
            </button>
          </div>
        )}

        {query.data && query.data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {query.data.map(statement => {
              const isApproved = statement.status === 'approved'
              const isRejected = statement.status === 'rejected'
              
              return (
                <article
                  className="brief-card"
                  key={statement.sid}
                  style={{
                    background: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#ffffff',
                    border: `1px solid ${isApproved ? '#bbf7d0' : isRejected ? '#fecaca' : '#e2e8f0'}`,
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="brief-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                          color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#b45309'
                        }}
                      >
                        {statement.status || 'Proposed'}
                      </span>
                      {statement.model && <small style={{ color: '#64748b' }}>Model: {statement.model}</small>}
                    </div>
                    <small style={{ color: '#94a3b8', fontFamily: 'monospace' }}>ID: {statement.sid}</small>
                  </div>

                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#1e293b', margin: '0 0 14px' }}>
                    {statement.text}
                  </p>

                  {statement.citations && statement.citations.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      {statement.citations.map((citation, i) => (
                        <CitationChip key={i} citation={citation} />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                    <button
                      className="button approve-button"
                      onClick={() => approve.mutate(statement.sid)}
                      disabled={approve.isPending || isApproved}
                      style={{
                        background: isApproved ? '#10b981' : '#ecfdf5',
                        color: isApproved ? '#ffffff' : '#047857',
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      {isApproved ? '✓ Approved' : '✓ Approve Statement'}
                    </button>
                    <button
                      className="reject-button"
                      onClick={() => reject.mutate(statement.sid)}
                      disabled={reject.isPending || isRejected}
                      style={{
                        background: isRejected ? '#ef4444' : '#fff5f5',
                        color: isRejected ? '#ffffff' : '#991b1b',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: '1px solid #fecaca'
                      }}
                    >
                      {isRejected ? '✕ Rejected' : '✕ Reject'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}