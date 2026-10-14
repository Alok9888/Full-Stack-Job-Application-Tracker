import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownUp, ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp,
  Clock3, LayoutDashboard, Plus, Search, Sparkles, X,
} from 'lucide-react'
import { api, clearSession, getToken, getUser, saveSession } from './api'
import type { ApplicationInput, Dashboard, JobApplication, Status, User } from './types'

const emptyStats: Dashboard = { total: 0, saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 }
const initialForm: ApplicationInput = {
  company: '', role: '', location: '', status: 'SAVED', appliedDate: '', jobUrl: '', notes: '',
}
const statusNames: Record<Status, string> = {
  SAVED: 'Saved', APPLIED: 'Applied', INTERVIEW: 'Interview', OFFER: 'Offer',
  REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
}
const filters: Array<{ label: string; value: Status | 'ALL' }> = [
  { label: 'All applications', value: 'ALL' }, { label: 'Saved', value: 'SAVED' },
  { label: 'Applied', value: 'APPLIED' }, { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Offer', value: 'OFFER' }, { label: 'Rejected', value: 'REJECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
]

function App() {
  const [user, setUser] = useState<User | null>(() => getToken() ? getUser() : null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [stats, setStats] = useState<Dashboard>(emptyStats)
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [register, setRegister] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    if (!user) return
    try {
      const [items, dashboard] = await Promise.all([api.applications(query, filter), api.dashboard()])
      setApplications(items)
      setStats(dashboard)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your applications.')
    }
  }

  useEffect(() => { void refresh() }, [user, filter, query])
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [message])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)
    const data = new FormData(event.currentTarget)
    try {
      const session = register
        ? await api.register(String(data.get('name')), String(data.get('email')), String(data.get('password')))
        : await api.login(String(data.get('email')), String(data.get('password')))
      saveSession(session)
      setUser(session.user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in.')
    } finally { setAuthBusy(false) }
  }

  function openNew() { setEditing(null); setModal(true) }
  function openEdit(item: JobApplication) { setEditing(item); setModal(true) }

  async function saveApplication(data: ApplicationInput) {
    setBusy(true)
    try {
      if (editing) await api.updateApplication(editing.id, data)
      else await api.createApplication(data)
      setModal(false)
      setMessage(editing ? 'Application updated.' : 'Application added to your list.')
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this application.')
    } finally { setBusy(false) }
  }

  async function removeApplication(item: JobApplication) {
    if (!window.confirm(`Remove the ${item.role} application at ${item.company}?`)) return
    try {
      await api.deleteApplication(item.id)
      setModal(false)
      setMessage('Application removed.')
      await refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not remove this application.') }
  }

  function signOut() { clearSession(); setUser(null); setApplications([]); setStats(emptyStats) }

  if (!user) return <AuthScreen register={register} setRegister={setRegister} onSubmit={handleAuth} busy={authBusy} error={authError} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="CareerTrack home"><span className="brand-mark"><BriefcaseBusiness size={18} /></span><span>careertrack<span className="brand-dot">.</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#applications"><LayoutDashboard size={17} /> Overview</a>
          <a className="nav-item" href="#applications" onClick={() => setFilter('ALL')}><BriefcaseBusiness size={17} /> Applications <span className="nav-count">{stats.total}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={16} /></div><strong>Keep the momentum</strong><p>Small, steady steps make a good search.</p><div className="tip-progress"><span /></div><small>{stats.total} application{stats.total === 1 ? '' : 's'} tracked</small></div>
          <button className="nav-item nav-button" onClick={() => setMessage('Have an idea? Open an issue or pull request in the project repository.')}><CircleHelp size={17} /> Help & feedback</button>
        </div>
      </aside>

      <main id="top" className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div>
          <div className="topbar-right"><button className="profile-button" onClick={signOut} title="Sign out"><span className="avatar">{initials(user.name)}</span><span className="profile-name">{user.name.split(' ')[0]}</span><ChevronDown size={15} /></button></div>
        </header>

        <div className="page-content" id="applications">
          <div className="welcome-row"><div><div className="eyebrow">YOUR JOB SEARCH, IN FOCUS</div><h1>Good {greeting()}, {user.name.split(' ')[0]} <span className="wave">✳</span></h1><p className="page-subtitle">A little clarity goes a long way. Here’s where things stand.</p></div><button className="primary-button" onClick={openNew}><Plus size={17} strokeWidth={2.5} /> Add application</button></div>

          <section className="stats-grid" aria-label="Application summary">
            <StatCard title="All applications" value={stats.total} icon={<BriefcaseBusiness size={17} />} color="blue" detail="Across your job search" />
            <StatCard title="In progress" value={stats.applied + stats.interview} icon={<Clock3 size={17} />} color="amber" detail="Applied or interviewing" />
            <StatCard title="Interviews" value={stats.interview} icon={<CalendarDays size={17} />} color="violet" detail="Good things are moving" />
            <StatCard title="Offers" value={stats.offer} icon={<Sparkles size={17} />} color="green" detail="A reason to celebrate" />
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>Your applications</h2><p>Keep each opportunity moving forward.</p></div><button className="secondary-button" onClick={() => { setQuery(''); setFilter('ALL') }}><ArrowDownUp size={15} /> Reset view</button></div>
            <div className="toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter applications">{filters.map(item => <button key={item.value} role="tab" aria-selected={filter === item.value} className={filter === item.value ? 'filter-tab selected' : 'filter-tab'} onClick={() => setFilter(item.value)}>{item.label}{item.value === 'ALL' && <span className="tab-count">{stats.total}</span>}</button>)}</div><label className="search-box"><Search size={16} /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search companies or roles" aria-label="Search companies or roles" /><kbd>⌘ K</kbd></label></div>
            <div className="table-wrap">
              <table><thead><tr><th>COMPANY / ROLE</th><th>LOCATION</th><th>STATUS</th><th>APPLIED ON</th><th aria-label="Actions" /></tr></thead>
                <tbody>{applications.map(item => <tr key={item.id} onClick={() => openEdit(item)} className="application-row"><td><div className="company-cell"><span className={`company-logo ${companyColor(item.company)}`}>{item.company.slice(0, 1).toUpperCase()}</span><span><strong>{item.company}</strong><small>{item.role}</small></span></div></td><td className="location-cell">{item.location || '—'}</td><td><StatusBadge status={item.status} /></td><td className="date-cell">{item.appliedDate ? formatDate(item.appliedDate) : '—'}</td><td><button className="row-arrow" aria-label={`Edit ${item.company} application`} onClick={event => { event.stopPropagation(); openEdit(item) }}><ArrowUpRight size={16} /></button></td></tr>)}</tbody>
              </table>
              {applications.length === 0 && <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={22} /></div><h3>{query || filter !== 'ALL' ? 'No matches this time' : 'Your next opportunity starts here'}</h3><p>{query || filter !== 'ALL' ? 'Try another search or choose a different filter.' : 'Save the roles you’re interested in and keep every next step in one place.'}</p>{!query && filter === 'ALL' && <button className="primary-button" onClick={openNew}><Plus size={16} /> Add your first application</button>}</div>}
            </div>
            {applications.length > 0 && <div className="table-footer"><span>Showing <b>{applications.length}</b> {applications.length === 1 ? 'application' : 'applications'}</span><span>Sorted by last updated <ArrowDownUp size={13} /></span></div>}
          </section>
          <footer className="page-footer"><span>Made for the next step in your career.</span><span>CareerTrack <span className="brand-dot">·</span> {new Date().getFullYear()}</span></footer>
        </div>
      </main>
      {modal && <ApplicationModal initial={editing} busy={busy} onClose={() => setModal(false)} onSave={saveApplication} onDelete={editing ? () => removeApplication(editing) : undefined} />}
      {message && <div className="toast" role="status"><Check size={17} />{message}<button onClick={() => setMessage('')} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  )
}

function AuthScreen({ register, setRegister, onSubmit, busy, error }: {
  register: boolean; setRegister: (value: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; error: string
}) {
  return <main className="auth-page"><div className="auth-decoration"><div className="decor-orbit orbit-one"/><div className="decor-orbit orbit-two"/><div className="decor-card"><div className="decor-card-top"><span className="decor-brand"><BriefcaseBusiness size={15} /> careertrack</span><span className="decor-live">YOUR NEXT CHAPTER</span></div><div className="decor-heading">One place for<br/>what comes next.</div><div className="decor-company-row"><span className="decor-logo">N</span><span><b>Northstar Labs</b><small>Product Designer</small></span><span className="decor-pill">Interview</span></div><div className="decor-company-row"><span className="decor-logo coral">S</span><span><b>Studio Field</b><small>Visual Designer</small></span><span className="decor-pill green-pill">Offer</span></div><div className="decor-note"><Sparkles size={14} /> Your progress, all in one view.</div></div><div className="decor-caption">A calmer way to navigate the search.</div></div><div className="auth-form-wrap"><a className="brand auth-brand" href="#"><span className="brand-mark"><BriefcaseBusiness size={18} /></span><span>careertrack<span className="brand-dot">.</span></span></a><div className="auth-copy"><span className="eyebrow">WELCOME {register ? 'ABOARD' : 'BACK'}</span><h1>{register ? 'Make room for what’s next.' : 'Good to see you again.'}</h1><p>{register ? 'Create an account and give your job search a little structure.' : 'Sign in to pick up right where you left off.'}</p></div><form className="auth-form" onSubmit={onSubmit}>{register && <label>Your name<input name="name" placeholder="Alex Morgan" autoComplete="name" required maxLength={80} /></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input name="password" type="password" placeholder={register ? 'At least 8 characters' : 'Your password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'One moment…' : register ? 'Create your account' : 'Sign in'}<ArrowUpRight size={16} /></button></form><div className="auth-switch">{register ? 'Already have an account?' : 'New to CareerTrack?'} <button onClick={() => setRegister(!register)}>{register ? 'Sign in' : 'Create an account'}</button></div><div className="auth-privacy">Your applications are private to your account.</div></div></main>
}

function StatCard({ title, value, icon, color, detail }: { title: string; value: number; icon: ReactNode; color: string; detail: string }) {
  return <article className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></article>
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><span />{statusNames[status]}</span>
}

function ApplicationModal({ initial, busy, onClose, onSave, onDelete }: {
  initial: JobApplication | null; busy: boolean; onClose: () => void; onSave: (data: ApplicationInput) => void; onDelete?: () => void
}) {
  const title = initial ? 'Update application' : 'Add an application'
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSave({
      company: String(data.get('company')).trim(), role: String(data.get('role')).trim(),
      location: String(data.get('location')).trim() || null, status: data.get('status') as Status,
      appliedDate: String(data.get('appliedDate')) || null, jobUrl: String(data.get('jobUrl')).trim() || null,
      notes: String(data.get('notes')).trim() || null,
    })
  }
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">YOUR OPPORTUNITY</span><h2 id="modal-title">{title}</h2><p>A few details to keep this one on track.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form onSubmit={submit}><div className="form-grid"><label className="full">Company<input name="company" defaultValue={initial?.company} placeholder="e.g. Northstar Labs" required maxLength={120} autoFocus /></label><label className="full">Role<input name="role" defaultValue={initial?.role} placeholder="e.g. Product Designer" required maxLength={140} /></label><label>Location<input name="location" defaultValue={initial?.location ?? ''} placeholder="City or remote" maxLength={120} /></label><label>Status<select name="status" defaultValue={initial?.status ?? 'SAVED'}>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="full">Application date<input name="appliedDate" type="date" defaultValue={initial?.appliedDate ?? ''} /></label><label className="full">Job posting link <span className="optional">Optional</span><input name="jobUrl" type="url" defaultValue={initial?.jobUrl ?? ''} placeholder="https://company.com/careers/…" maxLength={2048} /></label><label className="full">Notes <span className="optional">Optional</span><textarea name="notes" defaultValue={initial?.notes ?? ''} placeholder="Recruiter name, interview details, follow-up…" rows={3} maxLength={2000} /></label></div><div className="modal-actions">{onDelete && <button type="button" className="text-danger" onClick={onDelete}>Remove</button>}<span className="action-spacer"/><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add application'}</button></div></form></section></div>
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening' }
function formatDate(date: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) }
function companyColor(company: string) { return ['company-logo', `tone-${company.charCodeAt(0) % 5}`].join(' ') }

export default App
