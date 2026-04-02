import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { sendContactMessage } from '../services/api'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Contact</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">We typically reply within one business day.</p>
      </motion.div>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <Mail className="mb-3 h-8 w-8 text-violet-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Email</h2>
          <a href="mailto:pk2525507@gmail.com" className="mt-1 text-violet-600 dark:text-violet-400">
            pk2525507@gmail.com
          </a>
          <p className="mt-4 text-sm text-slate-500">
            Form submissions are emailed to the address configured on the server (<code className="text-xs">CONTACT_NOTIFY_EMAIL</code>).
          </p>
        </div>

        <form
          className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
          onSubmit={(e) => {
            e.preventDefault()
            setBusy(true)
            setFeedback(null)
            void sendContactMessage(name, email, message)
              .then(() => setFeedback({ ok: true, text: 'Message sent. Thank you!' }))
              .catch((err: unknown) => {
                let msg = 'Could not send. Configure SMTP in backend .env (see .env.example).'
                if (axios.isAxiosError(err)) {
                  const d = err.response?.data as { detail?: string } | undefined
                  if (d?.detail) msg = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail)
                }
                setFeedback({ ok: false, text: msg })
              })
              .finally(() => setBusy(false))
          }}
        >
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          />
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          />
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send message
          </button>
          {feedback && (
            <p
              className={`mt-3 flex items-start gap-2 text-sm ${feedback.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {!feedback.ok && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {feedback.text}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
