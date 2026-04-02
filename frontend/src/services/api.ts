import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 120_000,
})

// Optional interceptor for token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('filegenie_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function downloadUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_URL ?? ''}${path}`
}

export async function postAiCommand(command: string, files: File[]) {
  const fd = new FormData()
  fd.append('command', command)
  for (const f of files) fd.append('files', f)
  const { data } = await api.post<{
    message: string
    file_url: string | null
    ok: boolean
    action?: string
    meta?: unknown
  }>('/ai/command', fd)
  return data
}

export async function uploadFile(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post('/upload', fd)
  return data as { ok: boolean; filename: string; size_bytes: number }
}

export async function fetchPdfInfo(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post<{ page_count: number; metadata: Record<string, unknown> }>('/tools/pdf-info', fd)
  return data
}

export async function fetchRegistry() {
  const { data } = await api.get<{ categories: Record<string, string[]>; actions: string[] }>('/tools/registry')
  return data
}

export async function executeTool(action: string, parameters: object, files: File[]) {
  const fd = new FormData()
  fd.append('action', action)
  fd.append('parameters', JSON.stringify(parameters))
  for (const f of files) fd.append('files', f)
  const { data } = await api.post<{ file_url: string | null; meta?: unknown }>('/tools/execute', fd)
  return data
}

export async function checkPassword(password: string) {
  const fd = new FormData()
  fd.append('password', password)
  const { data } = await api.post('/security/password-strength', fd)
  return data
}

export async function scanFile(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post('/security/scan-file', fd)
  return data
}

export async function healthCheck() {
  const { data } = await api.get<{ status: string; max_upload_mb: number }>('/health')
  return data
}

export async function sendContactMessage(name: string, email: string, message: string) {
  const fd = new FormData()
  fd.append('name', name)
  fd.append('email', email)
  fd.append('message', message)
  const { data } = await api.post<{ ok: boolean; message: string }>('/contact/send', fd)
  return data
}

export async function loginUser(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function registerUser(email: string, password: string) {
  const { data } = await api.post('/auth/register', { email, password })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function googleLoginUser(token: string) {
  const { data } = await api.post('/auth/google', { token })
  return data
}

export async function splitPdf(file: File, mode: string, payload: Record<string, string | number>) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('mode', mode)
  Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)))
  
  const { data } = await api.post<{ ok: boolean; file_url: string; message: string }>('/tools/split', fd)
  return data
}

export { api }

