import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface AdminUser {
  id: number
  full_name: string
  email: string
  role: 'student' | 'officer' | 'admin' | string
  created_at: string
  has_profile: boolean
  department?: string | null
  roll_no?: string | null
  cgpa?: number | null
}

interface AdminUsersViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

export function AdminUsersView({ user: currentAdmin, token, onBack }: AdminUsersViewProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Failed to load users (HTTP ${response.status})`)
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not fetch user directory.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (targetUserId: number, newRole: string) => {
    setUpdatingUserId(targetUserId)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const response = await fetch(`/api/v1/admin/users/${targetUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.detail || 'Failed to update user role.')
      }

      const updatedUser: AdminUser = await response.json()
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: updatedUser.role } : u))
      )
      setSuccessMsg(`Role for ${updatedUser.full_name} updated to '${newRole.toUpperCase()}'.`)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update user role.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (targetUserId: number, targetName: string) => {
    if (!window.confirm(`Are you sure you want to delete user '${targetName}'? This will delete all associated student profiles and application records.`)) {
      return
    }

    setDeletingUserId(targetUserId)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const response = await fetch(`/api/v1/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        throw new Error(errJson?.detail || 'Failed to delete user.')
      }

      setUsers((prev) => prev.filter((u) => u.id !== targetUserId))
      setSuccessMsg(`User '${targetName}' successfully removed from system.`)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not delete user account.')
    } finally {
      setDeletingUserId(null)
    }
  }

  const safeUsers = Array.isArray(users) ? users : []

  const filteredUsers = safeUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const name = (u.full_name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const roll = (u.roll_no || '').toLowerCase()
      const dept = (u.department || '').toLowerCase()
      const matches = name.includes(q) || email.includes(q) || roll.includes(q) || dept.includes(q)
      if (!matches) return false
    }
    return true
  })

  // Summary counts
  const totalUsers = safeUsers.length
  const studentCount = safeUsers.filter((u) => u.role === 'student').length
  const officerCount = safeUsers.filter((u) => u.role === 'officer').length
  const adminCount = safeUsers.filter((u) => u.role === 'admin').length

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 border-amber-500/40',
          icon: ShieldCheck,
          text: 'Administrator'
        }
      case 'officer':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 border-emerald-500/40',
          icon: Briefcase,
          text: 'Placement Officer'
        }
      default:
        return {
          bg: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 border-indigo-500/40',
          icon: GraduationCap,
          text: 'Student Applicant'
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
                User Management & Access Control
              </h1>
              <span className="text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                System Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect registered accounts in MySQL, assign administrative roles, manage permissions, and remove test users.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Active Root Admin</p>
            <p className="font-bold text-slate-900 dark:text-white font-mono">{currentAdmin.full_name}</p>
          </div>
        </div>
      </div>

      {/* Summary Counts Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/15 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Registered</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/15 dark:text-indigo-400 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Students</p>
            <p className="text-xl font-bold text-indigo-300 font-mono">{studentCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-600/15 text-emerald-400 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Placement Officers</p>
            <p className="text-xl font-bold text-emerald-300 font-mono">{officerCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-600/15 text-amber-400 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Administrators</p>
            <p className="text-xl font-bold text-amber-300 font-mono">{adminCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'student', label: 'Students' },
            { id: 'officer', label: 'Officers' },
            { id: 'admin', label: 'Admins' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-amber-600 text-slate-900 dark:text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, roll no, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
          />
        </div>
      </div>

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

      {/* Users Directory Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading user records from database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Users Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No accounts match your current search query or role filter.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">User Account</th>
                  <th className="py-4 px-4">Role Access</th>
                  <th className="py-4 px-4">Academic Details</th>
                  <th className="py-4 px-4">Joined Date</th>
                  <th className="py-4 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredUsers.map((u) => {
                  const roleBadge = getRoleBadge(u.role)
                  const RoleIcon = roleBadge.icon
                  const isUpdating = updatingUserId === u.id
                  const isDeleting = deletingUserId === u.id
                  const isSelf = u.id === currentAdmin.id

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name and Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${roleBadge.bg}`}>
                            <RoleIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{u.full_name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current Role / Role Switcher */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${roleBadge.bg}`}>
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleBadge.text}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <select
                              value={u.role}
                              disabled={isUpdating || isSelf}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer font-semibold"
                            >
                              <option value="student">Student</option>
                              <option value="officer">Placement Officer</option>
                              <option value="admin">Administrator</option>
                            </select>
                            {isUpdating && <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />}
                          </div>
                        </div>
                      </td>

                      {/* Academic Info */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                        {u.has_profile ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {u.department || 'Branch Not Set'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {u.roll_no ? `Roll: ${u.roll_no}` : 'No Roll No'} • CGPA: <strong className="text-emerald-400">{u.cgpa ?? '-'}</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No Profile Data</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Delete User"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
