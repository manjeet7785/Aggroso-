import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releaseApi } from '../api'

export function FinalBrief({ releaseId, version }) {
  const queryClient = useQueryClient()

  const finalQuery = useQuery({
    queryKey: ['final-brief', releaseId, version],
    queryFn: () => fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://aggroso-ctg0.onrender.com/api'}/releases/${releaseId}/versions/${version}/final-brief`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('atlas_token')}` }
    }).then(res => res.json()),
    enabled: Boolean(releaseId && version)
  })

  const allStatementsQuery = useQuery({
    queryKey: ['release-statements', releaseId, version],
    queryFn: () => releaseApi.statements(releaseId, version),
    enabled: Boolean(releaseId && version)
  })

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      const all = allStatementsQuery.data || []
      for (const st of all) {
        if (st.status !== 'approved') {
          await releaseApi.approveStatement(st.sid)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-brief', releaseId, version] })
      queryClient.invalidateQueries({ queryKey: ['release-statements', releaseId, version] })
    }
  })

  const statements = finalQuery.data?.statements || []
  const allStatements = allStatementsQuery.data || []

  const copyBrief = () => {
    const text = statements.map(s => `• ${s.text}`).join('\n\n')
    navigator.clipboard.writeText(text)
    alert('Final release brief copied to clipboard!')
  }

  return (
    <section className="panel feature-page" style={{ width: '100%' }}>
      <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Finalized Release Brief</h2>
          <p>Verified & human-approved release communications ready for stakeholders.</p>
        </div>
        {statements.length > 0 && (
          <button className="button primary-button" onClick={copyBrief}>
            📋 Copy Brief Text
          </button>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        {finalQuery.isLoading ? (
          <div className="state-card">Loading finalized brief...</div>
        ) : statements.length === 0 ? (
          <div className="state-card" style={{ marginTop: 0 }}>
            <h2>No approved statements in Final Brief yet</h2>
            <p style={{ marginBottom: '16px' }}>
              {allStatements.length > 0
                ? `You have ${allStatements.length} AI generated statement(s) waiting for approval.`
                : 'Generate statements first from the Generated Brief tab, or click below to auto-approve.'}
            </p>
            {allStatements.length > 0 ? (
              <button
                className="button primary-button"
                onClick={() => approveAllMutation.mutate()}
                disabled={approveAllMutation.isPending}
              >
                {approveAllMutation.isPending ? 'Approving Statements...' : '✓ Approve All Statements & Create Final Brief'}
              </button>
            ) : null}
          </div>
        ) : (
          <div style={{ background: '#fcfdfd', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ borderBottom: '2px solid #0f766e', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#0f766e' }}>Official Release Document</span>
                <h1 style={{ margin: '4px 0 0', fontSize: '26px', fontFamily: 'Georgia, serif', color: '#1e293b' }}>Release Notes — v{version}</h1>
              </div>
              <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '12px', padding: '6px 12px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                ✓ Human Approved ({statements.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {statements.map((st, idx) => (
                <div key={st.sid || idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#0f766e', fontWeight: 'bold', fontSize: '16px', marginTop: '2px' }}>✦</span>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#334155' }}>
                    {st.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
