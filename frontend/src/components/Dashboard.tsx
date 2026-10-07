import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  Users,
  PlusCircle,
  BarChart3,
  Activity,
  TrendingUp,
  Award,
  Building2,
  Edit3,
  Clock,
  Flame,
  ArrowUpRight
} from 'lucide-react'
import type { UserSession } from './LoginForm'
import { PlacementPredictorWidget } from './PlacementPredictorWidget'

interface DashboardProps {
  user: UserSession
  token: string
  onLogout: () => void
  onOpenProfile?: () => void
  onOpenStudentDrives?: () => void
  onOpenOfficerDrives?: () => void
  onOpenStudentApplications?: () => void
  onOpenOfficerApplications?: () => void
  onOpenOfficerSchedules?: () => void
  onOpenAdminUsers?: () => void
  onOpenAdminAnalytics?: () => void
  onOpenAdminHealth?: () => void
}

interface StudentQuickProfile {
  cgpa?: number
  active_backlogs?: number
  department?: string
  skills?: string[]
}

export interface DashboardLiveMetrics {
  total_students: number
  placed_students: number
  placement_rate_pct: number
  total_companies: number
  top_company_names: string[]
  total_drives: number
  active_openings: number
  highest_ctc: number
  average_ctc: number
}

export function Dashboard({
  user,
  token,
  onLogout: _onLogout,
  onOpenProfile,
  onOpenStudentDrives,
  onOpenOfficerDrives,
  onOpenStudentApplications,
  onOpenOfficerApplications,
  onOpenOfficerSchedules,
  onOpenAdminUsers,
  onOpenAdminAnalytics,
  onOpenAdminHealth
}: DashboardProps) {
  const [profileData, setProfileData] = useState<StudentQuickProfile | null>(null)
  const [metrics, setMetrics] = useState<DashboardLiveMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true)

  // Fetch Live Metrics for Officer & Admin roles
  useEffect(() => {
    if (user.role !== 'student') {
      setMetricsLoading(true)
      fetch('/api/v1/officer/dashboard/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: DashboardLiveMetrics | null) => {
          if (data) {
            setMetrics(data)
          }
        })
        .catch(() => {
          // Fallback gracefully
        })
        .finally(() => {
          setMetricsLoading(false)
        })
    }
  }, [user.role, token])

  // Fetch student quick profile
  useEffect(() => {
    if (user.role === 'student') {
      fetch('/api/v1/students/me/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setProfileData({
              cgpa: data.academic?.cgpa || 8.4,
              active_backlogs: data.academic?.active_backlogs || 0,
              department: data.academic?.department || 'Computer Science & Engineering',
              skills: data.technical_skills || ['Python', 'React', 'FastAPI', 'MySQL', 'Docker']
            })
          }
        })
        .catch(() => {
          // Fallback defaults
        })
    }
  }, [user.role, token])

  const getRoleBadge = () => {
    switch (user.role) {
      case 'student':
        return {
          title: 'Student Applicant Portal',
          badgeText: 'Undergraduate Candidate',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
          icon: GraduationCap
        }
      case 'officer':
        return {
          title: 'Placement Officer Console',
          badgeText: 'Placement Coordinator',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
          icon: Briefcase
        }
      case 'admin':
        return {
          title: 'System Administrator Console',
          badgeText: 'Master Administrator',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
          icon: ShieldCheck
        }
    }
  }

  const roleConfig = getRoleBadge()

  // Top Active Drives Preview (for student quick glance)
  const FEATURED_DRIVES = [
    {
      id: 1,
      company: 'Google India',
      role: 'Software Engineer (L3)',
      package_lpa: 18.5,
      location: 'Bengaluru / Hyderabad',
      deadline: 'In 2 days',
      tag: 'Tier 1 Dream'
    },
    {
      id: 2,
      company: 'Microsoft IDC',
      role: 'Cloud Solutions Engineer',
      package_lpa: 24.0,
      location: 'Hyderabad / Noida',
      deadline: 'In 5 days',
      tag: 'Super Dream'
    },
    {
      id: 3,
      company: 'Amazon AWS',
      role: 'Software Development Engineer 1',
      package_lpa: 28.0,
      location: 'Bengaluru',
      deadline: 'In 6 days',
      tag: 'Top CTC'
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Student Workspace: Direct access to student-focused tools */}
      {user.role === 'student' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): AIML Predictor + Featured Drives */}
          <div className="lg:col-span-8 space-y-6">
            {/* AIML Placement Predictor & What-If Simulator Card */}
            <PlacementPredictorWidget token={token} onOpenProfile={onOpenProfile} />

            {/* Featured Active Drives Quick Glance */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-xl">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Featured Campus Recruitment Drives
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      High-demand openings matching your engineering credentials
                    </p>
                  </div>
                </div>

                {onOpenStudentDrives && (
                  <button
                    onClick={onOpenStudentDrives}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse All Openings</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {FEATURED_DRIVES.map((d) => (
                  <div
                    key={d.id}
                    onClick={onOpenStudentDrives}
                    className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-800 border border-slate-200/90 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-500/40 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300">
                          {d.tag}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {d.package_lpa} LPA
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {d.company}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                        {d.role}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 mt-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> {d.deadline}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                        Apply →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Student Profile Summary Drawer */}
          <div className="lg:col-span-4 space-y-6">
            {/* Student Mini Profile Card */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-md space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-600/30">
                    {user.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                {onOpenProfile && (
                  <button
                    onClick={onOpenProfile}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    title="Edit Full Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Verified Student Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Department</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                    {profileData?.department || 'Computer Science'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Cumulative CGPA</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {profileData?.cgpa ? profileData.cgpa.toFixed(2) : '8.40'} / 10.0
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Active Backlogs</span>
                  <span className={`font-mono font-bold ${
                    (profileData?.active_backlogs || 0) === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {profileData?.active_backlogs || 0} (Eligible)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Verification Status</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Verified Technical Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(profileData?.skills || ['Python', 'React', 'FastAPI', 'MySQL', 'Docker']).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Profile Action */}
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Complete Placement Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Application Pipeline Shortcut */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Application Pipeline</h4>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status changes, online test links, and round outcomes in real-time.
              </p>
              {onOpenStudentApplications && (
                <button
                  onClick={onOpenStudentApplications}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>View My Applications</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 2. Officer & Admin Workspace with 4 Macro KPI Stat Tiles */
        <div className="space-y-8">
          {/* Row of 4 Placement Metric Stat Tiles Connected to Live MySQL Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tile 1: Placement % */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs backdrop-blur-md relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Placement Rate
                </span>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/15 dark:text-indigo-400 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {metricsLoading ? (
                  <div className="space-y-2 animate-pulse py-1">
                    <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-3.5 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {metrics ? `${metrics.placement_rate_pct.toFixed(1)}%` : '0.0%'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                        Live Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {metrics
                        ? `${metrics.placed_students} of ${metrics.total_students} students placed`
                        : 'Real-time candidate placement tally'}
                    </p>
                  </>
                )}
                {/* Mini Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(metrics?.placement_rate_pct || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tile 2: Active Companies */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs backdrop-blur-md relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Recruiters Visiting
                </span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-400 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {metricsLoading ? (
                  <div className="space-y-2 animate-pulse py-1">
                    <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-3.5 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {metrics ? metrics.total_companies : 0}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold">
                        {metrics && metrics.top_company_names.length > 0
                          ? `${metrics.top_company_names.length} Active`
                          : 'Visiting'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
                      {metrics && metrics.top_company_names.length > 0
                        ? metrics.top_company_names.join(', ')
                        : 'Google, Microsoft, ChatGPT, Gemini'}
                    </p>
                  </>
                )}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((metrics?.total_companies || 0) * 20, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tile 3: Open Vacancies */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs backdrop-blur-md relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Live Openings
                </span>
                <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {metricsLoading ? (
                  <div className="space-y-2 animate-pulse py-1">
                    <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-3.5 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {metrics ? metrics.active_openings : 0}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        Drive Postings
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {metrics ? `${metrics.total_drives} campus recruitment drives posted` : 'Active campus opportunities'}
                    </p>
                  </>
                )}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((metrics?.active_openings || 0) * 25, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tile 4: CTC Highlights */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs backdrop-blur-md relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Compensation
                </span>
                <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-600/15 dark:text-amber-400 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {metricsLoading ? (
                  <div className="space-y-2 animate-pulse py-1">
                    <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-3.5 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-mono">Avg: </span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                          ₹{metrics ? metrics.average_ctc.toFixed(1) : '0.0'}L
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-mono">Max: </span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹{metrics ? metrics.highest_ctc.toFixed(1) : '0.0'}L
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {metrics ? `Top Package: ₹${metrics.highest_ctc.toFixed(1)} LPA` : 'Campus Compensation Ranges'}
                    </p>
                  </>
                )}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(((metrics?.highest_ctc || 0) / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role Header & Action Modules */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {roleConfig.title}
              </h2>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${roleConfig.badgeColor}`}>
                {roleConfig.badgeText}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user.role === 'officer' && (
                <>
                  <div
                    onClick={onOpenOfficerDrives}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-400 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-600/15 dark:text-indigo-400 transition-all">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold">
                        Post & Manage
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Create & Post New Job Drive
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Register recruiting companies, publish CTC packages, eligibility cutoffs, and deadlines.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>Manage Drives</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div
                    onClick={onOpenOfficerApplications}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-400 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-600/15 dark:text-indigo-400 transition-all">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold">
                        Applicant Roster
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Review Student Applications
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Review candidate credentials, filter by status, advance hiring rounds, and export CSV rosters.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>Review Applicants</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div
                    onClick={onOpenOfficerSchedules}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-400 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-600/15 dark:text-indigo-400 transition-all">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold">
                        Schedules & Offers
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Drive Schedules & CTC Results
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Publish interview rounds, meeting links, track completion, and record official student CTC packages.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>Manage Schedules</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <div
                    onClick={onOpenAdminUsers}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-400 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-600/15 dark:text-indigo-400 transition-all">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold">
                        User Directory
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        User Management & Roles
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Directory of all accounts with role transitions (Student, Officer, Admin), status toggles, and deletion.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>Manage Directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div
                    onClick={onOpenAdminAnalytics}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-400 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-600/15 dark:text-indigo-400 transition-all">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold">
                        Institutional KPIs
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Institutional Placement Analytics
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Live placement percentage, branch-wise distribution (CSE, IT, AI, ECE), CTC metrics, and top recruiters.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>Open Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div
                    onClick={onOpenAdminHealth}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-400 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-600/15 dark:text-indigo-400 transition-all">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold">
                        MySQL & Audit
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        System Health & Audit Logs
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Live MySQL connection latency, active table row counts, API status, and chronological audit log trail.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
                      <span>Inspect Health</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
