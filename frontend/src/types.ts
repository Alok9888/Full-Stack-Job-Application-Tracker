export type Status = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'

export type JobApplication = {
  id: number
  company: string
  role: string
  location: string | null
  status: Status
  appliedDate: string | null
  jobUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type ApplicationInput = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>

export type Dashboard = {
  total: number
  saved: number
  applied: number
  interview: number
  offer: number
  rejected: number
}

export type User = { id: number; name: string; email: string }
export type AuthResponse = { token: string; user: User }
