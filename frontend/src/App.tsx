import { useState, useEffect, useRef } from 'react'
import {
  GraduationCap,
  Server,
  Layout,
  CheckCircle,
  Database,
  ArrowRight,
  Activity,
  AlertTriangle,
  UserPlus,
  LogIn,
  Cpu,
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  BarChart3,
  Sun,
  Moon,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  HelpCircle,
  X,
  FileCheck,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { RegisterForm } from './components/RegisterForm'
import { LoginForm } from './components/LoginForm'
import type { UserSession } from './components/LoginForm'
import { Dashboard } from './components/Dashboard'
import { StudentProfileView } from './components/StudentProfileView'
import { StudentDrivesView } from './components/StudentDrivesView'
import { OfficerView } from './components/OfficerView'
import { StudentApplicationsView } from './components/StudentApplicationsView'
import { OfficerApplicationsView } from './components/OfficerApplicationsView'
import { OfficerSchedulesView } from './components/OfficerSchedulesView'
import { AdminUsersView } from './components/AdminUsersView'
import { AdminAnalyticsView } from './components/AdminAnalyticsView'
import { AdminSystemHealthView } from './components/AdminSystemHealthView'
import { InstallPrompt } from './components/InstallPrompt'

export interface NotificationItem {
  id: number
  user_id?: number | null
  title: string
  message: string
  category: string
  target_route?: string | null
  is_read: boolean
  created_at: string
}

interface DatabaseInfo {
  status: 'connected' | 'disconnected'
  connected: boolean
  database_name: string
  host: string
  port: number
  user: string
  connection_uri: string
  message: string
}

interface BackendHealthResponse {
  api_status: string
  service: string
  database: DatabaseInfo
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('placement_theme')
    return (saved === 'dark' || saved === 'light') ? saved : 'light'
  })

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'status'>('login')
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<
    | 'dashboard'
    | 'student-profile'
    | 'student-drives'
    | 'student-applications'
    | 'officer-drives'
    | 'officer-applications'
    | 'officer-schedules'
    | 'admin-users'
    | 'admin-analytics'
    | 'admin-health'
  >('dashboard')

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notifLoading, setNotifLoading] = useState<boolean>(false)

  const fetchNotifications = async () => {
    if (!token) return
    setNotifLoading(true)
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch {
      // Ignore network errors silently
    } finally {
      setNotifLoading(false)
    }
  }

  // Fetch notifications on token change or when opening dropdown
  useEffect(() => {
    if (token) {
      fetchNotifications()
    }
  }, [token])

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      fetch(`/api/v1/notifications/${item.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    if (item.target_route) {
      const cleanRoute = item.target_route.replace(/^\//, '').replace(/\//g, '-')
      const validRoutes = [
        'dashboard',
        'student-profile',
        'student-drives',
        'student-applications',
        'officer-drives',
        'officer-applications',
        'officer-schedules',
        'admin-users',
        'admin-analytics',
        'admin-health'
      ]
      if (validRoutes.includes(cleanRoute)) {
        setViewMode(cleanRoute as any)
      }
    }
    setShowNotifications(false)
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const [showHelpModal, setShowHelpModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const notificationRef = useRef<HTMLDivElement>(null)
// Handle click outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const [healthData, setHealthData] = useState<BackendHealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync dark class on root html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('placement_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Restore session from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('placement_token')
    const savedUser = localStorage.getItem('placement_user')
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setCurrentUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('placement_token')
        localStorage.removeItem('placement_user')
      }
    }
  }, [])

  const handleLoginSuccess = (user: UserSession, accessToken: string) => {
    setCurrentUser(user)
    setToken(accessToken)
    setViewMode('dashboard')
    localStorage.setItem('placement_token', accessToken)
    localStorage.setItem('placement_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setToken(null)
    setViewMode('dashboard')
    localStorage.removeItem('placement_token')
    localStorage.removeItem('placement_user')
    setActiveTab('login')
  }

  const testBackendConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/health')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: BackendHealthResponse = await response.json()
      setHealthData(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to FastAPI backend. Ensure uvicorn is running on http://127.0.0.1:8000'
      )
    } finally {
      setLoading(false)
    }
  }

  const isDbConnected = healthData?.database?.connected ?? false

  // Role-based background assignment:
  // - Login / Guest -> College Campus photo
  // - Student -> College Campus photo
  // - Admin -> Tech Office photo
  // - Placement Officer -> Glass Corporate Tower photo
  const activeBackground = !currentUser
    ? '/backgrounds/college-campus.jpg'
    : currentUser.role === 'admin'
    ? '/backgrounds/tech-office.jpg'
    : currentUser.role === 'officer'
    ? '/backgrounds/corporate-tower.jpg'
    : '/backgrounds/college-campus.jpg'

  // Breadcrumb helper
  const getBreadcrumbTitle = () => {
    switch (viewMode) {
      case 'student-profile':
        return 'Student Profile & Resume'
      case 'student-drives':
        return 'Campus Recruitment Drives'
      case 'student-applications':
        return 'My Applications Pipeline'
      case 'officer-drives':
        return 'Manage Placement Drives'
      case 'officer-applications':
        return 'Review Applicant Rosters'
      case 'officer-schedules':
        return 'Drive Schedules & CTC Offers'
      case 'admin-users':
        return 'User Directory & Roles'
      case 'admin-analytics':
        return 'Institutional Analytics Console'
      case 'admin-health':
        return 'System Health & Audit Logs'
      default:
        return 'Overview Dashboard'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }



  // If user is not signed in, show Auth / Diagnostics landing screen
  if (!currentUser || !token) {
    return (
      <div className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white bg-transparent overflow-x-hidden transition-colors duration-200">
        {/* Background Photo Layer */}
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none scale-105"
          style={{ backgroundImage: `url('${activeBackground}')` }}
        />

        {/* Ambient Frosted-Glass Overlay: subtle dark tint that lets high-res image shine through with crisp contrast */}
        <div className="fixed inset-0 -z-10 bg-slate-900/20 dark:bg-slate-950/45 backdrop-blur-[1px] pointer-events-none transition-all duration-300" />

        {/* Auth Navigation Header */}
        <header className="relative z-50 sticky top-0 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-12 py-3.5 shadow-xs transition-colors duration-200">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('login')}>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/30 shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Waqqas's Placement Portal
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Campus Career & Recruitment Intelligence System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </button>
                <button
                  onClick={() => {
                    setActiveTab('status')
                    if (!healthData) testBackendConnection()
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'status'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  System Diagnostics
                </button>
              </div>



              {/* Install App Button */}
              <InstallPrompt variant="button" />

              <button
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Auth Content Area */}
        <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-10">
          {activeTab === 'login' ? (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setActiveTab('register')}
            />
          ) : activeTab === 'register' ? (
            <RegisterForm />
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Full-Stack Architecture Diagnostics ⚡
                </h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                  Monitor live communication between your React Client, FastAPI Server, and local MySQL Database.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl">
                      <Layout className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 px-2.5 py-1 rounded-md font-bold">
                      Port 5173
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Frontend (React + Vite)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">TypeScript + Tailwind CSS v4</p>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Enterprise 3-Zone Architecture
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Frosted Ambient Glassmorphism
                    </li>
                  </ul>
                </div>

                <div className="bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl">
                      <Server className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-1 rounded-md font-bold">
                      Port 8000
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Backend (FastAPI)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Python 3 + PyJWT + SQLAlchemy</p>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> AIML Placement Predictor
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Dynamic What-If Engine
                    </li>
                  </ul>
                </div>

                <div className={`bg-white/95 dark:bg-slate-900/80 border rounded-2xl p-6 space-y-4 shadow-xs backdrop-blur-md ${
                  isDbConnected ? 'border-emerald-300 dark:border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-xl">
                      <Database className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md font-bold ${
                      isDbConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    }`}>
                      {isDbConnected ? 'MySQL Connected' : 'MySQL Port 3306'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Database (MySQL)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tables: companies, placement_drives</p>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Automated Cutoff Rules
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Student Records Active
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Live Connection Check
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Execute a ping query against MySQL to test end-to-end responsiveness.
                    </p>
                  </div>

                  <button
                    onClick={testBackendConnection}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {loading ? 'Checking...' : 'Run Diagnostics'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {healthData && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>FastAPI Server is online.</span>
                    </div>

                    {healthData.database.connected ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          MySQL Connected: {healthData.database.database_name}
                        </div>
                        <p className="text-emerald-700 dark:text-emerald-200/90 font-mono text-[11px]">
                          Target: {healthData.database.connection_uri}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          MySQL is Disconnected
                        </div>
                        <p className="text-amber-700 dark:text-amber-200">
                          {healthData.database.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-2xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Connection Error</p>
                      <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md px-4 md:px-12 py-5 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Waqqas's Placement Portal • Campus Career & Recruitment Intelligence System
        </footer>

        {/* In-App Mobile/Desktop Install Floating Banner */}
        <InstallPrompt variant="banner" />
      </div>
    )
  }

  // Authenticated 3-Zone Enterprise Layout
  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 flex bg-transparent overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Photo Layer */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none scale-105"
        style={{ backgroundImage: `url('${activeBackground}')` }}
      />

      {/* Frosted Ambient Overlay: subtle dark tint that lets high-res image shine through */}
      <div className="fixed inset-0 -z-10 bg-slate-900/20 dark:bg-slate-950/45 backdrop-blur-[1px] pointer-events-none transition-all duration-300" />

      {/* ZONE 1: Left Navigation Sidebar */}
      <aside
        className={`relative z-40 shrink-0 flex flex-col justify-between transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 shadow-sm ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            onClick={() => setViewMode('dashboard')}
          >
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                  Waqqas's Portal
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                  {currentUser.role} Workspace
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-mono">
              Main Menu
            </p>
          )}

          {/* Role: Student Links */}
          {currentUser.role === 'student' && (
            <>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard Overview</span>}
              </button>

              <button
                onClick={() => setViewMode('student-drives')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'student-drives'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Campus Drives"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Campus Drives</span>}
              </button>

              <button
                onClick={() => setViewMode('student-applications')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'student-applications'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="My Applications"
              >
                <FileCheck className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>My Applications</span>}
              </button>

              <button
                onClick={() => setViewMode('student-profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'student-profile'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Profile & Resume"
              >
                <User className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Profile & Resume</span>}
              </button>
            </>
          )}

          {/* Role: Officer Links */}
          {currentUser.role === 'officer' && (
            <>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard Overview</span>}
              </button>

              <button
                onClick={() => setViewMode('officer-drives')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'officer-drives'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Manage Drives"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Manage Drives</span>}
              </button>

              <button
                onClick={() => setViewMode('officer-applications')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'officer-applications'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Review Applicants"
              >
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Review Applicants</span>}
              </button>

              <button
                onClick={() => setViewMode('officer-schedules')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'officer-schedules'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Schedules & Offers"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Schedules & Offers</span>}
              </button>
            </>
          )}

          {/* Role: Admin Links */}
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard Overview</span>}
              </button>

              <button
                onClick={() => setViewMode('admin-users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'admin-users'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="User Directory"
              >
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>User Directory</span>}
              </button>

              <button
                onClick={() => setViewMode('admin-analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'admin-analytics'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Placement Analytics"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Placement Analytics</span>}
              </button>

              <button
                onClick={() => setViewMode('admin-health')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'admin-health'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="System Health"
              >
                <Activity className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>System Health</span>}
              </button>
            </>
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            {!sidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* Help & Support Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Help & Support"
          >
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
            {!sidebarCollapsed && <span>Help & Support</span>}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Column: Header + Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* ZONE 2: Top Utility Header */}
        <header className="relative z-40 h-16 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center justify-between gap-4 transition-colors duration-200">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer font-medium"
              onClick={() => setViewMode('dashboard')}
            >
              Waqqas's Portal
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-bold">
              {getBreadcrumbTitle()}
            </span>
          </div>

          {/* Header Controls: Search + Notifications + User Avatar Chip */}
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative hidden md:block w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search drives, skills, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-12 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded shadow-xs">
                Ctrl+K
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative inline-block" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) fetchNotifications()
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
                  showNotifications
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Notifications"
                aria-label="Campus Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-950 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 space-y-3 z-[100] origin-top-right animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Campus Alerts</span>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} New
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={fetchNotifications}
                        title="Refresh Alerts"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${notifLoading ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center space-y-1">
                        <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No alerts at this moment</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all cursor-pointer group ${
                            !n.is_read
                              ? 'bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border-indigo-200/80 dark:border-indigo-800/60 shadow-xs'
                              : 'bg-slate-50/80 hover:bg-white dark:bg-slate-950/40 dark:hover:bg-slate-800/50 border-slate-200/60 dark:border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-900" />}
                              <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {n.title}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {n.message}
                          </p>

                          {n.target_route && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-0.5 group-hover:underline">
                              <span>Open Screen</span>
                              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-between px-1">
                      <span className="text-[10px] text-slate-400 font-mono">{notifications.length} total alerts</span>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Install App Button */}
            <InstallPrompt variant="button" />

            {/* User Profile Summary Chip */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {getInitials(currentUser.full_name)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.full_name}
                </p>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                  {currentUser.role} Account
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ZONE 3: Central Main Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {viewMode === 'student-profile' && currentUser.role === 'student' ? (
              <StudentProfileView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : viewMode === 'student-drives' && currentUser.role === 'student' ? (
              <StudentDrivesView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
                onViewApplications={() => setViewMode('student-applications')}
              />
            ) : viewMode === 'student-applications' && currentUser.role === 'student' ? (
              <StudentApplicationsView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
                onBrowseDrives={() => setViewMode('student-drives')}
              />
            ) : viewMode === 'officer-drives' && (currentUser.role === 'officer' || currentUser.role === 'admin') ? (
              <OfficerView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : viewMode === 'officer-applications' && (currentUser.role === 'officer' || currentUser.role === 'admin') ? (
              <OfficerApplicationsView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : viewMode === 'officer-schedules' && (currentUser.role === 'officer' || currentUser.role === 'admin') ? (
              <OfficerSchedulesView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : viewMode === 'admin-users' && currentUser.role === 'admin' ? (
              <AdminUsersView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : viewMode === 'admin-analytics' && currentUser.role === 'admin' ? (
              <AdminAnalyticsView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : viewMode === 'admin-health' && currentUser.role === 'admin' ? (
              <AdminSystemHealthView
                user={currentUser}
                token={token}
                onBack={() => setViewMode('dashboard')}
              />
            ) : (
              <Dashboard
                user={currentUser}
                token={token}
                onLogout={handleLogout}
                onOpenProfile={() => setViewMode('student-profile')}
                onOpenStudentDrives={() => setViewMode('student-drives')}
                onOpenStudentApplications={() => setViewMode('student-applications')}
                onOpenOfficerDrives={() => setViewMode('officer-drives')}
                onOpenOfficerApplications={() => setViewMode('officer-applications')}
                onOpenOfficerSchedules={() => setViewMode('officer-schedules')}
                onOpenAdminUsers={() => setViewMode('admin-users')}
                onOpenAdminAnalytics={() => setViewMode('admin-analytics')}
                onOpenAdminHealth={() => setViewMode('admin-health')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Training & Placement Cell Support
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct assistance for students, coordinators & admins
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">🏢 Placement Directorate Office</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Building B, 3rd Floor, University Career Center, Main Campus
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Office Hours: Monday – Friday (9:00 AM – 5:30 PM)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] font-mono">TPO Helpline</p>
                  <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">+91 98765 43210</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] font-mono">Support Email</p>
                  <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 truncate">tpo.office@college.edu</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300 space-y-1">
                <p className="font-bold">💡 Quick Placement Tip:</p>
                <p className="leading-relaxed">
                  Keep your academic CGPA, semester SGPA breakdown, and GitHub/LinkedIn links updated in <strong>Profile & Resume</strong> to unlock maximum automated eligibility across active drives.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
      {/* In-App Mobile/Desktop Install Floating Banner */}
      <InstallPrompt variant="banner" />
    </div>
  )
}

export default App
