import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { registerUser, loginUser, googleLoginUser } from '../services/api'
import { Loader2 } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setBusy(true)
        const res = await googleLoginUser(tokenResponse.access_token)
        if (res.access_token) {
          await login(res.access_token)
          navigate('/dashboard')
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Google Login failed')
      } finally {
        setBusy(false)
      }
    },
    onError: () => setError('Google Login Failed')
  })

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-center text-3xl font-bold text-slate-900 dark:text-white">Create account</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Sign up to save history and more</p>
        <form
          className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setBusy(true)
            try {
              await registerUser(email, password)
              const res = await loginUser(email, password)
              if (res.access_token) {
                await login(res.access_token)
                navigate('/dashboard')
              }
            } catch (err: any) {
              setError(err.response?.data?.detail || 'Failed to register account')
            } finally {
              setBusy(false)
            }
          }}
        >
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => googleLogin()}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition"
          >
            Continue with Google
          </button>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-violet-600 dark:text-violet-400">
              Login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
