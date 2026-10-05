import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, releaseApi } from './features/release/api'
import './App.css'

// Import Workspace Components
import { EvidencePage } from './features/release/pages/EvidencePage'
import { FinalBrief } from './features/release/pages/FinalBrief'
import { GeneratedArtifacts } from './features/release/pages/GeneratedArtifacts'
import { PackageEditor } from './features/release/pages/PackageEditor'
import { VersionCompare } from './features/release/pages/VersionCompare'

function go(path) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')) }
function Brand({ onClick }) { return <button className="brand brand-button" onClick={onClick}><span className="brand-mark">a</span><span>atlas<span className="brand-dot">.</span></span></button> }

function PublicNav({ user, onAuth, onLogout }) {
  return (
    <div className="public-nav">
      <Brand onClick={() => go('/')} />
      <nav>
        <button className="nav-link" onClick={() => go('/about')}>About</button>
        {user ? (
          <>
            <button className="button primary-button" onClick={() => go('/workspace')}>Workspace</button>
            <button className="nav-link" onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <>
            <button className="nav-link" onClick={() => onAuth('login')}>Sign in</button>
            <button className="button primary-button" onClick={() => onAuth('register')}>Get started</button>
          </>
        )}
      </nav>
    </div>
  )
}

function Landing({ user, onAuth, onLogout }) {
  return (
    <div className="public-page">
      <PublicNav user={user} onAuth={onAuth} onLogout={onLogout} />
      <div className="landing-hero">
        <div>
          <div className="eyebrow">Release communication platform</div>
          <h1>Ship releases with <em>clarity</em></h1>
          <p>Atlas helps product teams prepare, review, and publish release briefs — backed by evidence, powered by AI, and approved by humans.</p>
          <div className="hero-actions">
            <button className="button primary-button" onClick={() => onAuth('register')}>Create your workspace</button>
            <button className="text-button" onClick={() => onAuth('login')}>Sign in →</button>
          </div>
          <small className="login-note">Free for small teams. No credit card required.</small>
        </div>
        <div className="hero-orbit">
          <div className="orbit-card">
            <span className="orbit-kicker">RELEASE READINESS</span>
            <strong>92%</strong>
            <small>v3.4.1 — Internal brief</small>
            <div className="orbit-line"></div>
          </div>
          <span className="orbit-note">✦ AI-generated, human-approved</span>
        </div>
      </div>
      <div className="landing-strip">
        <span>Evidence-backed</span><span>Version-controlled</span><span>Role-based access</span><span>AI-assisted briefs</span>
      </div>
      <section className="workflow-section">
        <div className="section-intro">
          <div className="eyebrow">How it works</div>
          <h2>Three steps to a polished release</h2>
          <p>From raw notes to a fully cited, human-approved release brief.</p>
        </div>
        <div className="workflow-grid">
          <article>
            <span>①</span>
            <h3>Package your facts</h3>
            <p>Add features, bug fixes, migration notes, and known limitations into a structured release package.</p>
            <button className="workflow-action" onClick={() => onAuth('register')}>Start packaging <b>→</b></button>
          </article>
          <article>
            <span>②</span>
            <h3>Generate & review</h3>
            <p>AI drafts internal and client-facing briefs from your package. Every statement is proposed until a human approves it.</p>
            <button className="workflow-action" onClick={() => onAuth('register')}>See it in action <b>→</b></button>
          </article>
          <article>
            <span>③</span>
            <h3>Finalize & ship</h3>
            <p>Lock the version, compare across releases, and export a polished brief your stakeholders will trust.</p>
            <button className="workflow-action" onClick={() => onAuth('register')}>Get started <b>→</b></button>
          </article>
        </div>
      </section>
    </div>
  )
}

function About({ user, onAuth, onLogout }) {
  return (
    <div className="public-page about-page">
      <PublicNav user={user} onAuth={onAuth} onLogout={onLogout} />
      <main>
        <div className="eyebrow">About Atlas</div>
        <h1>Release communication, <em>reimagined</em></h1>
        <p className="about-lead">Atlas was built for product and engineering teams who believe release notes should be as carefully crafted as the software itself.</p>
        <div className="about-grid">
          <article>
            <span>✦</span>
            <h2>Evidence-first</h2>
            <p>Every generated statement traces back to source facts — tickets, test results, and package data you provide.</p>
          </article>
          <article>
            <span>⇄</span>
            <h2>Version-aware</h2>
            <p>Compare versions side by side. Track what changed, what was added, and which statements may need re-review.</p>
          </article>
          <article>
            <span>⊕</span>
            <h2>Human-in-the-loop</h2>
            <p>AI proposes, humans decide. No statement ships without explicit approval from your team.</p>
          </article>
        </div>
      </main>
    </div>
  )
}

function Auth({ mode, onSuccess, onBack }) {
  const [register, setRegister] = useState(mode === 'register')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' })
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: () => register ? authApi.register(form) : authApi.login({ email: form.email, password: form.password }),
    onSuccess: result => { localStorage.setItem('atlas_token', result.token); localStorage.setItem('atlas_user', JSON.stringify(result.user)); onSuccess(result.user) },
    onError: errorResponse => setError(errorResponse.response?.data?.error || errorResponse.message),
  })
  const update = event => setForm({ ...form, [event.target.name]: event.target.value })
  return <div className="auth-page"><Brand onClick={onBack} /><section className="auth-card"><div className="eyebrow">Private release workspace</div><h1>{register ? 'Create your workspace' : 'Welcome back'}</h1><p>{register ? 'Create a client workspace to prepare release packages. Admin and employee access is assigned by your team.' : 'Sign in to create, edit, and review release communication.'}</p>{register && <input name="name" placeholder="Full name" value={form.name} onChange={update} />}{register && <div className="access-note">New accounts start as <strong>Client</strong>. Your team can assign additional access later.</div>}<input name="email" type="email" placeholder="Work email" value={form.email} onChange={update} /><input name="password" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={update} />{error && <div className="form-error">{error}{error === 'Network Error' && <small> Check that the backend is running on the configured API URL.</small>}</div>}<button className="button primary-button full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Working...' : register ? 'Create account' : 'Sign in'}</button><button className="text-button" onClick={() => { setRegister(!register); setError('') }}>{register ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button></section></div>
}

function Workspace({ user, onLogout }) {
  const queryClient = useQueryClient()
  const [selectedRelease, setSelectedRelease] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [activeTab, setActiveTab] = useState('package') // 'package', 'evidence', 'artifacts', 'compare', 'final'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const releases = useQuery({ queryKey: ['releases'], queryFn: releaseApi.list })
  const versions = useQuery({ queryKey: ['versions', selectedRelease], queryFn: () => releaseApi.versions(selectedRelease), enabled: Boolean(selectedRelease) })
  const version = useQuery({ queryKey: ['version', selectedRelease, selectedVersion], queryFn: () => releaseApi.version(selectedRelease, selectedVersion), enabled: Boolean(selectedRelease && selectedVersion) })

  useEffect(() => {
    if (releases.data?.[0] && !selectedRelease) {
      setSelectedRelease(releases.data[0]._id)
    }
  }, [releases.data, selectedRelease])

  useEffect(() => {
    if (versions.data && versions.data.length > 0) {
      const exists = versions.data.some(v => v.versionNumber === selectedVersion)
      if (!selectedVersion || !exists) {
        setSelectedVersion(versions.data[0].versionNumber)
      }
    } else if (versions.data && versions.data.length === 0) {
      setSelectedVersion(null)
    }
  }, [versions.data, selectedVersion])

  const createRelease = useMutation({
    mutationFn: async () => {
      const newRel = await releaseApi.create('New release')
      await releaseApi.createVersion(newRel._id, { package: {}, evidence: [] })
      return newRel
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['releases'] })
      queryClient.invalidateQueries({ queryKey: ['versions', result._id] })
      setSelectedRelease(result._id)
      setSelectedVersion(1)
    }
  })

  const createVersion = useMutation({
    mutationFn: () => releaseApi.createVersion(selectedRelease, { package: {}, evidence: [] }),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['versions', selectedRelease] })
      setSelectedVersion(result.versionNumber)
    }
  })

  const loadError = releases.error || versions.error || version.error

  return (
    <div className="app-shell">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Brand />
          <button className="sidebar-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-icon">{user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}</span>
          <span><strong>{user.name}</strong><small>{user.role} workspace</small></span>
        </div>
        <nav className="main-nav">
          <button className={activeTab === 'package' ? 'active' : ''} onClick={() => { setActiveTab('package'); setMobileMenuOpen(false); }}><span>↗</span><span>Package</span></button>
          <button className={activeTab === 'evidence' ? 'active' : ''} onClick={() => { setActiveTab('evidence'); setMobileMenuOpen(false); }}><span>▤</span><span>Evidence</span></button>
          <button className={activeTab === 'artifacts' ? 'active' : ''} onClick={() => { setActiveTab('artifacts'); setMobileMenuOpen(false); }}><span>✦</span><span>Generated Brief</span></button>
          <button className={activeTab === 'compare' ? 'active' : ''} onClick={() => { setActiveTab('compare'); setMobileMenuOpen(false); }}><span>⇄</span><span>Compare Versions</span></button>
          <button className={activeTab === 'final' ? 'active' : ''} onClick={() => { setActiveTab('final'); setMobileMenuOpen(false); }}><span>✔</span><span>Final Brief</span></button>
        </nav>
        <div className="sidebar-footer">
          <small>{user.email}</small>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              ☰
            </button>
            <div className="breadcrumbs">
              <span>Releases</span><i>/</i><strong>{selectedVersion ? `v${selectedVersion}` : 'Workspace'}</strong>
            </div>
          </div>
          <span className="role-pill">{user.role}</span>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow">{user.role} release workspace</div>
              <h1>Prepare a release brief</h1>
              <p>Real release packages, persisted in MongoDB and reviewed by your team.</p>
            </div>
            <div className="heading-actions">
              <button className="button secondary-button" onClick={() => createRelease.mutate()} disabled={createRelease.isPending}>+ New release</button>
              {selectedRelease && <button className="button primary-button" onClick={() => createVersion.mutate()} disabled={createVersion.isPending}>+ New version</button>}
            </div>
          </section>

          {loadError && <div className="state-card error-state">Unable to load workspace: {loadError.message}</div>}
          {releases.isLoading && <div className="state-card">Loading your releases...</div>}
          {!releases.isLoading && !loadError && !releases.data?.length && (
            <div className="state-card">
              <h2>Your workspace is empty</h2>
              <p>Create your first release package to begin.</p>
              <button className="button primary-button" onClick={() => createRelease.mutate()} disabled={createRelease.isPending}>
                {createRelease.isPending ? 'Creating release...' : 'Create first release'}
              </button>
            </div>
          )}

          {releases.data?.length > 0 && (
            <>
              <div className="workspace-toolbar">
                <select value={selectedRelease || ''} onChange={e => { setSelectedRelease(e.target.value); setSelectedVersion(null) }}>
                  {releases.data.map(release => <option key={release._id} value={release._id}>{release.title}</option>)}
                </select>
                <select value={selectedVersion || ''} onChange={e => setSelectedVersion(Number(e.target.value))} disabled={!versions.data?.length}>
                  {versions.data?.length ? (
                    versions.data.map(item => <option key={item.versionNumber} value={item.versionNumber}>Version {item.versionNumber} · {item.status}</option>)
                  ) : (
                    <option value="">No version created</option>
                  )}
                </select>
              </div>

              {versions.isLoading ? (
                <div className="state-card">Loading versions...</div>
              ) : !versions.data?.length ? (
                <div className="state-card">
                  <h2>No version created for this release</h2>
                  <p>Create Version 1 to start adding features, evidence, and generating briefs.</p>
                  <button className="button primary-button" onClick={() => createVersion.mutate()} disabled={createVersion.isPending}>
                    {createVersion.isPending ? 'Creating Version 1...' : '+ Create Version 1'}
                  </button>
                </div>
              ) : version.isLoading ? (
                <div className="state-card">Loading release package...</div>
              ) : version.data ? (
                <div className="workspace-grid">
                  {activeTab === 'package' && <PackageEditor releaseId={selectedRelease} version={selectedVersion} packageData={version.data.package} onSaved={() => queryClient.invalidateQueries({ queryKey: ['version', selectedRelease, selectedVersion] })} />}
                  {activeTab === 'evidence' && <EvidencePage evidence={version.data.evidence} onChange={(newEvidence) => { releaseApi.updateVersion(selectedRelease, selectedVersion, { evidence: newEvidence }).then(() => queryClient.invalidateQueries({ queryKey: ['version', selectedRelease, selectedVersion] })) }} />}
                  {activeTab === 'artifacts' && <GeneratedArtifacts releaseId={selectedRelease} version={selectedVersion} actorId={user._id} />}
                  {activeTab === 'compare' && <VersionCompare releaseId={selectedRelease} from={1} to={selectedVersion} />}
                  {activeTab === 'final' && <FinalBrief releaseId={selectedRelease} version={selectedVersion} />}
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('atlas_user') || 'null'))

  useEffect(() => {
    const listener = () => setPath(window.location.pathname)
    window.addEventListener('popstate', listener)
    return () => window.removeEventListener('popstate', listener)
  }, [])

  const onAuth = mode => go(`/${mode}`)
  const onLogout = () => { localStorage.removeItem('atlas_token'); localStorage.removeItem('atlas_user'); setUser(null); go('/') }

  if (path === '/about') return <About user={user} onAuth={onAuth} onLogout={onLogout} />
  if (path === '/') return <Landing user={user} onAuth={onAuth} onLogout={onLogout} />
  if (!user) return path === '/login' || path === '/register' ? <Auth mode={path.slice(1)} onSuccess={nextUser => { setUser(nextUser); go('/workspace') }} onBack={() => go('/')} /> : <Landing user={null} onAuth={onAuth} onLogout={onLogout} />

  return <Workspace user={user} onLogout={onLogout} />
}

export default App;