import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  GraduationCap,
  Briefcase,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  Building,
  Award,
  BookOpen,
  Plus,
  X,
  FileText,
  Loader2,
  Globe,
  Code2
} from 'lucide-react'
import type { UserSession } from './LoginForm'

interface AcademicRecord {
  tenth_school_name?: string | null
  tenth_board?: string | null
  tenth_year?: number | null
  tenth_percentage?: number | null
  twelfth_college_name?: string | null
  twelfth_board?: string | null
  twelfth_year?: number | null
  twelfth_percentage?: number | null
  is_diploma?: boolean
  college_name?: string | null
  university?: string | null
  degree?: string | null
  department?: string | null
  current_year?: number | null
  current_sem?: number | null
  roll_no?: string | null
  cgpa?: number | null
  active_backlogs?: number
  sgpa_sem1?: number | null
  sgpa_sem2?: number | null
  sgpa_sem3?: number | null
  sgpa_sem4?: number | null
  sgpa_sem5?: number | null
  sgpa_sem6?: number | null
  sgpa_sem7?: number | null
  sgpa_sem8?: number | null
}

interface StudentProfile {
  id?: number
  user_id?: number
  email?: string | null
  full_name?: string | null
  dob?: string | null
  gender?: string | null
  phone_number?: string | null
  address?: string | null
  city?: string | null
  technical_skills?: string[]
  certifications?: string[]
  projects?: { title: string; description: string; tech: string }[]
  resume_link?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  academic?: AcademicRecord | null
  completion_percentage?: number
}

interface StudentProfileViewProps {
  user: UserSession
  token: string
  onBack: () => void
}

const COMMON_SKILLS = [
  'Python',
  'Java',
  'C++',
  'JavaScript',
  'TypeScript',
  'React',
  'FastAPI',
  'Node.js',
  'SQL',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'Git',
  'AWS',
  'Machine Learning',
  'Data Structures'
]

// Helper function to format FastAPI Pydantic validation errors cleanly
function formatErrorMessage(data: unknown, fallbackStatus?: number): string {
  if (!data || typeof data !== 'object') {
    return `An unexpected error occurred (HTTP ${fallbackStatus || 500})`
  }

  const errObj = data as { detail?: unknown; message?: string }

  if (typeof errObj.detail === 'string') {
    return errObj.detail
  }

  if (Array.isArray(errObj.detail)) {
    return errObj.detail
      .map((item: { loc?: (string | number)[]; msg?: string }) => {
        if (!item || typeof item !== 'object') return String(item)
        const location = item.loc
          ? item.loc.filter((part) => part !== 'body').join(' -> ')
          : 'Field'
        const cleanField = location
          .replace('academic -> ', '')
          .replace('tenth_year', '10th Year')
          .replace('twelfth_year', '12th Year')
          .replace('tenth_percentage', '10th Percentage')
          .replace('twelfth_percentage', '12th Percentage')
          .replace('cgpa', 'CGPA')
          .replace('active_backlogs', 'Backlogs')
          .replace('current_sem', 'Current Semester')
          .replace('current_year', 'Current Year')
        return `[${cleanField}]: ${item.msg || 'Invalid value'}`
      })
      .join('\n')
  }

  if (errObj.message) {
    return errObj.message
  }

  return JSON.stringify(errObj)
}

export function StudentProfileView({ user, token, onBack }: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'professional'>('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Profile Form State
  const [fullName, setFullName] = useState(user.full_name || '')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('Male')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  // Professional State
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [resumeLink, setResumeLink] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [certInput, setCertInput] = useState('')
  const [projects, setProjects] = useState<{ title: string; description: string; tech: string }[]>([])
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectTech, setProjectTech] = useState('')

  // Academic State
  const [tenthSchool, setTenthSchool] = useState('')
  const [tenthBoard, setTenthBoard] = useState('')
  const [tenthYear, setTenthYear] = useState<string>('')
  const [tenthPercent, setTenthPercent] = useState<string>('')

  const [twelfthCollege, setTwelfthCollege] = useState('')
  const [twelfthBoard, setTwelfthBoard] = useState('')
  const [twelfthYear, setTwelfthYear] = useState<string>('')
  const [twelfthPercent, setTwelfthPercent] = useState<string>('')
  const [isDiploma, setIsDiploma] = useState(false)

  const [collegeName, setCollegeName] = useState('')
  const [university, setUniversity] = useState('')
  const [degree, setDegree] = useState('B.Tech')
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [currentYear, setCurrentYear] = useState<string>('3')
  const [currentSem, setCurrentSem] = useState<string>('5')
  const [rollNo, setRollNo] = useState('')
  const [cgpa, setCgpa] = useState<string>('')
  const [backlogs, setBacklogs] = useState<string>('0')

  // SGPA 1-8
  const [sgpa1, setSgpa1] = useState<string>('')
  const [sgpa2, setSgpa2] = useState<string>('')
  const [sgpa3, setSgpa3] = useState<string>('')
  const [sgpa4, setSgpa4] = useState<string>('')
  const [sgpa5, setSgpa5] = useState<string>('')
  const [sgpa6, setSgpa6] = useState<string>('')
  const [sgpa7, setSgpa7] = useState<string>('')
  const [sgpa8, setSgpa8] = useState<string>('')

  const [completionPercent, setCompletionPercent] = useState<number>(0)

  // Fetch Profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/v1/students/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(formatErrorMessage(errorData, response.status))
      }

      const data: StudentProfile = await response.json()
      populateForm(data)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not fetch student profile.')
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (data: StudentProfile) => {
    setFullName(data.full_name || user.full_name || '')
    setDob(data.dob || '')
    setGender(data.gender || 'Male')
    setPhoneNumber(data.phone_number || '')
    setAddress(data.address || '')
    setCity(data.city || '')

    setSkills(data.technical_skills || [])
    setCertifications(data.certifications || [])
    setProjects(data.projects || [])
    setResumeLink(data.resume_link || '')
    setLinkedinUrl(data.linkedin_url || '')
    setGithubUrl(data.github_url || '')
    setCompletionPercent(data.completion_percentage || 0)

    if (data.academic) {
      const a = data.academic
      setTenthSchool(a.tenth_school_name || '')
      setTenthBoard(a.tenth_board || '')
      setTenthYear(a.tenth_year ? String(a.tenth_year) : '')
      setTenthPercent(a.tenth_percentage !== undefined && a.tenth_percentage !== null ? String(a.tenth_percentage) : '')

      setTwelfthCollege(a.twelfth_college_name || '')
      setTwelfthBoard(a.twelfth_board || '')
      setTwelfthYear(a.twelfth_year ? String(a.twelfth_year) : '')
      setTwelfthPercent(a.twelfth_percentage !== undefined && a.twelfth_percentage !== null ? String(a.twelfth_percentage) : '')
      setIsDiploma(!!a.is_diploma)

      setCollegeName(a.college_name || '')
      setUniversity(a.university || '')
      setDegree(a.degree || 'B.Tech')
      setDepartment(a.department || 'Computer Science & Engineering')
      setCurrentYear(a.current_year ? String(a.current_year) : '3')
      setCurrentSem(a.current_sem ? String(a.current_sem) : '5')
      setRollNo(a.roll_no || '')
      setCgpa(a.cgpa !== undefined && a.cgpa !== null ? String(a.cgpa) : '')
      setBacklogs(a.active_backlogs !== undefined ? String(a.active_backlogs) : '0')

      setSgpa1(a.sgpa_sem1 !== null && a.sgpa_sem1 !== undefined ? String(a.sgpa_sem1) : '')
      setSgpa2(a.sgpa_sem2 !== null && a.sgpa_sem2 !== undefined ? String(a.sgpa_sem2) : '')
      setSgpa3(a.sgpa_sem3 !== null && a.sgpa_sem3 !== undefined ? String(a.sgpa_sem3) : '')
      setSgpa4(a.sgpa_sem4 !== null && a.sgpa_sem4 !== undefined ? String(a.sgpa_sem4) : '')
      setSgpa5(a.sgpa_sem5 !== null && a.sgpa_sem5 !== undefined ? String(a.sgpa_sem5) : '')
      setSgpa6(a.sgpa_sem6 !== null && a.sgpa_sem6 !== undefined ? String(a.sgpa_sem6) : '')
      setSgpa7(a.sgpa_sem7 !== null && a.sgpa_sem7 !== undefined ? String(a.sgpa_sem7) : '')
      setSgpa8(a.sgpa_sem8 !== null && a.sgpa_sem8 !== undefined ? String(a.sgpa_sem8) : '')
    }
  }

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  const handleAddCert = () => {
    const trimmed = certInput.trim()
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed])
      setCertInput('')
    }
  }

  const handleRemoveCert = (certToRemove: string) => {
    setCertifications(certifications.filter((c) => c !== certToRemove))
  }

  const handleAddProject = () => {
    if (projectTitle.trim()) {
      setProjects([
        ...projects,
        {
          title: projectTitle.trim(),
          description: projectDesc.trim(),
          tech: projectTech.trim()
        }
      ])
      setProjectTitle('')
      setProjectDesc('')
      setProjectTech('')
    }
  }

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setErrorMessage(null)

    // Helper functions for parsing numbers safely
    const parseNum = (v: string) => {
      const clean = v.trim()
      if (clean === '') return null
      const parsed = Number(clean)
      return isNaN(parsed) ? null : parsed
    }

    const parseIntNum = (v: string) => {
      const clean = v.trim()
      if (clean === '') return null
      const parsed = parseInt(clean, 10)
      return isNaN(parsed) ? null : parsed
    }

    // Client-side sanity checks
    const parsedTenthYear = parseIntNum(tenthYear)
    if (parsedTenthYear && (parsedTenthYear < 1900 || parsedTenthYear > 2100)) {
      setErrorMessage('10th Passing Year must be a 4-digit year (e.g. 2020).')
      setSaving(false)
      return
    }

    const parsedTwelfthYear = parseIntNum(twelfthYear)
    if (parsedTwelfthYear && (parsedTwelfthYear < 1900 || parsedTwelfthYear > 2100)) {
      setErrorMessage('12th/Diploma Passing Year must be a 4-digit year (e.g. 2022).')
      setSaving(false)
      return
    }

    const parsedCgpa = parseNum(cgpa)
    if (parsedCgpa !== null && (parsedCgpa < 0 || parsedCgpa > 10)) {
      setErrorMessage('Cumulative CGPA must be between 0.0 and 10.0.')
      setSaving(false)
      return
    }

    const payload = {
      full_name: fullName.trim(),
      dob: dob || null,
      gender: gender || null,
      phone_number: phoneNumber.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      technical_skills: skills,
      certifications: certifications,
      projects: projects,
      resume_link: resumeLink.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      academic: {
        tenth_school_name: tenthSchool.trim() || null,
        tenth_board: tenthBoard.trim() || null,
        tenth_year: parsedTenthYear,
        tenth_percentage: parseNum(tenthPercent),

        twelfth_college_name: twelfthCollege.trim() || null,
        twelfth_board: twelfthBoard.trim() || null,
        twelfth_year: parsedTwelfthYear,
        twelfth_percentage: parseNum(twelfthPercent),
        is_diploma: isDiploma,

        college_name: collegeName.trim() || null,
        university: university.trim() || null,
        degree: degree.trim() || null,
        department: department.trim() || null,
        current_year: parseIntNum(currentYear),
        current_sem: parseIntNum(currentSem),
        roll_no: rollNo.trim() || null,
        cgpa: parsedCgpa,
        active_backlogs: parseIntNum(backlogs) || 0,

        sgpa_sem1: parseNum(sgpa1),
        sgpa_sem2: parseNum(sgpa2),
        sgpa_sem3: parseNum(sgpa3),
        sgpa_sem4: parseNum(sgpa4),
        sgpa_sem5: parseNum(sgpa5),
        sgpa_sem6: parseNum(sgpa6),
        sgpa_sem7: parseNum(sgpa7),
        sgpa_sem8: parseNum(sgpa8)
      }
    }

    try {
      const response = await fetch('/api/v1/students/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(formatErrorMessage(data, response.status))
      }

      const updated: StudentProfile = await response.json()
      populateForm(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error saving profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading your profile from MySQL database...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Top Bar with Back Button and Profile Header */}
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
                Student Placement Profile
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                ID #{user.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keep your academic and resume details updated for campus recruitment drives.
            </p>
          </div>
        </div>

        {/* Profile Completion Meter Card */}
        <div className="bg-white dark:bg-slate-900/90 shadow-xs border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 min-w-[280px]">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-indigo-500 transition-all duration-1000 ease-out"
                fill="transparent"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * completionPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-900 dark:text-white font-mono">
              {completionPercent}%
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Profile Score</p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {completionPercent >= 80
                ? 'Ready for Placements 🚀'
                : completionPercent >= 50
                ? 'Good progress! Add more details'
                : 'Fill in details to unlock jobs'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900/90 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium'
          }`}
        >
          <User className="w-4 h-4" />
          1. Personal & Contact
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('academic')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'academic'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          2. Academic History
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('professional')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'professional'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          3. Skills & Resume
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* ================= TAB 1: PERSONAL DETAILS ================= */}
        {activeTab === 'personal' && (
          <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal & Contact Information</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Recruiters will use these details to contact you for interviews.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name (as per College ID) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waqqas Mulla"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Registered Institutional Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 cursor-not-allowed font-mono"
                />
              </div>

              {/* DOB */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  Primary Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  Current City / State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Maharashtra"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>

              {/* Full Address */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Flat/House No., Street, Area, Landmark, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ACADEMIC HISTORY ================= */}
        {activeTab === 'academic' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. College & Current Standing */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-lg">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Current College & Degree</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Institutional enrolment and current academic standing.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">College / Institute Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Government Engineering College"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Affiliated University</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Degree Program</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech / B.E. / MCA"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Department / Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Roll No / University Seat No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 24106147"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Current Year</label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year (Final)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Current Semester</label>
                  <select
                    value={currentSem}
                    onChange={(e) => setCurrentSem(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-emerald-400 font-bold">
                    Cumulative CGPA (0.0 - 10.0) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.2"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Active Live Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    value={backlogs}
                    onChange={(e) => setBacklogs(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. Semester-wise SGPA Breakdown */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Semester-wise SGPA Breakdown</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter your SGPA for each completed semester.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-2">
                {[
                  { label: 'Sem 1', val: sgpa1, setter: setSgpa1 },
                  { label: 'Sem 2', val: sgpa2, setter: setSgpa2 },
                  { label: 'Sem 3', val: sgpa3, setter: setSgpa3 },
                  { label: 'Sem 4', val: sgpa4, setter: setSgpa4 },
                  { label: 'Sem 5', val: sgpa5, setter: setSgpa5 },
                  { label: 'Sem 6', val: sgpa6, setter: setSgpa6 },
                  { label: 'Sem 7', val: sgpa7, setter: setSgpa7 },
                  { label: 'Sem 8', val: sgpa8, setter: setSgpa8 }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5 text-center">
                    <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{item.label}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="—"
                      value={item.val}
                      onChange={(e) => item.setter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Schooling (10th & 12th / Diploma) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 10th Standard */}
              <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">10th Standard (SSC / Matric)</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HCHS"
                      value={tenthSchool}
                      onChange={(e) => setTenthSchool(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Board</label>
                      <input
                        type="text"
                        placeholder="STATE"
                        value={tenthBoard}
                        onChange={(e) => setTenthBoard(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Year (4 Digits)</label>
                      <input
                        type="number"
                        min="1990"
                        max="2040"
                        maxLength={4}
                        placeholder="2020"
                        value={tenthYear}
                        onChange={(e) => setTenthYear(e.target.value.slice(0, 4))}
                        className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Percentage %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="85"
                        value={tenthPercent}
                        onChange={(e) => setTenthPercent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 12th Standard / Diploma */}
              <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">12th (HSC) / Diploma</h4>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDiploma}
                      onChange={(e) => setIsDiploma(e.target.checked)}
                      className="rounded border-slate-200 dark:border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    Diploma Student
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      {isDiploma ? 'Polytechnic / Institute Name' : 'Junior College Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SOMAIYA"
                      value={twelfthCollege}
                      onChange={(e) => setTwelfthCollege(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Board / Council</label>
                      <input
                        type="text"
                        placeholder="STATE"
                        value={twelfthBoard}
                        onChange={(e) => setTwelfthBoard(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Year (4 Digits)</label>
                      <input
                        type="number"
                        min="1990"
                        max="2040"
                        maxLength={4}
                        placeholder="2022"
                        value={twelfthYear}
                        onChange={(e) => setTwelfthYear(e.target.value.slice(0, 4))}
                        className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Percentage %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="72"
                        value={twelfthPercent}
                        onChange={(e) => setTwelfthPercent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROFESSIONAL SKILLS & LINKS ================= */}
        {activeTab === 'professional' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Skills Tag Input */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Technical Skills & Technologies</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add keywords that company job eligibility filters match against.</p>
                </div>
              </div>

              {/* Added Skills Badges */}
              <div className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                {skills.length === 0 ? (
                  <span className="text-xs text-slate-500 italic py-1">No skills added yet. Type below or pick from suggestions!</span>
                ) : (
                  skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Skill Input Row */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a skill (e.g. Next.js, Docker, Java, AWS) and press Add"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSkill(skillInput)
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(skillInput)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              </div>

              {/* Quick Pick Suggested Skills */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950 hover:text-indigo-300 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Resume & Portfolio Links */}
            <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Resume Document & Social Profiles</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Share your live portfolio and verified document links with interviewers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Resume Cloud / Drive Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={resumeLink}
                    onChange={(e) => setResumeLink(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. Projects & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Projects */}
              <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Key Projects ({projects.length})
                </h4>

                {projects.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {p.tech && <p className="text-[10px] font-mono text-indigo-400">{p.tech}</p>}
                    {p.description && <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>}
                  </div>
                ))}

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    placeholder="Project Title (e.g. Waqqas's Placement Portal)"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Technologies Used (e.g. React, FastAPI, MySQL)"
                    value={projectTech}
                    onChange={(e) => setProjectTech(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Brief description of your project and outcomes..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddProject}
                    disabled={!projectTitle.trim()}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-900 dark:text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    + Add Project to Profile
                  </button>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Certifications ({certifications.length})
                </h4>

                <div className="flex flex-wrap gap-2 min-h-[48px]">
                  {certifications.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 text-xs"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(c)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    placeholder="e.g. AWS Certified Cloud Practitioner"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCert()
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-300">Error Updating Profile</p>
              <pre className="text-xs text-rose-200 mt-0.5 font-sans whitespace-pre-wrap">{errorMessage}</pre>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-300">Profile Updated Successfully! 🎉</p>
              <p className="text-xs text-emerald-200/90">All personal, academic, and skills data saved to MySQL database.</p>
            </div>
          </div>
        )}

        {/* Floating Bottom Sticky Action Bar */}
        <div className="sticky bottom-6 z-40 bg-white dark:bg-slate-900/95 shadow-xs border border-slate-200 dark:border-slate-800 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All modifications save directly to your MySQL student profile records.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Done & Return
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-slate-900 dark:text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving to MySQL...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
