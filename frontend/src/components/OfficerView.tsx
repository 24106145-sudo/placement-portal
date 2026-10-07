import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Building,
  Plus,
  MapPin,
  GraduationCap,
  Briefcase,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
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

interface PlacementDrive {
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
}

interface OfficerViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering'
]

export function OfficerView({ user: _user, token, onBack }: OfficerViewProps) {
  const [drives, setDrives] = useState<PlacementDrive[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // New Drive Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [jobTitle, setJobTitle] = useState('')
  const [roleType, setRoleType] = useState('Full-time')
  const [packageLpa, setPackageLpa] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  // Eligibility Cutoff Inputs
  const [minCgpa, setMinCgpa] = useState('7.0')
  const [minTenth, setMinTenth] = useState('60.0')
  const [minTwelfth, setMinTwelfth] = useState('60.0')
  const [maxBacklogs, setMaxBacklogs] = useState('0')
  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    'Computer Science & Engineering',
    'Information Technology'
  ])

  // New Company Form State
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('Software & IT')
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('')
  const [newCompanyLocation, setNewCompanyLocation] = useState('')
  const [newCompanyDesc, setNewCompanyDesc] = useState('')
  const [newCompanyEmail, setNewCompanyEmail] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [drivesRes, companiesRes] = await Promise.all([
        fetch('/api/v1/officer/drives', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/officer/companies', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!drivesRes.ok || !companiesRes.ok) {
        throw new Error('Failed to load placement drives or companies.')
      }

      const drivesData = await drivesRes.json()
      const companiesData = await companiesRes.json()
      const safeDrives = Array.isArray(drivesData) ? drivesData : []
      const safeCompanies = Array.isArray(companiesData) ? companiesData : []
      setDrives(safeDrives)
      setCompanies(safeCompanies)
      if (safeCompanies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(String(safeCompanies[0].id))
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching officer data.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== dept))
    } else {
      setSelectedDepts([...selectedDepts, dept])
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompanyName.trim()) return

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/v1/officer/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          industry: newCompanyIndustry.trim() || null,
          website: newCompanyWebsite.trim() || null,
          location: newCompanyLocation.trim() || null,
          description: newCompanyDesc.trim() || null,
          contact_email: newCompanyEmail.trim() || null
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to create company.')
      }

      const createdComp: Company = await res.json()
      setCompanies([...companies, createdComp])
      setSelectedCompanyId(String(createdComp.id))
      setCompanyModalOpen(false)
      setNewCompanyName('')
      setNewCompanyWebsite('')
      setNewCompanyLocation('')
      setNewCompanyDesc('')
      setNewCompanyEmail('')
      setSuccessMsg(`Company '${createdComp.name}' registered successfully! 🎉`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to register company.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompanyId || !jobTitle.trim() || !packageLpa || !deadline) {
      setErrorMsg('Please fill in all mandatory fields.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    const payload = {
      company_id: parseInt(selectedCompanyId, 10),
      job_title: jobTitle.trim(),
      role_type: roleType,
      package_lpa: parseFloat(packageLpa),
      job_location: jobLocation.trim() || null,
      description: description.trim() || null,
      deadline: new Date(deadline).toISOString(),
      min_cgpa: parseFloat(minCgpa) || 0.0,
      min_tenth_pct: parseFloat(minTenth) || 0.0,
      min_twelfth_pct: parseFloat(minTwelfth) || 0.0,
      max_active_backlogs: parseInt(maxBacklogs, 10) || 0,
      allowed_departments: selectedDepts
    }

    try {
      const res = await fetch('/api/v1/officer/drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to create recruitment drive.')
      }

      const createdDrive: PlacementDrive = await res.json()
      setDrives([createdDrive, ...drives])
      setModalOpen(false)
      setJobTitle('')
      setPackageLpa('')
      setJobLocation('')
      setDescription('')
      setDeadline('')
      setSuccessMsg(`Drive for '${createdDrive.job_title}' posted live! 🚀`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating drive.')
    } finally {
      setSubmitting(false)
    }
  }

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
                Placement Drives & Recruiters Management
              </h1>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Officer Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register hiring partners and publish campus placement drives with automated eligibility criteria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCompanyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Building className="w-4 h-4" />
            + Register Company
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            Post New Job Drive
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Placement Drives</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{drives.length}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/15 dark:text-indigo-400 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Registered Recruiters</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{companies.length}</p>
          </div>
          <div className="p-3 bg-emerald-600/15 text-emerald-400 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Highest Package Offered</p>
            <p className="text-2xl font-bold text-amber-300 font-mono mt-1">
              {drives.length > 0 ? `${Math.max(...drives.map((d) => d.package_lpa))} LPA` : '—'}
            </p>
          </div>
          <div className="p-3 bg-amber-600/15 text-amber-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold text-emerald-300">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs font-semibold text-rose-300">{errorMsg}</p>
        </div>
      )}

      {/* Drives List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          All Posted Campus Recruitment Drives ({drives.length})
        </h2>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading placement drives from MySQL database...</p>
          </div>
        ) : drives.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <Building className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Placement Drives Posted Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Click the "+ Post New Job Drive" button above to publish your first campus recruitment drive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drives.map((d) => (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 rounded-3xl p-6 space-y-5 transition-all shadow-xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {d.company.name}
                      </span>
                      {d.company.industry && (
                        <span className="text-[10px] bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
                          {d.company.industry}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{d.job_title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      ₹{d.package_lpa} LPA
                    </span>
                    <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400">{d.role_type}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  {d.job_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {d.job_location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-[11px] text-amber-300/90">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Deadline: {new Date(d.deadline).toLocaleDateString()}
                  </span>
                </div>

                {d.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                )}

                {/* Eligibility Criteria Chips */}
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    Automated Eligibility Cutoffs:
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                      CGPA: {d.min_cgpa > 0 ? `${d.min_cgpa}+` : 'No Cutoff'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                      10th: {d.min_tenth_pct > 0 ? `${d.min_tenth_pct}%+` : 'Any'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                      12th: {d.min_twelfth_pct > 0 ? `${d.min_twelfth_pct}%+` : 'Any'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                      Max Backlogs: {d.max_active_backlogs}
                    </span>
                  </div>

                  {d.allowed_departments && d.allowed_departments.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {d.allowed_departments.map((dept) => (
                        <span
                          key={dept}
                          className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-500 dark:text-slate-400"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL: POST NEW DRIVE ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Campus Placement Drive</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Specify job details and automated student eligibility cutoffs.</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-6">
              {/* Company Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Recruiting Company <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyModalOpen(true)
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
                  >
                    + Register New Company
                  </button>
                </div>
                <select
                  required
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.industry ? `(${c.industry})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Title & Role Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Job Title / Designation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Development Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Role Type</label>
                  <select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Intern + Full-time">Intern + Full-time</option>
                  </select>
                </div>
              </div>

              {/* Package & Location & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-emerald-400 font-bold">
                    Package (LPA in ₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    placeholder="e.g. 14.5"
                    value={packageLpa}
                    onChange={(e) => setPackageLpa(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 font-bold focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 font-mono transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune / Bengaluru"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Application Deadline <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Job Description</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, required skills, interview stages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>

              {/* Automated Eligibility Section */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Automated Student Eligibility Criteria
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">Min CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={minCgpa}
                      onChange={(e) => setMinCgpa(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">Min 10th %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={minTenth}
                      onChange={(e) => setMinTenth(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">Min 12th %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={minTwelfth}
                      onChange={(e) => setMinTwelfth(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">Max Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Allowed Academic Departments (Check all eligible):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEPARTMENTS.map((dept) => (
                      <label
                        key={dept}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 bg-white dark:bg-slate-900/60 shadow-xs rounded-xl border border-slate-200 dark:border-slate-800/60 cursor-pointer hover:bg-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepts.includes(dept)}
                          onChange={() => handleToggleDept(dept)}
                          className="rounded border-slate-200 dark:border-slate-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-[11px] truncate">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-slate-900 dark:text-white text-xs font-bold shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Publish Placement Drive
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER COMPANY ================= */}
      {companyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Recruiting Company</h3>
              </div>
              <button
                onClick={() => setCompanyModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon / Goldman Sachs"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud & E-commerce"
                    value={newCompanyIndustry}
                    onChange={(e) => setNewCompanyIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, India"
                    value={newCompanyLocation}
                    onChange={(e) => setNewCompanyLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Website URL</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={newCompanyWebsite}
                  onChange={(e) => setNewCompanyWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview about the company..."
                  value={newCompanyDesc}
                  onChange={(e) => setNewCompanyDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white text-xs font-bold shadow-lg shadow-emerald-600/25"
                >
                  {submitting ? 'Saving...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
