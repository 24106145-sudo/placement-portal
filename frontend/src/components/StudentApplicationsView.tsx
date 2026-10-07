import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
  Loader2,
  Briefcase,
  Award,
  XCircle,
  FileCheck,
  Send,
  Video,
  CheckCircle
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
  created_at?: string
}

interface PlacementDrive {
  id: number
  company_id?: number
  job_title?: string
  role_type?: string
  package_lpa?: number
  job_location?: string | null
  description?: string | null
  deadline?: string
  status?: string
  min_cgpa?: number
  min_tenth_pct?: number
  min_twelfth_pct?: number
  max_active_backlogs?: number
  allowed_departments?: string[]
  created_at?: string
  company?: Company | null
}

interface DriveSchedule {
  id: number
  drive_id: number
  round_name: string
  round_type: string
  scheduled_at: string
  venue_or_link?: string | null
  instructions?: string | null
  is_completed: boolean
}

export interface StudentApplication {
  id: number
  drive_id: number
  student_id: number
  applied_at: string
  status: 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected' | string
  notes?: string | null
  offered_ctc_lpa?: number | null
  schedules?: DriveSchedule[]
  drive?: PlacementDrive | null
}

interface StudentApplicationsViewProps {
  user: UserSession
  token: string
  onBack: () => void
  onBrowseDrives?: () => void
}

const STAGES: ('Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Selected')[] = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Selected'
]

export function StudentApplicationsView({
  user: _user,
  token,
  onBack,
  onBrowseDrives
}: StudentApplicationsViewProps) {
  const [applications, setApplications] = useState<StudentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/v1/students/my-applications', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Failed to load applications (HTTP ${response.status})`)
      }

      const data = await response.json()
      setApplications(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load your applications.')
    } finally {
      setLoading(false)
    }
  }

  const getStageIndex = (status?: string | null) => {
    switch (status) {
      case 'Applied':
        return 0
      case 'Shortlisted':
        return 1
      case 'Interview Scheduled':
        return 2
      case 'Selected':
        return 3
      case 'Rejected':
        return -1
      default:
        return 0
    }
  }

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'Selected':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border-emerald-500/40',
          icon: Award,
          text: 'Selected / Offer Received 🎉'
        }
      case 'Interview Scheduled':
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          icon: Calendar,
          text: 'Interview Scheduled 🗓️'
        }
      case 'Shortlisted':
        return {
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
          icon: CheckCircle2,
          text: 'Shortlisted for Round 2 ⚡'
        }
      case 'Rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 border-rose-500/40',
          icon: XCircle,
          text: 'Not Shortlisted'
        }
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border-amber-500/40',
          icon: Clock,
          text: 'Under Review'
        }
    }
  }

  const safeApplications = Array.isArray(applications) ? applications : []

  const filteredApplications = safeApplications.filter((app) => {
    if (!app) return false

    const jobTitle = (app.drive?.job_title || '').toLowerCase()
    const companyName = (app.drive?.company?.name || '').toLowerCase()
    const location = (app.drive?.job_location || '').toLowerCase()
    const q = searchQuery.toLowerCase().trim()

    const matchesSearch = !q || jobTitle.includes(q) || companyName.includes(q) || location.includes(q)

    if (!matchesSearch) return false

    if (statusFilter !== 'all') {
      return app.status === statusFilter
    }

    return true
  })

  // Count summaries
  const totalCount = safeApplications.length
  const underReviewCount = safeApplications.filter((a) => a?.status === 'Applied').length
  const shortlistedCount = safeApplications.filter((a) => a?.status === 'Shortlisted').length
  const interviewCount = safeApplications.filter((a) => a?.status === 'Interview Scheduled').length
  const selectedCount = safeApplications.filter((a) => a?.status === 'Selected').length

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Top Header */}
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
                My Job Applications
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Live Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track recruitment stage progression, interview call updates, and final offers from visiting companies.
            </p>
          </div>
        </div>

        {onBrowseDrives && (
          <button
            onClick={onBrowseDrives}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            Browse Open Drives
          </button>
        )}
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Applied</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-amber-400 font-medium">Under Review</span>
          <p className="text-xl font-bold text-amber-300 font-mono">{underReviewCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-blue-400 font-medium">Shortlisted</span>
          <p className="text-xl font-bold text-blue-300 font-mono">{shortlistedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-purple-400 font-medium">Interviews</span>
          <p className="text-xl font-bold text-purple-300 font-mono">{interviewCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900/80 shadow-xs border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-emerald-400 font-medium">Selected Offers</span>
          <p className="text-xl font-bold text-emerald-300 font-mono">{selectedCount}</p>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900/90 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {['all', 'Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
              }`}
            >
              {status === 'all' ? 'All Applications' : status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search role or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs text-rose-200">{errorMsg}</p>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading your submitted applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl w-fit mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Applications Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {statusFilter !== 'all' || searchQuery
                ? 'No applications match your current search and filter settings.'
                : 'You have not submitted applications to any campus recruitment drives yet.'}
            </p>
          </div>
          {onBrowseDrives && (
            <button
              onClick={onBrowseDrives}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Explore Campus Drives
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApplications.map((app) => {
            if (!app) return null

            const badge = getStatusBadge(app.status)
            const BadgeIcon = badge.icon
            const currentStageIndex = getStageIndex(app.status)
            const isRejected = app.status === 'Rejected'
            const companyName = app.drive?.company?.name || 'Recruiting Company'
            const website = app.drive?.company?.website
            const industry = app.drive?.company?.industry
            const jobTitle = app.drive?.job_title || 'Campus Placement Role'
            const packageLpa = app.drive?.package_lpa ?? 0
            const roleType = app.drive?.role_type || 'Full Time'
            const location = app.drive?.job_location
            const appliedDate = app.applied_at ? new Date(app.applied_at) : null

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900/85 shadow-xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700/90 rounded-3xl p-6 space-y-6 transition-all shadow-xl"
              >
                {/* Header row: Company, Role, Package & Status Badge */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        {companyName}
                      </span>
                      {website && (
                        <a
                          href={website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-indigo-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {industry && (
                        <span className="text-[10px] bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
                          {industry}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {jobTitle}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        ₹{packageLpa} LPA
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {roleType}
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.text}</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Progress Tracker */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>Recruitment Progress</span>
                    <span>
                      Application ID: <strong className="text-slate-900 dark:text-white font-mono">#APP-{app.id}</strong>
                    </span>
                  </div>

                  {isRejected ? (
                    <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-rose-300">Application Closed</p>
                        <p className="text-rose-200/80 mt-0.5">
                          {app.notes || 'You were not shortlisted for this specific round. Keep applying to other active company drives!'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {STAGES.map((stageName, stageIdx) => {
                        const isCompleted = currentStageIndex >= stageIdx
                        const isCurrent = currentStageIndex === stageIdx

                        return (
                          <div key={stageName} className="space-y-2">
                            {/* Bar segment */}
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isCompleted
                                  ? stageIdx === 3
                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                                    : 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                                  : 'bg-slate-800'
                              }`}
                            />
                            {/* Step label */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                  isCompleted
                                    ? 'bg-indigo-600 text-slate-900 dark:text-white'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {stageIdx + 1}
                              </span>
                              <span
                                className={`text-[11px] font-medium truncate ${
                                  isCurrent
                                    ? 'text-slate-900 dark:text-white font-bold'
                                    : isCompleted
                                    ? 'text-indigo-300'
                                    : 'text-slate-500'
                                }`}
                              >
                                {stageName}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Confirmed Offer Banner */}
                {app.status === 'Selected' && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          Congratulations! Official Placement Offer Confirmed 🎉
                        </h4>
                        <p className="text-xs text-emerald-200/80">
                          You have successfully cleared all assessment & interview rounds for this drive.
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right bg-emerald-900/30 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
                      <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">Offered Package</span>
                      <span className="text-base font-bold text-emerald-300 font-mono">
                        ₹{app.offered_ctc_lpa || app.drive?.package_lpa || 'N/A'} LPA
                      </span>
                    </div>
                  </div>
                )}

                {/* Scheduled Interview Rounds */}
                {app.schedules && app.schedules.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Scheduled Interview Rounds ({app.schedules.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {app.schedules.map((sch) => {
                        const schDate = sch.scheduled_at ? new Date(sch.scheduled_at) : null
                        const isLink = sch.venue_or_link?.startsWith('http://') || sch.venue_or_link?.startsWith('https://')

                        return (
                          <div
                            key={sch.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              sch.is_completed
                                ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-200 dark:border-slate-800/80 opacity-75'
                                : 'bg-indigo-950/20 border-indigo-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{sch.round_name}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {sch.round_type}
                                </span>
                                {sch.is_completed ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Completed
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border border-amber-500/30 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Upcoming
                                  </span>
                                )}
                              </div>
                            </div>

                            {schDate && (
                              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono mt-2 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                {schDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                                {schDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}

                            {sch.venue_or_link && (
                              <div className="text-xs mt-1.5 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                {isLink ? (
                                  <a
                                    href={sch.venue_or_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-mono text-[11px] truncate"
                                  >
                                    <Video className="w-3 h-3 shrink-0" />
                                    Join Online Meeting Link
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                                    <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                                    Venue: {sch.venue_or_link}
                                  </span>
                                )}
                              </div>
                            )}

                            {sch.instructions && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900/60 shadow-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                                <strong className="text-slate-700 dark:text-slate-300">Instructions:</strong> {sch.instructions}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Info: Applied timestamp, location & officer notes */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-4">
                    {appliedDate && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Send className="w-3.5 h-3.5 text-slate-500" />
                        Applied on: {appliedDate.toLocaleDateString()} at{' '}
                        {appliedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {location}
                      </span>
                    )}
                  </div>

                  {app.notes && !isRejected && (
                    <div className="bg-indigo-950/30 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-[11px] text-indigo-300 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Note: {app.notes}</span>
                    </div>
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
