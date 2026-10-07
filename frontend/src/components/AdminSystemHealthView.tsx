import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Server,
  Database,
  Activity,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Clock,
  ShieldCheck,
  Layers
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface SystemActivityLog {
  id: string
  timestamp: string
  action_type: string
  description: string
  actor: string
  severity: 'info' | 'success' | 'warning' | string
}

interface SystemHealthData {
  status: string
  database_engine: string
  database_name: string
  host: string
  port: number
  connected: boolean
  table_counts: { [tableName: string]: number }
  recent_activities: SystemActivityLog[]
}

interface AdminSystemHealthViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

export function AdminSystemHealthView({ user: _user, token, onBack }: AdminSystemHealthViewProps) {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchHealthData()
  }, [])

  const fetchHealthData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/v1/admin/system-health', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Health check failed (HTTP ${response.status})`)
      }

      const data: SystemHealthData = await response.json()
      setHealthData(data)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not fetch database health metrics.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border-emerald-500/30'
      case 'warning':
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border-amber-500/30'
      default:
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 border-indigo-500/30'
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
                System Health & Audit Logs
              </h1>
              <span className="text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Diagnostics
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect MySQL database connectivity, monitor active table row counters, and review recent audit activity logs.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealthData}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ping System</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading || !healthData ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Inspecting database connections and table metrics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Infrastructure Health Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Database Card */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Database className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                  Connected
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">MySQL Database</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Schema: <strong className="text-emerald-300">{healthData.database_name}</strong>
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono">
                <p>Host: {healthData.host}:{healthData.port}</p>
                <p>Driver: PyMySQL + SQLAlchemy</p>
              </div>
            </div>

            {/* FastAPI Server Card */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <Server className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full font-bold">
                  Port 8000
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">FastAPI Backend</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">REST API Services Online</p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono">
                <p>Auth: PyJWT (HS256 24h)</p>
                <p>Status: {healthData.status}</p>
              </div>
            </div>

            {/* Security & Access Guard Card */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400 rounded-2xl border border-amber-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
                  Protected
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Access Control</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Role-Based Endpoint Security</p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono">
                <p>Roles: Student / Officer / Admin</p>
                <p>Encryption: Bcrypt Passwords</p>
              </div>
            </div>
          </div>

          {/* Table Counters Grid */}
          <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Database Table Row Counters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live record quantities tracked across primary entities in MySQL Workbench.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(healthData.table_counts).map(([tableName, count]) => (
                <div
                  key={tableName}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1"
                >
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate capitalize">
                    {tableName.replace('_', ' ')}
                  </span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent System Activity / Audit Trail */}
          <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Recent System Activity Logs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chronological event stream of registrations, drive postings, application submissions, and scheduled rounds.
                </p>
              </div>
            </div>

            {healthData.recent_activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activities recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {healthData.recent_activities.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:border-slate-300 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/15 dark:text-indigo-400 rounded-xl mt-0.5 shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${getSeverityBadge(item.severity)}`}>
                            {item.action_type}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">by {item.actor}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{item.description}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap self-start sm:self-center flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
