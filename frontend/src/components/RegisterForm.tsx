import { useState } from 'react'
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Building2
} from 'lucide-react'

type RoleType = 'student' | 'officer' | 'admin'

interface RegisterSuccessData {
  id: number
  full_name: string
  email: string
  role: RoleType
  created_at: string
}

const ROLES: {
  id: RoleType
  title: string
  badge: string
  icon: typeof GraduationCap
  description: string
  color: string
}[] = [
  {
    id: 'student',
    title: 'Student',
    badge: 'Applicant',
    icon: GraduationCap,
    description: 'Apply for campus jobs, build your profile, and track interview drives.',
    color: 'indigo'
  },
  {
    id: 'officer',
    title: 'Placement Officer',
    badge: 'Coordinator',
    icon: Briefcase,
    description: 'Post job drives, review student applications, and coordinate with companies.',
    color: 'emerald'
  },
  {
    id: 'admin',
    title: 'Admin',
    badge: 'Management',
    icon: ShieldCheck,
    description: 'Manage institutional settings, user permissions, and placement analytics.',
    color: 'amber'
  }
]

export function RegisterForm() {
  const [selectedRole, setSelectedRole] = useState<RoleType>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<RegisterSuccessData | null>(null)

  // Validation state
  const isNameValid = fullName.trim().length >= 2
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const hasMinLength = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const isPasswordValid = hasMinLength && hasLetter && hasNumber
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Client-side validation checks
    if (!isNameValid) {
      setErrorMessage('Please enter a valid full name (at least 2 characters).')
      return
    }
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (!isPasswordValid) {
      setErrorMessage('Password must be at least 8 characters and contain both letters and numbers.')
      return
    }
    if (!doPasswordsMatch) {
      setErrorMessage('Passwords do not match. Please verify.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          role: selectedRole
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
          if (Array.isArray(data.detail)) {
            const msg = data.detail.map((err: { msg?: string }) => err.msg || 'Invalid input').join(', ')
            throw new Error(msg)
          } else {
            throw new Error(data.detail)
          }
        }
        throw new Error(`Registration failed with status: ${response.status}`)
      }

      if (data) {
        setSuccessData(data)
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not connect to FastAPI server. Make sure it is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSuccessData(null)
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setErrorMessage(null)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Education/Campus Theme Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/90 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl p-6 md:p-10 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Campus Recruitment Network
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Create Your Portal Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
              Join students, placement coordinators, and campus administrators on the centralized placement platform.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Institutional Database</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">MySQL 3306</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success View */}
      {successData ? (
        <div className="bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center space-y-6 backdrop-blur-xl shadow-md dark:shadow-2xl animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registration Successful! 🎉</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              Your account has been securely encrypted and stored in the MySQL database.
            </p>
          </div>

          {/* Registered User Summary Card */}
          <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-slate-500 dark:text-slate-400">User ID:</span>
              <span className="text-indigo-700 dark:text-indigo-300 font-bold">#{successData.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
              <span className="text-slate-900 dark:text-white font-bold">{successData.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
              <span className="text-slate-800 dark:text-white">{successData.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
              <span className="capitalize px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold">
                {successData.role}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 dark:text-slate-400">Database Record:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">SAVED TO MYSQL</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Register Another Account
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 space-y-8 backdrop-blur-xl shadow-md dark:shadow-2xl"
        >
          {/* 1. Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
              1. Select Your Portal Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLES.map((role) => {
                const Icon = role.icon
                const isSelected = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs dark:bg-indigo-600/15 dark:border-indigo-500 dark:ring-indigo-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white dark:bg-slate-950/60 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-3 rounded-xl ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {role.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{role.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Personal & Account Details */}
          <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              2. Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  College / Institutional Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="alex.johnson@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria Badges */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                      hasMinLength
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-500'
                    }`}
                  >
                    {hasMinLength ? '✓' : '•'} 8+ Characters
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                      hasLetter
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-500'
                    }`}
                  >
                    {hasLetter ? '✓' : '•'} Letters
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                      hasNumber
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-500'
                    }`}
                  >
                    {hasNumber ? '✓' : '•'} Numbers
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                      confirmPassword.length > 0 && !doPasswordsMatch
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !doPasswordsMatch && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert Display */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Registration Error</p>
                <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              🔒 Passwords are encrypted with bcrypt before MySQL storage.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm px-8 py-3.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>Processing Registration...</>
              ) : (
                <>
                  Register as {ROLES.find((r) => r.id === selectedRole)?.title}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
