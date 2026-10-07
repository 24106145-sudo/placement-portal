import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Building,
  Download,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  Award,
  Calendar,
  XCircle,
  FileText,
  Clock,
  GraduationCap,
  Phone,
  Mail,
  Globe,
  Code2,
  ChevronDown
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface Company {
  id: number
  name: string
  industry?: string | null
  website?: string | null
  location?: string | null
}

interface PlacementDrive {
  id: number
  company_id: number
  job_title: string
  role_type: string
  package_lpa: number
  job_location?: string | null
  status: string
  company: Company
}

export interface OfficerApplication {
  id: number
  drive_id: number
  student_id: number
  applied_at: string
  status: 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected' | string
  notes?: string | null
  drive?: PlacementDrive | null

  // Flattened student attributes returned by backend API
  student_name?: string | null
  student_email?: string | null
  phone_number?: string | null
  city?: string | null
  college_name?: string | null
  roll_no?: string | null
  department?: string | null
  degree?: string | null
  cgpa?: number | null
  active_backlogs?: number | null
  tenth_percentage?: number | null
  twelfth_percentage?: number | null
  technical_skills?: string[]
  resume_link?: string | null
  linkedin_url?: string | null
  github_url?: string | null

  // Nested fallback support
  student?: {
    user?: {
      full_name?: string | null
      email?: string | null
    }
    phone_number?: string | null
    resume_url?: string | null
    resume_link?: string | null
    linkedin_url?: string | null
    github_url?: string | null
    academic_record?: {
      department?: string | null
      roll_no?: string | null
      cgpa?: number | null
      active_backlogs?: number | null
      tenth_percentage?: number | null
      twelfth_percentage?: number | null
    } | null
  } | null
}

interface OfficerApplicationsViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

export function OfficerApplicationsView({
  user: _user,
  token,
  onBack
}: OfficerApplicationsViewProps) {
  const [applications, setApplications] = useState<OfficerApplication[]>([])
  const [drives, setDrives] = useState<PlacementDrive[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [selectedDriveId, setSelectedDriveId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Status updating state: appId -> isUpdating
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null)
  const [customNotes, setCustomNotes] = useState<{ [appId: number]: string }>({})
  const [exportingCsv, setExportingCsv] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      // Fetch drives and applications concurrently with safe error handling
      const [drivesRes, appsRes] = await Promise.all([
        fetch('/api/v1/officer/drives', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/officer/applications', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!drivesRes.ok) {
        throw new Error(`Could not load drives (HTTP ${drivesRes.status})`)
      }
      if (!appsRes.ok) {
        throw new Error(`Could not load applications (HTTP ${appsRes.status})`)
      }

      const drivesData = await drivesRes.json()
      const appsData = await appsRes.json()

      setDrives(Array.isArray(drivesData) ? drivesData : [])
      setApplications(Array.isArray(appsData) ? appsData : [])
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching application records.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (
    applicationId: number,
    newStatus: 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected'
  ) => {
    setUpdatingAppId(applicationId)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const payload = {
        status: newStatus,
        notes: customNotes[applicationId] || undefined
      }

      const response = await fetch(`/api/v1/officer/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.detail || `Failed to update status (HTTP ${response.status})`)
      }

      const updatedApp: OfficerApplication = await response.json()

      setApplications((prev) =>
        (prev || []).map((app) => (app.id === applicationId ? { ...app, ...updatedApp } : app))
      )
      setSuccessMsg(`Updated candidate application #${applicationId} to status: ${newStatus}`)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update applicant status.')
    } finally {
      setUpdatingAppId(null)
    }
  }

  const handleExportCsv = async () => {
    setExportingCsv(true)
    setErrorMsg(null)
    try {
      const url =
        selectedDriveId !== 'all'
          ? `/api/v1/officer/applications/export?drive_id=${selectedDriveId}`
          : `/api/v1/officer/applications/export`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`CSV export failed (HTTP ${response.status})`)
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `placement_applicants_${selectedDriveId !== 'all' ? `drive_${selectedDriveId}` : 'all'}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to export CSV report.')
    } finally {
      setExportingCsv(false)
    }
  }

  // Safe Filter application items
  const safeApplications = Array.isArray(applications) ? applications : []
  const safeDrives = Array.isArray(drives) ? drives : []

  const filteredApplications = safeApplications.filter((app) => {
    if (!app) return false

    if (selectedDriveId !== 'all' && app.drive_id !== Number(selectedDriveId)) {
      return false
    }

    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const studentName = (app.student_name || app.student?.user?.full_name || '').toLowerCase()
      const email = (app.student_email || app.student?.user?.email || '').toLowerCase()
      const rollNo = (app.roll_no || app.student?.academic_record?.roll_no || '').toLowerCase()
      const branch = (app.department || app.student?.academic_record?.department || '').toLowerCase()
      const jobTitle = (app.drive?.job_title || '').toLowerCase()
      const company = (app.drive?.company?.name || '').toLowerCase()

      const matches =
        studentName.includes(q) ||
        email.includes(q) ||
        rollNo.includes(q) ||
        branch.includes(q) ||
        jobTitle.includes(q) ||
        company.includes(q)

      if (!matches) return false
    }

    return true
  })

  // Summary counts
  const totalApplicants = safeApplications.length
  const shortlistedCount = safeApplications.filter((a) => a?.status === 'Shortlisted').length
  const interviewCount = safeApplications.filter((a) => a?.status === 'Interview Scheduled').length
  const selectedCount = safeApplications.filter((a) => a?.status === 'Selected').length
  const appliedCount = safeApplications.filter((a) => a?.status === 'Applied').length

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'Selected':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border-emerald-500/40',
          icon: Award,
          text: 'Selected'
        }
      case 'Interview Scheduled':
        return {
          bg: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
          icon: Calendar,
          text: 'Interview Scheduled'
        }
      case 'Shortlisted':
        return {
          bg: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
          icon: CheckCircle2,
          text: 'Shortlisted'
        }
      case 'Rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 border-rose-500/40',
          icon: XCircle,
          text: 'Rejected'
        }
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border-amber-500/40',
          icon: Clock,
          text: 'Applied'
        }
    }
  }

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
                Review Student Applications
              </h1>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Officer Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review applicant resumes, academic metrics, advance hiring stages, and export candidate rosters.
            </p>
          </div>
        </div>

        {/* Export CSV Action */}
        <button
          onClick={handleExportCsv}
          disabled={exportingCsv || totalApplicants === 0}
          className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
        >
          {exportingCsv ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{exportingCsv ? 'Exporting...' : 'Export Applicants (CSV)'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Applicants</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalApplicants}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-amber-400 font-medium">Applied</span>
          <p className="text-xl font-bold text-amber-300 font-mono">{appliedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-blue-400 font-medium">Shortlisted</span>
          <p className="text-xl font-bold text-blue-300 font-mono">{shortlistedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-purple-400 font-medium">Interviewing</span>
          <p className="text-xl font-bold text-purple-300 font-mono">{interviewCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900/80 shadow-xs border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-emerald-400 font-medium">Selected / Offers</span>
          <p className="text-xl font-bold text-emerald-300 font-mono">{selectedCount}</p>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="bg-white dark:bg-slate-900/70 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Drive Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Filter by Recruitment Drive
            </label>
            <div className="relative">
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white appearance-none focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 pr-8 transition-all"
              >
                <option value="all">All Placement Drives ({safeDrives.length})</option>
                {safeDrives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.company?.name || 'Company'} - {d.job_title} (₹{d.package_lpa} LPA)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Search Applicants
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate name, email, roll no, branch, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'Applied', label: 'Applied' },
            { id: 'Shortlisted', label: 'Shortlisted' },
            { id: 'Interview Scheduled', label: 'Interview Scheduled' },
            { id: 'Selected', label: 'Selected' },
            { id: 'Rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications / Feedback */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Applicant Cards List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading candidate applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Candidate Applications Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || selectedDriveId !== 'all'
              ? 'No applicants match your active search and filter criteria.'
              : 'Students have not submitted applications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApplications.map((app) => {
            if (!app) return null

            const badge = getStatusBadge(app.status)
            const BadgeIcon = badge.icon
            const isUpdating = updatingAppId === app.id

            // Safe fallback derivations
            const studentName = app.student_name || app.student?.user?.full_name || 'Candidate'
            const studentEmail = app.student_email || app.student?.user?.email || 'No email provided'
            const phoneNumber = app.phone_number || app.student?.phone_number || null
            const rollNo = app.roll_no || app.student?.academic_record?.roll_no || null
            const department = app.department || app.student?.academic_record?.department || 'Department N/A'
            const degree = app.degree || null
            const cgpa = app.cgpa ?? app.student?.academic_record?.cgpa ?? null
            const activeBacklogs = app.active_backlogs ?? app.student?.academic_record?.active_backlogs ?? 0
            const tenthPct = app.tenth_percentage ?? app.student?.academic_record?.tenth_percentage ?? null
            const twelfthPct = app.twelfth_percentage ?? app.student?.academic_record?.twelfth_percentage ?? null
            const resumeLink = app.resume_link || app.student?.resume_link || app.student?.resume_url || null
            const linkedinUrl = app.linkedin_url || app.student?.linkedin_url || null
            const githubUrl = app.github_url || app.student?.github_url || null
            const companyName = app.drive?.company?.name || 'Recruiting Company'
            const jobTitle = app.drive?.job_title || 'Placement Drive Role'
            const packageLpa = app.drive?.package_lpa ?? 0

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900/85 shadow-xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 rounded-3xl p-6 space-y-5 transition-all shadow-xl"
              >
                {/* Candidate & Drive Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-2xl border border-indigo-500/30">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {studentName}
                        </h3>
                        {rollNo && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            Roll: {rollNo}
                          </span>
                        )}
                        {degree && (
                          <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                            {degree}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {studentEmail}
                        </span>
                        {phoneNumber && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drive details applied for */}
                  <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-1.5 md:justify-end text-xs font-bold text-indigo-400">
                        <Building className="w-3.5 h-3.5" />
                        <span>{companyName}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{jobTitle}</p>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ₹{packageLpa} LPA
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.text}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Metrics & Links Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Branch</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {department}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Applied Date</span>
                    <span className="text-xs font-mono text-slate-800 dark:text-slate-200">
                      {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">CGPA</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {cgpa !== null ? `${cgpa} / 10.0` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Backlogs</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        activeBacklogs === 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeBacklogs}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">10th / 12th %</span>
                    <span className="text-xs font-mono text-slate-800 dark:text-slate-200">
                      {tenthPct !== null ? `${tenthPct}%` : '-'} / {twelfthPct !== null ? `${twelfthPct}%` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Resume & Links</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {resumeLink ? (
                        <a
                          href={resumeLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                          title="Open Candidate Resume"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">No Resume</span>
                      )}
                      {linkedinUrl && (
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 dark:text-slate-400 hover:text-blue-400"
                          title="LinkedIn Profile"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {githubUrl && (
                        <a
                          href={githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                          title="GitHub Profile"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Update Actions & Officer Notes */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Notes Field */}
                  <div className="w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Add reviewer notes (optional)..."
                      defaultValue={app.notes || ''}
                      onChange={(e) =>
                        setCustomNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                    />
                  </div>

                  {/* Stage Transition Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'Shortlisted'}
                      onClick={() => handleUpdateStatus(app.id, 'Shortlisted')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-slate-900 dark:text-white border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isUpdating && app.status !== 'Shortlisted' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                      ) : null}
                      Shortlist
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'Interview Scheduled'}
                      onClick={() => handleUpdateStatus(app.id, 'Interview Scheduled')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-slate-900 dark:text-white border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isUpdating && app.status !== 'Interview Scheduled' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                      ) : null}
                      Interview
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'Selected'}
                      onClick={() => handleUpdateStatus(app.id, 'Selected')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-slate-900 dark:text-white border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isUpdating && app.status !== 'Selected' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                      ) : null}
                      Select Offer
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating || app.status === 'Rejected'}
                      onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-slate-900 dark:text-white border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isUpdating && app.status !== 'Rejected' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                      ) : null}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
