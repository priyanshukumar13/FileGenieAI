import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Download, FileText, Trash2 } from 'lucide-react'
import { splitPdf, fetchPdfInfo, downloadUrl } from '../../services/api'
import { useHistory } from '../../context/HistoryContext'

export function SplitTool() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [mode, setMode] = useState<'range' | 'every_n' | 'extract'>('range')
  
  const [ranges, setRanges] = useState('')
  const [everyN, setEveryN] = useState('2')
  const [extractPages, setExtractPages] = useState('')
  
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; name: string } | null>(null)
  
  const { addDownload } = useHistory()

  const handleFileUpload = async (f: File) => {
    setFile(f)
    setResult(null)
    setError(null)
    setPageCount(0)
    try {
      setBusy(true)
      const res = await fetchPdfInfo(f)
      setPageCount(res.page_count)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to read PDF pages.')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please upload a file first.')
      return
    }

    setError(null)
    setBusy(true)
    setResult(null)

    const payload: Record<string, string | number> = {}
    if (mode === 'range') {
      if (!ranges) return setError('Please provide ranges (e.g. 1-3,4-6)')
      payload.ranges = ranges
    } else if (mode === 'every_n') {
      const n = parseInt(everyN)
      if (isNaN(n) || n < 1) return setError('Please provide a valid number > 0')
      payload.every_n = n
    } else if (mode === 'extract') {
      if (!extractPages) return setError('Please provide pages (e.g. 1,4,5)')
      payload.pages = extractPages
    }

    try {
      const res = await splitPdf(file, mode, payload)
      if (res.ok && res.file_url) {
        setResult({ url: res.file_url, name: res.file_url.endsWith('.zip') ? 'split_results.zip' : 'split_result.pdf' })
        addDownload('split_pdf', downloadUrl(res.file_url))
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to split PDF')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div 
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${file ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-300 hover:border-violet-400 dark:border-slate-700 dark:bg-slate-900/40'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f?.type === 'application/pdf') handleFileUpload(f)
        }}
      >
        {!file ? (
          <div>
            <input 
              type="file" 
              accept="application/pdf"
              className="hidden" 
              id="split-upload"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
            />
            <label htmlFor="split-upload" className="cursor-pointer text-slate-500 hover:text-violet-600 block">
              <FileText className="h-10 w-10 mx-auto mb-3 text-violet-400" />
              <p className="font-medium">Drop PDF here or click to browse</p>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 overflow-hidden text-left">
              <FileText className="h-8 w-8 text-violet-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount > 0 ? `${pageCount} Pages` : 'Loading...'}</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setPageCount(0); }} className="p-2 text-slate-400 hover:text-red-500 transition">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {file && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Split Options</h3>
          
          <div className="space-y-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" checked={mode === 'range'} onChange={() => setMode('range')} className="mt-1" />
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">Split by page range</p>
                <p className="text-xs text-slate-500 mb-2">Create multiple PDFs based on ranges (e.g. 1-3,4-6)</p>
                {mode === 'range' && (
                  <input type="text" value={ranges} onChange={e => setRanges(e.target.value)} placeholder="1-3, 4-6" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-950 dark:border-slate-700" />
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" checked={mode === 'every_n'} onChange={() => setMode('every_n')} className="mt-1" />
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">Split every N pages</p>
                <p className="text-xs text-slate-500 mb-2">Create a new PDF every N pages</p>
                {mode === 'every_n' && (
                  <input type="number" min="1" value={everyN} onChange={e => setEveryN(e.target.value)} placeholder="e.g. 2" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-950 dark:border-slate-700" />
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" checked={mode === 'extract'} onChange={() => setMode('extract')} className="mt-1" />
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">Extract specific pages</p>
                <p className="text-xs text-slate-500 mb-2">Create a single PDF with only these pages</p>
                {mode === 'extract' && (
                  <input type="text" value={extractPages} onChange={e => setExtractPages(e.target.value)} placeholder="1,3,5" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-950 dark:border-slate-700" />
                )}
              </div>
            </label>
          </div>

          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <button 
            type="submit" 
            disabled={busy || !file} 
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Processing...' : 'Split PDF'}
          </button>
        </form>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-emerald-800 dark:text-emerald-400 font-semibold mb-2">Success!</h3>
          <p className="text-emerald-600 dark:text-emerald-500 text-sm mb-4">Your file has been split successfully.</p>
          <a href={downloadUrl(result.url)} download className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl transition">
            <Download className="h-4 w-4" /> Download {result.name}
          </a>
        </motion.div>
      )}
    </div>
  )
}
