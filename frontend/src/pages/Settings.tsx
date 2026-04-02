import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Key, HardDrive } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { healthCheck } from '../services/api'

const API_KEY_LS = 'filegenie_client_api_key_hint'
const LIMIT_LS = 'filegenie_display_limit_mb'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [maxMb, setMaxMb] = useState(20)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    void healthCheck()
      .then((h) => setMaxMb(h.max_upload_mb))
      .catch(() => {})
    setApiKey(localStorage.getItem(API_KEY_LS) ?? '')
    const l = localStorage.getItem(LIMIT_LS)
    if (l) setMaxMb(Number(l) || 20)
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Appearance and client preferences. Server limits come from FastAPI.</p>
      </motion.div>

      <div className="mt-10 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <h2 className="font-semibold text-slate-900 dark:text-white">Theme</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${theme === 'light' ? 'bg-violet-600 text-white' : 'border border-slate-200 dark:border-slate-700'}`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${theme === 'dark' ? 'bg-violet-600 text-white' : 'border border-slate-200 dark:border-slate-700'}`}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Upload limit (server)</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Current API max: <strong>{maxMb} MB</strong> from <code className="text-violet-600">/health</code>. Change{' '}
            <code className="text-xs">max_upload_mb</code> in backend config to adjust.
          </p>
          <label className="mt-4 block text-xs font-medium text-slate-500">Display-only override (local)</label>
          <input
            type="number"
            min={1}
            max={200}
            value={maxMb}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMaxMb(v)
              localStorage.setItem(LIMIT_LS, String(v))
            }}
            className="mt-1 w-32 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">API key (optional)</h2>
          </div>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            The OpenAI key for <code>/ai/command</code> is configured on the server (<code>.env</code>). You can store a
            personal reminder here — it is not sent to the API by default.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              localStorage.setItem(API_KEY_LS, e.target.value)
            }}
            placeholder="Optional note / key label"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>
    </div>
  )
}
