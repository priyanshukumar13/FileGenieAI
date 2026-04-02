import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { downloadUrl, executeTool, fetchPdfInfo } from '../../services/api'
import { useHistory } from '../../context/HistoryContext'

export function PageOrganizer() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<number[]>([])
  const [drag, setDrag] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const { addDownload } = useHistory()

  const loadPdf = async (f: File) => {
    setErr(null)
    setUrl(null)
    const info = await fetchPdfInfo(f)
    setPages(Array.from({ length: info.page_count }, (_, i) => i + 1))
    setFile(f)
  }

  const onDrop = (target: number) => {
    if (drag === null) return
    setPages((prev) => {
      const i = prev.indexOf(drag)
      const j = prev.indexOf(target)
      if (i < 0 || j < 0) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
    setDrag(null)
  }

  const run = async () => {
    if (!file || pages.length === 0) return
    setBusy(true)
    setErr(null)
    try {
      const res = await executeTool('organize_pdf', { order: pages }, [file])
      if (res.file_url) {
        const u = downloadUrl(res.file_url)
        setUrl(u)
        addDownload('organize_pdf', u)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-400/40 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-5 dark:from-violet-500/10 dark:to-fuchsia-500/10">
      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Organize pages</h3>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">Drag chips to reorder, then apply. Uses <code className="text-violet-600 dark:text-violet-400">organize_pdf</code>.</p>
      <input
        type="file"
        accept="application/pdf"
        className="mb-4 w-full text-sm file:rounded-lg file:bg-violet-600 file:px-3 file:py-2 file:text-white"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void loadPdf(f).catch((x) => setErr(String(x)))
        }}
      />
      {err && <p className="mb-2 text-sm text-red-500">{err}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        {pages.map((p, idx) => (
          <button
            key={`${idx}-${p}`}
            type="button"
            draggable
            onDragStart={() => setDrag(p)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(p)}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
              drag === p ? 'border-violet-500 bg-violet-500/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            <GripVertical className="mr-1 inline h-4 w-4 opacity-50" />
            Page {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!file || busy}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
        onClick={() => void run()}
      >
        {busy ? 'Working…' : 'Apply new order'}
      </button>
      {url && (
        <a className="mt-3 block text-center text-sm font-medium text-violet-600 underline dark:text-violet-400" href={url} download>
          Download PDF
        </a>
      )}
    </div>
  )
}
