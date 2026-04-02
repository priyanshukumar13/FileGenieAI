import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutGrid, MessageSquare, Shield, Wrench } from 'lucide-react'

const cards = [
  {
    to: '/dashboard/tools',
    title: 'Tools',
    desc: 'Upload files, pick an action (convert, compress, merge…), and download results — no chat.',
    icon: Wrench,
  },
  {
    to: '/dashboard/assistant',
    title: 'AI Assistant',
    desc: 'Describe what you need in plain language; the assistant picks a tool and runs it.',
    icon: MessageSquare,
  },
  {
    to: '/dashboard/organize',
    title: 'Page order',
    desc: 'Reorder PDF pages visually, then export.',
    icon: LayoutGrid,
  },
  {
    to: '/dashboard/security',
    title: 'Security',
    desc: 'Password strength, file scan, and PDF checks.',
    icon: Shield,
  },
]

export default function DashboardOverview() {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Choose direct tools for predictable workflows, or open the AI assistant for natural-language routing.
        </p>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={c.to}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm transition hover:border-violet-400/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
            >
              <c.icon className="mb-3 h-8 w-8 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{c.title}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{c.desc}</p>
              <span className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400">Open →</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
