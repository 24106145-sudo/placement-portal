import { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sparkles
} from 'lucide-react'

export interface UserSession {
  id: number
  full_name: string
  email: string
  role: 'student' | 'officer' | 'admin'
  created_at: string
}

interface LoginFormProps {
  onLoginSuccess: (user: UserSession, token: string) => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      })

      let data: any = null
      try {
        data = await response.json()
      } catch {
        // Fallback for non-JSON responses
      }

      if (!response.ok) {
        if (data && data.detail) {
          throw new Error(data.detail)
        }
        throw new Error(`Login failed (HTTP ${response.status})`)
      }

      if (data && data.user) {
        onLoginSuccess(data.user, data.access_token)
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not connect to the backend server. Please verify it is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/90 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl p-6 md:p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Sign In to Campus Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome Back! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm max-w-md mx-auto">
            Access your student applications, campus recruitment drives, or administrative console.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-md dark:shadow-2xl"
      >
        {/* Email Address */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Registered Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="email"
              required
              placeholder="e.g. waqqas.student@college.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-2xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Login Failed</p>
              <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          {loading ? (
            <>Authenticating...</>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In to Your Account
            </>
          )}
        </button>

        {/* Switch to Register */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <span>Don't have an account yet?</span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline underline-offset-4 cursor-pointer"
          >
            Create New Account
          </button>
        </div>
      </form>
    </div>
  )
}
