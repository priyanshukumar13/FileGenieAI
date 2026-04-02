import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Play } from 'lucide-react'
import { downloadUrl, executeTool, fetchRegistry } from '../../services/api'
import { useHistory } from '../../context/HistoryContext'
import { useSearchParams } from 'react-router-dom'

export function ToolsPanel() {
  const [categories, setCategories] = useState<Record<string, string[]>>({})
  const [action, setAction] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // remove_pages input
  const [pagesInput, setPagesInput] = useState("")

  const { addDownload } = useHistory()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    void fetchRegistry()
      .then((r) => {
        setCategories(r.categories)
        const urlAction = searchParams.get('action')
        const allActs = Object.values(r.categories).flat()

        if (urlAction && allActs.includes(urlAction)) {
          setAction(urlAction)
        } else {
          const first = Object.values(r.categories)[0]?.[0]
          if (first) setAction(first)
        }
      })
      .catch(() => setErr('Could not load tools — is the API running?'))
  }, [])

  const run = async () => {
    setBusy(true)
    setErr(null)
    setLastUrl(null)

    try {
      let params: any = {}

      // remove_pages logic
      if (action === "remove_pages") {
        if (!pagesInput) throw new Error("Enter pages (e.g. 1,2,3)")

        const pagesArray = pagesInput
          .split(",")
          .map(p => Number(p.trim()))
          .filter(p => !isNaN(p))

        if (pagesArray.length === 0) {
          throw new Error("Invalid pages format")
        }

        params = { pages: pagesArray }
      }

      const res = await executeTool(action, params, files)

      if (res.file_url) {
        const u = downloadUrl(res.file_url)
        setLastUrl(u)
        addDownload(action, u)
      }

    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/40"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            PDF & convert tools
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simple tools — no JSON needed 🚀
          </p>
        </div>
        {busy && <Loader2 className="h-6 w-6 animate-spin text-violet-500" />}
      </div>

      {err && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {err}
        </p>
      )}

      {/* ACTION SELECT */}
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Action
      </label>
      <select
        className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        value={action}
        onChange={(e) => setAction(e.target.value)}
      >
        {Object.entries(categories).map(([cat, acts]) => (
          <optgroup key={cat} label={cat.replace(/_/g, ' ')}>
            {acts.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* REMOVE PAGES INPUT */}
      {action === "remove_pages" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Enter pages to remove
          </label>
          <input
            type="text"
            placeholder="e.g. 1,2,3"
            value={pagesInput}
            onChange={(e) => setPagesInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      )}

      {/* FILE INPUT */}
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Files
      </label>

      <p className="text-xs text-slate-500 mb-2">
        You can upload up to 5 files
      </p>

      <input
        type="file"
        multiple
        className="mb-3 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-medium file:text-white"
        onChange={(e) => {
          const newFiles = e.target.files ? Array.from(e.target.files) : []

          setFiles((prev) => {
            const combined = [...prev, ...newFiles]

            if (combined.length > 5) {
              setErr("You can upload maximum 5 files only")
              return combined.slice(0, 5)
            }

            return combined
          })
        }}
      />

      {/* FILE LIST */}
      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800"
            >
              <span className="truncate">📄 {f.name}</span>

              <button
                onClick={() =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RUN BUTTON */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        onClick={() => void run()}
        disabled={busy}
      >
        <Play className="h-4 w-4" />
        {busy ? "Processing..." : "Run tool"}
      </button>

      {/* DOWNLOAD */}
      {lastUrl && (
        <a
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"
          href={lastUrl}
          download
        >
          Download result
        </a>
      )}
    </motion.div>
  )
}