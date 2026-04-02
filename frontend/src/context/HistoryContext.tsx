import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type HistoryItem = {
  id: string
  label: string
  url: string
  at: number
  kind: 'download' | 'upload'
}

const HistoryContext = createContext<{
  downloads: HistoryItem[]
  uploads: HistoryItem[]
  addDownload: (label: string, url: string) => void
  addUpload: (label: string) => void
  clear: () => void
} | null>(null)

const D_KEY = 'filegenie_downloads'
const U_KEY = 'filegenie_uploads'

function load(key: string): HistoryItem[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<HistoryItem[]>(() => load(D_KEY))
  const [uploads, setUploads] = useState<HistoryItem[]>(() => load(U_KEY))

  useEffect(() => {
    localStorage.setItem(D_KEY, JSON.stringify(downloads.slice(0, 50)))
  }, [downloads])
  useEffect(() => {
    localStorage.setItem(U_KEY, JSON.stringify(uploads.slice(0, 50)))
  }, [uploads])

  const addDownload = useCallback((label: string, url: string) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      label,
      url,
      at: Date.now(),
      kind: 'download',
    }
    setDownloads((d) => [item, ...d])
  }, [])

  const addUpload = useCallback((label: string) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      label,
      url: '',
      at: Date.now(),
      kind: 'upload',
    }
    setUploads((u) => [item, ...u])
  }, [])

  const clear = useCallback(() => {
    setDownloads([])
    setUploads([])
    localStorage.removeItem(D_KEY)
    localStorage.removeItem(U_KEY)
  }, [])

  return (
    <HistoryContext.Provider value={{ downloads, uploads, addDownload, addUpload, clear }}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const c = useContext(HistoryContext)
  if (!c) throw new Error('useHistory outside HistoryProvider')
  return c
}
