import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useHistory } from '../context/HistoryContext'
import { downloadUrl } from '../services/api'

export default function Account() {
  const { user, updateUser, logout } = useAuth()
  const { downloads, uploads, clear } = useHistory()
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-slate-600 dark:text-slate-400">Sign in to view your profile and history.</p>
        <Link to="/login" className="mt-4 inline-block rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white">
          Login
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-violet-500/30"
          >
            <img
              src={
                user.avatar ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
              }
              alt=""
              className="h-full w-full object-cover"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (user && typeof reader.result === 'string') updateUser({ ...user, avatar: reader.result })
                }
                reader.readAsDataURL(f)
              }}
            />
          </button>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
            <p className="text-slate-500">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                to="/dashboard"
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Go to workspace
              </Link>
              <button type="button" onClick={logout} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
                Log out
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Download history</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {downloads.length === 0 && <li className="text-slate-500">No downloads yet.</li>}
            {downloads.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                <span className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">{d.label}</span>
                {d.url && (
                  <a href={downloadUrl(d.url)} className="shrink-0 text-violet-600 dark:text-violet-400" download>
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent uploads (client)</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {uploads.length === 0 && <li className="text-slate-500">Tracked when you use upload from settings.</li>}
            {uploads.map((u) => (
              <li key={u.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                {u.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={clear}
        className="mt-6 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
        Clear local history
      </button>
    </div>
  )
}
