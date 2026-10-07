import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface Company {
  id: number
  name: string
  industry?: string | null
  website?: string | null
  location?: string | null
  description?: string | null
  contact_email?: string | null
  created_at: string
}

interface StudentPlacementDrive {
  id: number
  company_id: number
  job_title: string
  role_type: string
  package_lpa: number
  job_location?: string | null
  description?: string | null
  deadline: string
  status: string
  min_cgpa: number
  min_tenth_pct: number
  min_twelfth_pct: number
  max_active_backlogs: number
  allowed_departments: string[]
  created_at: string
  company: Company
  is_eligible: boolean
  eligibility_reasons: string[]
  matched_criteria: string[]
  has_applied?: boolean
  application_status?: string | null
}

interface StudentDrivesViewProps {
  user: UserSession
  token: string
  onBack: () => void
  onViewApplications?: () => void
}

export function StudentDrivesView({
  user,
  token,
  onBack,
  onViewApplications
}: StudentDrivesViewProps) {
  const [drives, setDrives] = useState<StudentPlacementDrive[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [applyingDriveId, setApplyingDriveId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'eligible' | 'high_package'>('all')
  const [expandedCriteriaDriveId, setExpandedCriteriaDriveId] = useState<number | null>(null)

  useEffect(() => {
    fetchDrives()
  }, [])

  const fetchDrives = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/v1/students/drives', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Failed to load drives (HTTP ${response.status})`)
      }

      const data = await response.json()
      setDrives(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not fetch campus placement drives.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (driveId: number, companyName: string) => {
    setApplyingDriveId(driveId)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const response = await fetch(`/api/v1/students/drives/${driveId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.detail || `Application submission failed (HTTP ${response.status})`)
      }

      // Update local state
      setDrives((prev) =>
        prev.map((d) =>
          d.id === driveId ? { ...d, has_applied: true, application_status: 'Applied' } : d
        )
      )
      setSuccessMsg(`Successfully applied to ${companyName}! You can track its live status in My Applications.`)
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit application.')
    } finally {
      setApplyingDriveId(null)
    }
  }

  // Filter and Search logic
  const filteredDrives = drives.filter((d) => {
    const matchesSearch =
      d.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.job_location && d.job_location.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (filterMode === 'eligible') {
      return d.is_eligible
    }
    if (filterMode === 'high_package') {
      return d.package_lpa >= 15.0
    }
    return true
  })

  const eligibleCount = drives.filter((d) => d.is_eligible).length

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Active Campus Recruitment Drives
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Live Openings
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse visiting company drives with instant real-time eligibility evaluation based on your profile.
            </p>
          </div>
        </div>

        {/* Student Summary Pill */}
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-start md:self-auto">
          <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-xl">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Logged in Applicant</p>
            <p className="font-bold text-slate-900 dark:text-white font-mono">{user.full_name}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900/90 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
            }`}
          >
            All Drives ({drives.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('eligible')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filterMode === 'eligible'
                ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-md shadow-emerald-600/20'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Eligible For Me ({eligibleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('high_package')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filterMode === 'high_package'
                ? 'bg-amber-600 text-slate-900 dark:text-white shadow-md shadow-amber-600/20'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            High Package (15+ LPA)
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
          />
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-200">{successMsg}</p>
          </div>
          {onViewApplications && (
            <button
              onClick={onViewApplications}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white text-xs font-bold whitespace-nowrap cursor-pointer transition-all shadow-md"
            >
              View Pipeline ➔
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs text-rose-200">{errorMsg}</p>
        </div>
      )}

      {/* Drives Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Evaluating your eligibility against active recruitment drives...</p>
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Drives Match Your Criteria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filterMode === 'eligible'
              ? 'You do not meet cutoffs for current drives yet. Make sure your academic records are filled in your profile!'
              : 'Try clearing your search query or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDrives.map((drive) => {
            const isExpanded = expandedCriteriaDriveId === drive.id

            return (
              <div
                key={drive.id}
                className={`bg-white dark:bg-slate-900/80 shadow-xs border rounded-3xl p-6 space-y-5 transition-all shadow-xl flex flex-col justify-between ${
                  drive.is_eligible
                    ? 'border-emerald-500/40 hover:border-emerald-500/70 shadow-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Company & Role Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          {drive.company.name}
                        </span>
                        {drive.company.website && (
                          <a
                            href={drive.company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-indigo-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {drive.company.industry && (
                          <span className="text-[10px] bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
                            {drive.company.industry}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {drive.job_title}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        ₹{drive.package_lpa} LPA
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400">{drive.role_type}</span>
                    </div>
                  </div>

                  {/* Location & Deadline */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                    {drive.job_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {drive.job_location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-[11px] text-amber-300/90">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Deadline: {new Date(drive.deadline).toLocaleDateString()}
                    </span>
                  </div>

                  {drive.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {drive.description}
                    </p>
                  )}

                  {/* ================= REAL-TIME ELIGIBILITY STATUS BANNER ================= */}
                  <div
                    className={`rounded-2xl p-4 border transition-all ${
                      drive.is_eligible
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {drive.is_eligible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold">
                          {drive.is_eligible
                            ? 'You are Eligible for this Drive! 🚀'
                            : 'Not Eligible for this Drive'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCriteriaDriveId(isExpanded ? null : drive.id)
                        }
                        className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white inline-flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {isExpanded ? 'Hide Criteria' : 'View Criteria'}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Reasons breakdown if not eligible */}
                    {!drive.is_eligible && drive.eligibility_reasons.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-rose-500/20 space-y-1">
                        {drive.eligibility_reasons.map((r, idx) => (
                          <p key={idx} className="text-[11px] text-rose-200/90 flex items-start gap-1.5">
                            <span className="text-rose-400">•</span>
                            <span>{r}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Expandable Criteria Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Drive Cutoff Criteria:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <div>Min CGPA: <strong className="text-slate-900 dark:text-white">{drive.min_cgpa > 0 ? drive.min_cgpa : 'None'}</strong></div>
                          <div>Max Backlogs: <strong className="text-slate-900 dark:text-white">{drive.max_active_backlogs}</strong></div>
                          <div>Min 10th: <strong className="text-slate-900 dark:text-white">{drive.min_tenth_pct > 0 ? `${drive.min_tenth_pct}%` : 'None'}</strong></div>
                          <div>Min 12th: <strong className="text-slate-900 dark:text-white">{drive.min_twelfth_pct > 0 ? `${drive.min_twelfth_pct}%` : 'None'}</strong></div>
                        </div>
                        {drive.allowed_departments.length > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Eligible Branches: <strong className="text-slate-800 dark:text-slate-200">{drive.allowed_departments.join(', ')}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Posted on {new Date(drive.created_at).toLocaleDateString()}
                  </span>

                  {drive.has_applied ? (
                    <button
                      type="button"
                      onClick={onViewApplications}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Applied ✓ {drive.application_status ? `(${drive.application_status})` : '(Under Review)'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!drive.is_eligible || applyingDriveId === drive.id}
                      onClick={() => handleApply(drive.id, drive.company.name)}
                      className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        drive.is_eligible
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {applyingDriveId === drive.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Award className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {applyingDriveId === drive.id
                          ? 'Submitting Application...'
                          : drive.is_eligible
                          ? 'Apply for Drive'
                          : 'Locked (Not Eligible)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
