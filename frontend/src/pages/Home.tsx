import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileStack, MessageCircle, Zap, Sparkles } from 'lucide-react'

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden mesh-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <motion.div {...fade} transition={{ duration: 0.5 }} className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered PDF Toolkit
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
              Documents that work as hard as you do
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              Merge, compress, convert, and chat with PDFs — one assistant controls every backend tool. Built for teams who
              want Smallpdf power with ChatGPT flexibility.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/dashboard?section=tools"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/30"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard?section=assistant"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur dark:border-slate-600 dark:bg-slate-900/80 dark:text-white"
              >
                Try AI assistant
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <video
  className="rounded-3xl border border-slate-200/80 shadow-2xl dark:border-slate-700/80 w-full"
  autoPlay
  muted
  loop
  playsInline
>
  <source src="/video/demo.mp4" type="video/mp4" />
</video>
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Trusted workflow</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Chat → tool → download</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <motion.h2 {...fade} className="mb-10 text-center text-3xl font-bold text-slate-900 dark:text-white">
          Everything in one platform
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileStack, title: 'Convert & merge', desc: 'PDF ↔ Office, images, HTML — with intelligent routing.' },
            { icon: Zap, title: 'Compress & fix', desc: 'Smaller files without breaking structure.' },
            { icon: MessageCircle, title: 'AI assistant', desc: 'Natural language drives the tool registry.' },
            { icon: Sparkles, title: 'Security', desc: 'Scan files, check passwords, protect PDFs.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              {...fade}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/60"
            >
              <f.icon className="mb-4 h-10 w-10 text-violet-600 dark:text-violet-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Video + how it works */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6">
          <motion.div {...fade} className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-xl dark:border-slate-700">
            <video 
  className="aspect-video w-full object-cover rounded-2xl"
  autoPlay 
  muted 
  loop 
  playsInline 
  poster="/images/lost-preview.jpg"
>
  <source src="/video/how.mp4" type="video/mp4" />
</video>
            <p className="bg-slate-950 px-4 py-2 text-center text-xs text-slate-400">Upload → convert → download</p>
          </motion.div>
          <motion.div {...fade} transition={{ delay: 0.1 }} className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">How it works</h2>
            <ol className="mt-6 space-y-4 text-slate-600 dark:text-slate-400">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  1
                </span>
                <span>Open the dashboard and pick the assistant or a direct tool.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  2
                </span>
                <span>Upload files — drag &amp; drop or browse. The AI maps intent to an action.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  3
                </span>
                <span>FastAPI runs the tool, returns a download link, and keeps history on your account page.</span>
              </li>
            </ol>
            <Link to="/features" className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400">
              Explore all features <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
