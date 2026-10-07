import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  TrendingUp,
  Award,
  Building,
  GraduationCap,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface BranchMetric {
  department: string
  total_students: number
  placed_students: number
  placement_rate_pct: number
  avg_ctc_lpa: number
  highest_ctc_lpa: number
}

interface TopRecruiterMetric {
  company_name: string
  total_drives: number
  total_selections: number
  highest_package_lpa: number
  avg_package_lpa: number
}

interface AnalyticsData {
  total_registered_students: number
  total_placement_officers: number
  total_companies_registered: number
  total_drives_posted: number
  total_applications_submitted: number
  total_students_placed: number
  overall_placement_rate_pct: number
  average_ctc_lpa: number
  highest_ctc_lpa: number
  branch_breakdown: BranchMetric[]
  top_recruiters: TopRecruiterMetric[]
}

interface AdminAnalyticsViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

export function AdminAnalyticsView({ user: _user, token, onBack }: AdminAnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/v1/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Failed to load analytics (HTTP ${response.status})`)
      }

      const resData: AnalyticsData = await response.json()
      setData(resData)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching placement analytics.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Institutional Placement Analytics
              </h1>
              <span className="text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Executive Overview
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive institutional recruitment performance, branch-wise placement statistics, and recruiter rankings.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading || !data ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Computing macro institutional metrics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Macro Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Placement Rate Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300">Overall Placement %</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {data.overall_placement_rate_pct}%
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <strong className="text-indigo-300 font-mono">{data.total_students_placed}</strong> of {data.total_registered_students} students placed
                </p>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.overall_placement_rate_pct, 100)}%` }}
                />
              </div>
            </div>

            {/* Average CTC Card */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">Average Offered CTC</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 rounded-xl">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  ₹{data.average_ctc_lpa} <span className="text-base font-normal">LPA</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all confirmed student offers</p>
              </div>
            </div>

            {/* Highest CTC Card */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">Highest Package</span>
                <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-amber-300 font-mono">
                  ₹{data.highest_ctc_lpa} <span className="text-base font-normal">LPA</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Top visiting company offer</p>
              </div>
            </div>

            {/* Total Companies & Drives */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400">Recruitment Activity</span>
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {data.total_drives_posted}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Drives across <strong className="text-blue-300">{data.total_companies_registered}</strong> registered companies
                </p>
              </div>
            </div>
          </div>

          {/* Department / Branch-wise Placement Breakdown */}
          <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  Department-Wise Placement Performance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed distribution of student count, placed statistics, and salary metrics per branch.
                </p>
              </div>
            </div>

            {data.branch_breakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No branch academic data recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Academic Branch</th>
                      <th className="py-3 px-4">Total Students</th>
                      <th className="py-3 px-4">Placed Count</th>
                      <th className="py-3 px-4">Placement Rate</th>
                      <th className="py-3 px-4">Avg CTC</th>
                      <th className="py-3 px-4 text-right">Highest CTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {data.branch_breakdown.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{b.department}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">{b.total_students}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{b.placed_students}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-300 w-12">{b.placement_rate_pct}%</span>
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${Math.min(b.placement_rate_pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-200">
                          {b.avg_ctc_lpa > 0 ? `₹${b.avg_ctc_lpa} LPA` : '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-right">
                          {b.highest_ctc_lpa > 0 ? `₹${b.highest_ctc_lpa} LPA` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Recruiting Companies Leaderboard */}
          <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-400" />
                  Top Recruiting Partners & Recruiters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Organizations offering campus placement opportunities and candidate selections.
                </p>
              </div>
            </div>

            {data.top_recruiters.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recruiting companies registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.top_recruiters.map((recruiter, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:border-slate-700 rounded-2xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-indigo-400" />
                        {recruiter.company_name}
                      </span>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                        #{idx + 1} Recruiter
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Total Drives</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{recruiter.total_drives} Posted</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Selections</span>
                        <span className="font-bold text-emerald-400">{recruiter.total_selections} Placed</span>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Highest Package</span>
                        <span className="font-bold text-emerald-300">
                          {recruiter.highest_package_lpa > 0 ? `₹${recruiter.highest_package_lpa} LPA` : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
