import { useState } from 'react'
import { Shield } from 'lucide-react'
import { checkPassword, scanFile } from '../../services/api'

export function SecurityPanel() {
  const [pw, setPw] = useState('')
  const [pwResult, setPwResult] = useState<Record<string, unknown> | null>(null)
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/40">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-6 w-6 text-violet-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
      </div>

      <div className="mb-8">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Password strength</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="Enter a password to analyze"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white dark:bg-slate-700"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void checkPassword(pw)
                .then(setPwResult)
                .finally(() => setBusy(false))
            }}
          >
            Analyze
          </button>
        </div>
        {pwResult && (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {JSON.stringify(pwResult, null, 2)}
          </pre>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">File scanner</label>
        <input
          type="file"
          className="w-full text-sm file:mr-3 file:rounded-lg file:bg-slate-700 file:px-4 file:py-2 file:text-white"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setBusy(true)
            void scanFile(f)
              .then(setScanResult)
              .finally(() => setBusy(false))
          }}
        />
        {scanResult && (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {JSON.stringify(scanResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
