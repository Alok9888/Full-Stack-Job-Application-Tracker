import type { ApplicationInput, AuthResponse, Dashboard, JobApplication, Status } from './types'

const TOKEN_KEY = 'careertrack_token'

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function saveSession(session: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem('careertrack_user', JSON.stringify(session.user))
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('careertrack_user')
}
export function getUser() {
  const value = localStorage.getItem('careertrack_user')
  return value ? JSON.parse(value) as AuthResponse['user'] : null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(path, { ...options, headers })
  if (!response.ok) {
    if (response.status === 401 && !path.includes('/auth/')) clearSession()
    const error = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(error?.message ?? 'Something went wrong. Please try again.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  applications: (q: string, status: Status | 'ALL') => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status !== 'ALL') params.set('status', status)
    return request<JobApplication[]>(`/api/applications?${params.toString()}`)
  },
  dashboard: () => request<Dashboard>('/api/dashboard'),
  createApplication: (data: ApplicationInput) => request<JobApplication>('/api/applications', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateApplication: (id: number, data: ApplicationInput) => request<JobApplication>(`/api/applications/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deleteApplication: (id: number) => request<void>(`/api/applications/${id}`, { method: 'DELETE' }),
}
