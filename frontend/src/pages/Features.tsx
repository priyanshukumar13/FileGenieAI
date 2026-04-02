import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wand2, Loader2 } from 'lucide-react'
import { fetchRegistry } from '../services/api'
import { getToolMeta } from '../data/toolMeta'

const labels: Record<string, string> = {
  organization: '📂 PDF organization',
  create_convert_to_pdf: '📄 Create & export to PDF',
  convert_from_pdf: '📥 Convert from PDF',
  optimization: '⚡ Optimize & repair',
  ai_intelligence: '🧠 AI intelligence',
  editing: '✏️ Edit & annotate',
  security: '🔐 Security',
  utility: '🧰 Utility',
}

export default function Features() {
  const [categories, setCategories] = useState<Record<string, string[]> | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void fetchRegistry()
      .then((r) => setCategories(r.categories))
      .catch(() => setErr('Unable to reach API. Start the backend to load live tools.'))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Every tool, one backend</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
          These actions map 1:1 to the FastAPI tool registry. Use them from the dashboard or let the AI assistant pick
          them for you.
        </p>
        <Link
          to="/dashboard?section=tools"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30"
        >
          <Wand2 className="h-4 w-4" />
          Open toolkit
        </Link>
      </motion.div>

      {!categories && !err && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        </div>
      )}
      {err && <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-center text-amber-800 dark:text-amber-200">{err}</p>}

      {categories &&
        Object.entries(categories).map(([key, actions]) => (
          <section key={key} className="mb-16">
            <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
              {labels[key] ?? key.replace(/_/g, ' ')}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map((action, i) => {
                const meta = getToolMeta(action)
                return (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white/80 p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 hover:border-violet-400/60 hover:shadow-[0_12px_40px_-8px_rgba(124,58,237,0.35)] dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-950/80 dark:hover:border-violet-500/50"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="text-3xl" aria-hidden>
                        {meta.emoji}
                      </span>
                      <span className="rounded-lg bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] text-violet-700 dark:text-violet-300">
                        {action}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{meta.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{meta.blurb}</p>
                    <Link
                      to={`/dashboard?section=tools&action=${action}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 opacity-90 transition group-hover:opacity-100 dark:text-violet-400"
                    >
                      Use tool →
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </section>
        ))}
    </div>
  )
}
