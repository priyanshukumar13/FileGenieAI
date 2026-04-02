import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Loader2, Download } from 'lucide-react'
import { postAiCommand, downloadUrl } from '../../services/api'
import { useHistory } from '../../context/HistoryContext'

type Msg = { role: 'user' | 'assistant'; text: string; fileUrl?: string | null }

export function ChatAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: "Hi — I'm your FileGenie assistant. I can run any tool in the backend: compress, merge, convert, translate, and more. Attach PDFs or Office files and tell me what you need.",
    },
  ])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addDownload } = useHistory()

  const send = useCallback(async () => {
    const cmd = input.trim()
    if (!cmd && files.length === 0) return
    setBusy(true)
    setMessages((m) => [...m, { role: 'user', text: cmd || 'Uploaded file(s)', fileUrl: undefined }])
    setInput('')
    try {
      const res = await postAiCommand(cmd, files)
      setFiles([])
      if (fileRef.current) fileRef.current.value = ''
      if (res.file_url) {
        addDownload(res.action ?? 'result', downloadUrl(res.file_url))
      }
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: res.message,
          fileUrl: res.file_url,
        },
      ])
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Something went wrong: ${e instanceof Error ? e.message : String(e)}` },
      ])
    } finally {
      setBusy(false)
    }
  }, [input, files, addDownload])

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl border border-slate-200/80 bg-white/60 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/40">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-800/80">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI assistant</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Natural language → tool execution → download</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                    : 'border border-slate-200/80 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.fileUrl && (
                  <a
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                      m.role === 'user'
                        ? 'bg-white/20 text-white underline'
                        : 'bg-violet-500/15 text-violet-700 underline dark:bg-violet-500/20 dark:text-violet-300'
                    }`}
                    href={downloadUrl(m.fileUrl)}
                    download
                  >
                    <Download className="h-4 w-4" />
                    Download file
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running tools…
          </div>
        )}
      </div>

      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800/80">
        <div
          className="mb-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500 transition hover:border-violet-400 dark:border-slate-600 dark:bg-slate-900/30 dark:text-slate-400"
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('border-violet-500')
          }}
          onDragLeave={(e) => e.currentTarget.classList.remove('border-violet-500')}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-violet-500')
            const list = Array.from(e.dataTransfer.files)
            if (list.length) setFiles((prev) => [...prev, ...list])
          }}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            id="chat-files"
            onChange={(e) => {
              if (e.target.files) {
                const list = Array.from(e.target.files)
                setFiles((prev) => [...prev, ...list])
              }
            }}
          />
          <label htmlFor="chat-files" className="cursor-pointer">
            Drop files here or <span className="text-violet-600 dark:text-violet-400">browse</span>
          </label>
          {files.length > 0 && (
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium mb-1">Files attached ({files.length}):</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {files.map((f, i) => (
                  <span key={i} className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md max-w-xs truncate">
                    {f.name}
                  </span>
                ))}
              </div>
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFiles([]); if (fileRef.current) fileRef.current.value = ''; }}
                className="mt-2 text-red-500 hover:text-red-700 hover:underline"
              >
                Clear all files
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-slate-200 p-3 text-slate-600 dark:border-slate-600 dark:text-slate-300"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. Compress this PDF, merge these files, translate to Hindi…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            disabled={busy}
          />
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
            onClick={() => void send()}
            disabled={busy}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
