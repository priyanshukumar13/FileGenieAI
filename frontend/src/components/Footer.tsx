import { Link } from 'react-router-dom'
import { Code2, Globe, Mail, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </span>
              FileGenie AI
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              AI-driven PDF toolkit: merge, convert, compress, OCR, and chat with your documents. Built for speed and clarity.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Connect</h3>
            <div className="flex gap-4">

              {/* Email */}
              <div className="group relative">
                <a
                  href="mailto:pk2525507@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 
                  hover:border-violet-400 hover:text-violet-600 hover:scale-110 
                  hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 
                  dark:border-slate-700 dark:text-slate-400"
                >
                  <Mail className="h-5 w-5" />
                </a>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                  Send Email
                </span>
              </div>

              {/* GitHub */}
              <div className="group relative">
                <a
                  href="https://github.com/priyanshukumar13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 
                  hover:border-violet-400 hover:text-violet-600 hover:scale-110 
                  hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 
                  dark:border-slate-700 dark:text-slate-400"
                >
                  <Code2 className="h-5 w-5" />
                </a>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                  Visit GitHub
                </span>
              </div>

              {/* LinkedIn */}
              <div className="group relative">
                <a
                  href="https://www.linkedin.com/in/priyanshu-kumar-gurjar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 
                  hover:border-violet-400 hover:text-violet-600 hover:scale-110 
                  hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 
                  dark:border-slate-700 dark:text-slate-400"
                >
                  <Globe className="h-5 w-5" />
                </a>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                  Visit LinkedIn
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom */}
        <p className="mt-10 border-t border-slate-200 pt-8 text-center text-xs text-slate-500 dark:border-slate-800">
          © {new Date().getFullYear()} FileGenie AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}