import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Wrench, Shield, LayoutGrid, PanelLeftClose, PanelLeft, Scissors } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { ChatAssistant } from '../components/dashboard/ChatAssistant'
import { ToolsPanel } from '../components/dashboard/ToolsPanel'
import { SecurityPanel } from '../components/dashboard/SecurityPanel'
import { PageOrganizer } from '../components/dashboard/PageOrganizer'
import { SplitTool } from '../components/dashboard/SplitTool'

type Section = 'assistant' | 'tools' | 'security' | 'organize' | 'split'

const nav: { id: Section; label: string; icon: typeof MessageSquare }[] = [
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'tools', label: 'PDF & Convert', icon: Wrench },
  { id: 'organize', label: 'Page order', icon: LayoutGrid },
  { id: 'split', label: 'Split PDF', icon: Scissors },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSection = (searchParams.get('section') as Section) || 'assistant'
  const [section, setSection] = useState<Section>(initialSection)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Sync state back to URL if user clicks sidebar
  const handleSectionChange = (newSection: Section) => {
    setSection(newSection)
    setSearchParams({ section: newSection })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <div className="flex flex-1">
        {/* Desktop sidebar — single navigation for entire workspace */}
        <aside
          className={`hidden shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900 md:flex ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <div className="sticky top-[57px] flex h-[calc(100vh-57px)] w-full flex-col p-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="mb-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </button>
            <p className={`mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${!sidebarOpen ? 'sr-only' : ''}`}>
              Workspace
            </p>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon
                const active = section === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )
              })}
            </nav>
            <div className={`mt-auto border-t border-slate-200 pt-4 dark:border-slate-800 ${!sidebarOpen ? 'hidden' : ''}`}>
              <p className="px-2 text-xs text-slate-500 dark:text-slate-400">
                All tools run on your FastAPI backend. Max size set on server.
              </p>
              <Link to="/settings" className="mt-2 block px-2 text-xs font-medium text-violet-600 dark:text-violet-400">
                Settings →
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile section tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionChange(item.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
                  section === item.id ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <motion.main
            key={section}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8"
          >
            {section === 'assistant' && <ChatAssistant />}
            {section === 'tools' && <ToolsPanel />}
            {section === 'security' && <SecurityPanel />}
            {section === 'organize' && <PageOrganizer />}
            {section === 'split' && <SplitTool />}
          </motion.main>
        </div>
      </div>
    </div>
  )
}
