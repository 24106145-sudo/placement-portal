import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Link,
  PlusCircle,
  Award,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building,
  GraduationCap,
  Users,
  Search,
  ExternalLink,
  Trash2,
  FileCheck
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface Company {
  id: number
  name: string
}

interface PlacementDrive {
  id: number
  job_title: string
  package_lpa: number
  role_type: string
  company: Company
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
  created_at: string
}

interface OfficerApplication {
  id: number
  drive_id: number
  student_id: number
  status: string
  notes?: string | null
  offered_ctc_lpa?: number | null
  student_name?: string | null
  student_email?: string | null
  roll_no?: string | null
  department?: string | null
  cgpa?: number | null
  drive?: PlacementDrive | null
}

interface OfficerSchedulesViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

export function OfficerSchedulesView({
  user: _user,
  token,
  onBack
}: OfficerSchedulesViewProps) {
  const [activeTab, setActiveTab] = useState<'schedules' | 'offers'>('schedules')
  const [drives, setDrives] = useState<PlacementDrive[]>([])
  const [schedules, setSchedules] = useState<DriveSchedule[]>([])
  const [applications, setApplications] = useState<OfficerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [selectedDriveFilter, setSelectedDriveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Schedule Creation Form State
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)
  const [formDriveId, setFormDriveId] = useState<string>('')
  const [formRoundName, setFormRoundName] = useState('Technical Interview Round 1')
  const [formRoundType, setFormRoundType] = useState('Technical')
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [formVenueOrLink, setFormVenueOrLink] = useState('')
  const [formInstructions, setFormInstructions] = useState('')
  const [submittingSchedule, setSubmittingSchedule] = useState(false)

  // Offer Awarding State
  const [awardingAppId, setAwardingAppId] = useState<number | null>(null)
  const [offerCtcInputs, setOfferCtcInputs] = useState<{ [appId: number]: string }>({})
  const [offerNotesInputs, setOfferNotesInputs] = useState<{ [appId: number]: string }>({})
  const [submittingOfferId, setSubmittingOfferId] = useState<number | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [drivesRes, schedRes, appsRes] = await Promise.all([
        fetch('/api/v1/officer/drives', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/officer/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/officer/applications', { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (!drivesRes.ok) throw new Error(`Could not load drives (HTTP ${drivesRes.status})`)
      if (!schedRes.ok) throw new Error(`Could not load schedules (HTTP ${schedRes.status})`)
      if (!appsRes.ok) throw new Error(`Could not load applications (HTTP ${appsRes.status})`)

      const drivesData = await drivesRes.json()
      const schedData = await schedRes.json()
      const appsData = await appsRes.json()

      const safeDrives = Array.isArray(drivesData) ? drivesData : []
      const safeSchedules = Array.isArray(schedData) ? schedData : []
      const safeApps = Array.isArray(appsData) ? appsData : []

      setDrives(safeDrives)
      setSchedules(safeSchedules)
      setApplications(safeApps)

      if (safeDrives.length > 0 && !formDriveId) {
        setFormDriveId(String(safeDrives[0].id))
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching schedules and applications data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDriveId || !formRoundName || !formScheduledAt) {
      setErrorMsg('Please select a drive, round name, and scheduled date/time.')
      return
    }

    setSubmittingSchedule(true)
    setErrorMsg(null)
    try {
      const payload = {
        round_name: formRoundName,
        round_type: formRoundType,
        scheduled_at: new Date(formScheduledAt).toISOString(),
        venue_or_link: formVenueOrLink.trim() || undefined,
        instructions: formInstructions.trim() || undefined,
        is_completed: false
      }

      const response = await fetch(`/api/v1/officer/drives/${formDriveId}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.detail || `Failed to schedule round (HTTP ${response.status})`)
      }

      const newSched: DriveSchedule = await response.json()
      setSchedules((prev) => [newSched, ...prev])
      setIsCreatingSchedule(false)
      setSuccessMsg(`Successfully scheduled '${newSched.round_name}'!`)
      setTimeout(() => setSuccessMsg(null), 4000)

      // Reset form
      setFormVenueOrLink('')
      setFormInstructions('')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create drive schedule.')
    } finally {
      setSubmittingSchedule(false)
    }
  }

  const handleToggleCompleteSchedule = async (scheduleId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/v1/officer/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update schedule status')
      const updated: DriveSchedule = await response.json()

      setSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? { ...s, is_completed: updated.is_completed } : s))
      )
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update round status.')
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!window.confirm('Are you sure you want to delete this scheduled round?')) return

    try {
      const response = await fetch(`/api/v1/officer/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete schedule')
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
      setSuccessMsg('Scheduled round removed.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not delete schedule.')
    }
  }

  const handleAwardOffer = async (applicationId: number, defaultPackage: number) => {
    const enteredCtc = offerCtcInputs[applicationId]
      ? parseFloat(offerCtcInputs[applicationId])
      : defaultPackage
    const notes = offerNotesInputs[applicationId] || 'Confirmed placement offer awarded.'

    if (!enteredCtc || enteredCtc <= 0) {
      setErrorMsg('Please enter a valid CTC package in LPA.')
      return
    }

    setSubmittingOfferId(applicationId)
    setErrorMsg(null)
    try {
      const response = await fetch(`/api/v1/officer/applications/${applicationId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          offered_ctc_lpa: enteredCtc,
          notes: notes
        })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.detail || 'Failed to record offer.')
      }

      const updatedApp = await response.json()
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, ...updatedApp } : app))
      )
      setAwardingAppId(null)
      setSuccessMsg(`Offer recorded successfully! Candidate status set to 'Selected' with ₹${enteredCtc} LPA.`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not award job offer.')
    } finally {
      setSubmittingOfferId(null)
    }
  }

  // Filtered schedules
  const safeSchedules = Array.isArray(schedules) ? schedules : []
  const safeApplications = Array.isArray(applications) ? applications : []
  const safeDrives = Array.isArray(drives) ? drives : []

  const filteredSchedules = safeSchedules.filter((s) => {
    if (selectedDriveFilter !== 'all' && s.drive_id !== Number(selectedDriveFilter)) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const d = safeDrives.find((drv) => drv.id === s.drive_id)
      const matches =
        s.round_name.toLowerCase().includes(q) ||
        (s.venue_or_link && s.venue_or_link.toLowerCase().includes(q)) ||
        (d && (d.company.name.toLowerCase().includes(q) || d.job_title.toLowerCase().includes(q)))
      if (!matches) return false
    }
    return true
  })

  const filteredApplications = safeApplications.filter((app) => {
    if (selectedDriveFilter !== 'all' && app.drive_id !== Number(selectedDriveFilter)) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const name = (app.student_name || '').toLowerCase()
      const email = (app.student_email || '').toLowerCase()
      const roll = (app.roll_no || '').toLowerCase()
      const company = (app.drive?.company?.name || '').toLowerCase()
      const matches = name.includes(q) || email.includes(q) || roll.includes(q) || company.includes(q)
      if (!matches) return false
    }
    return true
  })

  // Summary counts
  const totalRounds = safeSchedules.length
  const completedRounds = safeSchedules.filter((s) => s.is_completed).length
  const totalOffersAwarded = safeApplications.filter((a) => a.status === 'Selected').length

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
                Drive Schedules & Recruitment Results
              </h1>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Officer Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Schedule aptitude tests & technical interview rounds, broadcast meeting links, and award final placement offers.
            </p>
          </div>
        </div>

        {/* Create Schedule Button */}
        <button
          onClick={() => setIsCreatingSchedule(!isCreatingSchedule)}
          className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreatingSchedule ? 'Cancel Scheduling' : 'Schedule Interview Round'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Scheduled Rounds</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalRounds}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Rounds Completed</p>
            <p className="text-xl font-bold text-blue-300 font-mono">{completedRounds}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-emerald-400">Confirmed Selections / Offers</p>
            <p className="text-xl font-bold text-emerald-300 font-mono">{totalOffersAwarded}</p>
          </div>
        </div>
      </div>

      {/* Schedule Creation Card (Collapsible) */}
      {isCreatingSchedule && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Recruitment Round Schedule</h3>
            </div>
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 px-2.5 py-1 rounded-full">
              Real-time Student Sync
            </span>
          </div>

          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drive Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Visiting Campus Drive *
                </label>
                <select
                  value={formDriveId}
                  onChange={(e) => setFormDriveId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  {safeDrives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.company.name} - {d.job_title} (₹{d.package_lpa} LPA)
                    </option>
                  ))}
                </select>
              </div>

              {/* Round Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Round Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Technical Interview Round 1"
                  value={formRoundName}
                  onChange={(e) => setFormRoundName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Round Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Round Type
                </label>
                <select
                  value={formRoundType}
                  onChange={(e) => setFormRoundType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Aptitude">Online Aptitude / Coding Test</option>
                  <option value="Technical">Technical Interview</option>
                  <option value="Managerial">Managerial Round</option>
                  <option value="HR">HR Interview</option>
                  <option value="Final Selection">Final Selection & Document Verification</option>
                </select>
              </div>

              {/* Scheduled Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Venue or Meeting Link */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Venue or Online Meeting Link (Google Meet / Zoom / Lab Venue)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet: https://meet.google.com/abc-defg-hij or Auditorium 3"
                  value={formVenueOrLink}
                  onChange={(e) => setFormVenueOrLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Candidate Instructions */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Instructions for Candidates
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please join 5 minutes early with your student ID, resume copy, and portfolio link ready."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingSchedule(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingSchedule}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
              >
                {submittingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>Publish Schedule</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-xs text-emerald-200 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-xs text-rose-200 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab Switcher & Drive Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'schedules'
                ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Interview Schedules ({safeSchedules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'offers'
                ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Final Offers & Results ({totalOffersAwarded})</span>
          </button>
        </div>

        {/* Search & Drive Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDriveFilter}
            onChange={(e) => setSelectedDriveFilter(e.target.value)}
            className="bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Drives ({safeDrives.length})</option>
            {safeDrives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.company.name} - {d.job_title}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading schedules and candidate results...</p>
        </div>
      ) : activeTab === 'schedules' ? (
        /* ================= SCHEDULES TIMELINE ================= */
        filteredSchedules.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Scheduled Rounds Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Schedule your first assessment test or interview round using the "Schedule Interview Round" button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSchedules.map((sched) => {
              const drive = safeDrives.find((d) => d.id === sched.drive_id)
              const schedDate = new Date(sched.scheduled_at)
              const isUrl = sched.venue_or_link && (sched.venue_or_link.startsWith('http') || sched.venue_or_link.includes('://'))

              return (
                <div
                  key={sched.id}
                  className={`bg-white dark:bg-slate-900/85 shadow-xs border rounded-3xl p-6 space-y-5 transition-all shadow-xl flex flex-col justify-between ${
                    sched.is_completed
                      ? 'border-slate-200 dark:border-slate-800 opacity-80'
                      : 'border-indigo-500/40 hover:border-indigo-500 shadow-indigo-500/5'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Row: Company, Drive Role & Completed Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          {drive?.company.name || 'Company'}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                          {sched.round_name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Role: <strong className="text-slate-800 dark:text-slate-200">{drive?.job_title || 'Recruitment Drive'}</strong> (₹{drive?.package_lpa} LPA)
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                          sched.is_completed
                            ? 'bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/30'
                        }`}
                      >
                        {sched.is_completed ? 'Completed ✓' : 'Upcoming 🚀'}
                      </span>
                    </div>

                    {/* Date & Time Strip */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-300 font-mono font-semibold">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {schedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at{' '}
                          {schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {sched.venue_or_link && (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                          {isUrl ? (
                            <Link className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          {isUrl ? (
                            <a
                              href={sched.venue_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 underline font-medium truncate flex items-center gap-1"
                            >
                              <span>{sched.venue_or_link}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="truncate">{sched.venue_or_link}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    {sched.instructions && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/40 leading-relaxed">
                        <strong className="text-slate-700 dark:text-slate-300">Instructions:</strong> {sched.instructions}
                      </p>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleteSchedule(sched.id, sched.is_completed)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        sched.is_completed
                          ? 'bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700'
                          : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-slate-900 dark:text-white border border-emerald-500/30'
                      }`}
                    >
                      {sched.is_completed ? 'Reopen Round' : 'Mark Completed ✓'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(sched.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* ================= FINAL OFFERS & SELECTIONS BOARD ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 shadow-xs p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Final Selections & Job Offer Management</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Award confirmed job offers and record verified Offered CTC packages.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-full">
              {totalOffersAwarded} Total Placed
            </span>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Applicants Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No student applicants match the selected drive or search filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const isSelected = app.status === 'Selected'
                const isAwarding = awardingAppId === app.id
                const isSubmitting = submittingOfferId === app.id
                const defaultDrivePackage = app.drive?.package_lpa ?? 0

                return (
                  <div
                    key={app.id}
                    className={`bg-white dark:bg-slate-900/80 shadow-xs border rounded-2xl p-5 space-y-4 transition-all shadow-md ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Candidate & Drive Details */}
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl border ${isSelected ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 border-emerald-500/30' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 border-indigo-500/30'}`}>
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{app.student_name || 'Candidate'}</h4>
                            {app.roll_no && (
                              <span className="text-[10px] font-mono bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                {app.roll_no}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {app.department || 'Engineering'} • CGPA: <strong className="text-slate-900 dark:text-white font-mono">{app.cgpa ?? 'N/A'}</strong> • Drive: <strong className="text-indigo-300">{app.drive?.company?.name || 'Company'}</strong> ({app.drive?.job_title})
                          </p>
                        </div>
                      </div>

                      {/* Offered Package / Action */}
                      <div className="flex items-center gap-3 self-start md:self-auto">
                        {isSelected ? (
                          <div className="text-right bg-emerald-950/50 border border-emerald-500/40 px-4 py-2 rounded-xl">
                            <span className="text-[10px] text-emerald-400 block font-semibold uppercase tracking-wider">
                              Confirmed Offer
                            </span>
                            <span className="text-base font-bold text-emerald-300 font-mono">
                              ₹{app.offered_ctc_lpa || defaultDrivePackage} LPA
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAwardingAppId(isAwarding ? null : app.id)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5 inline mr-1" />
                            {isAwarding ? 'Cancel' : 'Award Job Offer'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Offer Input Form (when awarding) */}
                    {isAwarding && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3 animate-fade-in">
                        <div className="w-full md:w-48">
                          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Offered CTC (LPA) *</label>
                          <input
                            type="number"
                            step="0.1"
                            defaultValue={defaultDrivePackage}
                            placeholder="e.g. 14.5"
                            onChange={(e) =>
                              setOfferCtcInputs((prev) => ({ ...prev, [app.id]: e.target.value }))
                            }
                            className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Offer Reference / Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Offer letter released. Joining Date: July 2027."
                            onChange={(e) =>
                              setOfferNotesInputs((prev) => ({ ...prev, [app.id]: e.target.value }))
                            }
                            className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleAwardOffer(app.id, defaultDrivePackage)}
                          className="self-end md:self-auto px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5 inline mr-1" />}
                          Confirm & Award Offer
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
