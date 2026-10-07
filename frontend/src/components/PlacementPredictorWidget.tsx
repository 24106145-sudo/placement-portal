import { useState, useEffect, useId } from 'react'
import {
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Zap,
  ArrowUpRight,
  BookOpen,
  Code2,
  FolderGit2,
  ShieldAlert,
  BrainCircuit,
  Info,
  X,
  Target
} from 'lucide-react'

export interface PrescriptiveAction {
  title: string
  description: string
  probability_gain_pct: number
  simulated_probability: number
  impact_tier: string
  category: string
}

export interface WhatIfScenario {
  id: string
  title: string
  description: string
  simulated_probability: number
  delta_pct: number
  modifications: Record<string, number | string>
}

export interface FeatureSummary {
  tenth_percentage: number
  twelfth_percentage: number
  cgpa: number
  active_backlogs: number
  sem7_sgpa: number
  sem6_sgpa: number
  skills_count: number
  projects_count: number
  certifications_count: number
  technical_skills: string[]
  project_names: string[]
  certification_names: string[]
}

export interface PlacementPredictionResponse {
  base_probability: number
  readiness_tier: string
  readiness_color: string
  readiness_summary: string
  has_academic_profile: boolean
  features: FeatureSummary
  prescriptive_actions: PrescriptiveAction[]
  what_if_scenarios: WhatIfScenario[]
  model_metrics: Record<string, number | string>
}

export interface WhatIfCustomResponse {
  simulated_probability: number
  delta_pct: number
  simulated_readiness_tier: string
  simulated_readiness_color: string
  parameters_evaluated: Record<string, number>
}

interface PlacementPredictorWidgetProps {
  token: string
  onOpenProfile?: () => void
}

export function PlacementPredictorWidget({ token, onOpenProfile }: PlacementPredictorWidgetProps) {
  const gradientId = useId()
  const modalGradientId = useId()
  const [data, setData] = useState<PlacementPredictionResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Interactive Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // What-If Custom Simulation State
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [simCgpa, setSimCgpa] = useState<number>(7.0)
  const [simBacklogs, setSimBacklogs] = useState<number>(0)
  const [simSkills, setSimSkills] = useState<number>(5)
  const [simProjects, setSimProjects] = useState<number>(2)
  const [simCerts, setSimCerts] = useState<number>(1)

  const [simResult, setSimResult] = useState<WhatIfCustomResponse | null>(null)
  const [simulating, setSimulating] = useState<boolean>(false)

  const fetchPrediction = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/students/me/placement-prediction', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error(`Failed to calculate placement probability (${res.status})`)
      }
      const json: PlacementPredictionResponse = await res.json()
      setData(json)

      // Initialize simulator with baseline features
      if (json.features) {
        setSimCgpa(json.features.cgpa)
        setSimBacklogs(json.features.active_backlogs)
        setSimSkills(json.features.skills_count)
        setSimProjects(json.features.projects_count)
        setSimCerts(json.features.certifications_count)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching placement analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchPrediction()
    }
  }, [token])

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // Run dynamic simulation when sliders or inputs change
  const runCustomSimulation = async (
    cgpa: number,
    backlogs: number,
    skills: number,
    projects: number,
    certs: number
  ) => {
    setSimulating(true)
    try {
      const res = await fetch('/api/v1/students/me/simulate-what-if', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cgpa,
          active_backlogs: backlogs,
          skills_count: skills,
          projects_count: projects,
          certifications_count: certs
        })
      })
      if (res.ok) {
        const json: WhatIfCustomResponse = await res.json()
        setSimResult(json)
      }
    } catch {
      // Ignore simulation network errors silently
    } finally {
      setSimulating(false)
    }
  }

  // Handle Preset Click
  const handlePresetSelect = (scenario: WhatIfScenario) => {
    if (!data) return
    setSelectedPresetId(scenario.id)

    const base = data.features
    const mods = scenario.modifications

    const newCgpa = typeof mods.cgpa === 'number' ? mods.cgpa : base.cgpa
    const newBacklogs = typeof mods.active_backlogs === 'number' ? mods.active_backlogs : base.active_backlogs
    const newSkills = typeof mods.skills_count === 'number' ? mods.skills_count : base.skills_count
    const newProjects = typeof mods.projects_count === 'number' ? mods.projects_count : base.projects_count
    const newCerts = typeof mods.certifications_count === 'number' ? mods.certifications_count : base.certifications_count

    setSimCgpa(newCgpa)
    setSimBacklogs(newBacklogs)
    setSimSkills(newSkills)
    setSimProjects(newProjects)
    setSimCerts(newCerts)

    runCustomSimulation(newCgpa, newBacklogs, newSkills, newProjects, newCerts)
  }

  // Reset Simulator
  const handleResetSimulator = () => {
    if (!data) return
    setSelectedPresetId(null)
    const base = data.features
    setSimCgpa(base.cgpa)
    setSimBacklogs(base.active_backlogs)
    setSimSkills(base.skills_count)
    setSimProjects(base.projects_count)
    setSimCerts(base.certifications_count)
    setSimResult(null)
  }

  // Helper for Readiness Tier Styling
  const getTierBadge = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300',
          glow: 'shadow-emerald-500/10',
          text: 'text-emerald-700 dark:text-emerald-400',
          gaugeColor: '#10b981',
          icon: Award
        }
      case 'indigo':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300',
          glow: 'shadow-indigo-500/10',
          text: 'text-indigo-700 dark:text-indigo-400',
          gaugeColor: '#6366f1',
          icon: Zap
        }
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300',
          glow: 'shadow-amber-500/10',
          text: 'text-amber-700 dark:text-amber-400',
          gaugeColor: '#f59e0b',
          icon: AlertCircle
        }
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 backdrop-blur-md shadow-xs flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 animate-spin">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 backdrop-blur-md flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-xs">{error || 'Unable to load placement predictor.'}</p>
        </div>
        <button
          onClick={fetchPrediction}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    )
  }

  const tierStyle = getTierBadge(data.readiness_color)
  const TierIcon = tierStyle.icon

  // Compact Radial Gauge Calculations
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const currentProb = simResult ? simResult.simulated_probability : data.base_probability
  const strokeDashoffset = circumference - (currentProb / 100) * circumference

  // Modal Radial Gauge Calculations
  const modalRadius = 60
  const modalCircumference = 2 * Math.PI * modalRadius
  const modalStrokeDashoffset = modalCircumference - (currentProb / 100) * modalCircumference

  // Top 2 quick wins
  const topRecommendations = data.prescriptive_actions.slice(0, 2)

  return (
    <>
      {/* 1. COMPACT DASHBOARD SUMMARY TILE (~140px-160px height) */}
      <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all p-4 md:p-5 group">
        {/* Subtle Ambient Accent */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/5 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Left: Compact Circular Gauge & Probability Badge */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Mini SVG Radial Gauge */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-100 dark:text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke={`url(#${gradientId})`}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {currentProb}%
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${tierStyle.bg}`}>
                  <TierIcon className="w-3 h-3" />
                  {simResult ? simResult.simulated_readiness_tier : data.readiness_tier}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Placement Probability</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[11px] font-mono">
                  {data.features.cgpa.toFixed(1)} CGPA | {data.features.active_backlogs} Backlogs
                </span>
              </div>
            </div>
          </div>

          {/* Center: Compact Top-2 Quick Win Recommendations Ticker */}
          <div className="flex-1 min-w-0 border-t xl:border-t-0 xl:border-l xl:border-r border-slate-200/80 dark:border-slate-800/80 pt-3 xl:pt-0 xl:px-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Top Prescriptive Actions
              </span>
            </div>

            {topRecommendations.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>All key placement benchmarks cleared! Ready for campus rounds.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topRecommendations.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-hidden"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {action.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {action.category}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />
                      +{action.probability_gain_pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick Action Button to Open Full Simulator & Insights Modal */}
          <div className="flex items-center gap-2 shrink-0 pt-2 xl:pt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group/btn whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-45" />
              <span>Full Simulator & Insights</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchPrediction}
              title="Refresh Probability"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FULL INTERACTIVE SIMULATOR & PRESCRIPTIVE INSIGHTS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 p-6 sm:p-8 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Placement Probability & What-If Simulator
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold">
                      AI/ML v1.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fine-tune candidate credentials and simulate placement probability gains in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Accuracy: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">86.8%</strong>
                </span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                  title="Close Modal (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Grid: Left (Gauge & Features) + Right (Recommendations & Presets) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Radial Gauge & Evaluated Profile (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                      Calculated Odds
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${tierStyle.bg}`}>
                      <TierIcon className="w-3.5 h-3.5" />
                      {simResult ? simResult.simulated_readiness_tier : data.readiness_tier}
                    </span>
                  </div>

                  {/* SVG Radial Progress */}
                  <div className="flex flex-col items-center justify-center py-4 relative">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 150 150">
                        <circle
                          cx="75"
                          cy="75"
                          r={modalRadius}
                          stroke="currentColor"
                          strokeWidth="10"
                          className="text-slate-200 dark:text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="75"
                          cy="75"
                          r={modalRadius}
                          stroke={`url(#${modalGradientId})`}
                          strokeWidth="10"
                          strokeDasharray={modalCircumference}
                          strokeDashoffset={modalStrokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id={modalGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="50%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                          {currentProb}%
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {simResult ? 'Simulated' : 'Baseline'}
                        </span>
                      </div>
                    </div>
                    {simResult && simResult.delta_pct !== 0 && (
                      <span className={`text-xs font-bold font-mono px-3 py-0.5 rounded-full mt-2 ${
                        simResult.delta_pct > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                      }`}>
                        {simResult.delta_pct > 0 ? '+' : ''}{simResult.delta_pct}% from baseline
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                    {data.readiness_summary}
                  </p>
                </div>

                {/* Profile Snapshot Factors */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Evaluated Profile Metrics:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-600" /> CGPA
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {data.features.cgpa.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-500" /> Backlogs
                      </span>
                      <span className={`text-xs font-mono font-bold ${
                        data.features.active_backlogs === 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {data.features.active_backlogs}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Code2 className="w-3 h-3 text-indigo-600" /> Skills
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {data.features.skills_count}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-emerald-600" /> Projects
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {data.features.projects_count}
                      </span>
                    </div>
                  </div>

                  {!data.has_academic_profile && onOpenProfile && (
                    <button
                      onClick={() => {
                        setIsModalOpen(false)
                        onOpenProfile()
                      }}
                      className="mt-3 w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Complete Academic Profile for Higher Accuracy</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Prescriptive Actions & Preset Buttons (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Prescriptive Action Plan
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">Sorted by Impact</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {data.prescriptive_actions.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          All Key Benchmarks Cleared!
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Your profile satisfies top-tier criteria. Focus on speed in coding and mock rounds.
                        </p>
                      </div>
                    ) : (
                      data.prescriptive_actions.map((action, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50/80 hover:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition-all flex items-start justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                action.impact_tier === 'High'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300'
                              }`}>
                                {action.impact_tier} Impact
                              </span>
                              <span className="text-[9px] font-mono text-slate-500">
                                {action.category}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {action.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                              {action.description}
                            </p>
                          </div>

                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-1 rounded-lg shrink-0 flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" />
                            +{action.probability_gain_pct}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                {data.what_if_scenarios.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Quick Improvement Presets:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.what_if_scenarios.map((scenario) => {
                        const isSelected = selectedPresetId === scenario.id
                        return (
                          <button
                            key={scenario.id}
                            onClick={() => handlePresetSelect(scenario)}
                            className={`text-xs px-2.5 py-1 rounded-xl border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <span>{scenario.title}</span>
                            <span className={`text-[10px] font-mono font-bold ${
                              isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              +{scenario.delta_pct}%
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Interactive Sliders Section */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Custom What-If Sensitivity Sliders
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Drag sliders to instantly preview simulated placement probability
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetSimulator}
                  className="self-start sm:self-center text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Baseline
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CGPA Slider */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target CGPA</label>
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                      {simCgpa.toFixed(1)} / 10.0
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5.0"
                    max="10.0"
                    step="0.1"
                    value={simCgpa}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setSimCgpa(val)
                      setSelectedPresetId(null)
                      runCustomSimulation(val, simBacklogs, simSkills, simProjects, simCerts)
                    }}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5.0</span>
                    <span>Current: {data.features.cgpa.toFixed(1)}</span>
                    <span>10.0</span>
                  </div>
                </div>

                {/* Backlogs Slider */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Backlogs</label>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      simBacklogs === 0
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10'
                        : 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10'
                    }`}>
                      {simBacklogs} Backlogs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={simBacklogs}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setSimBacklogs(val)
                      setSelectedPresetId(null)
                      runCustomSimulation(simCgpa, val, simSkills, simProjects, simCerts)
                    }}
                    className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 (Eligible)</span>
                    <span>6 Backlogs</span>
                  </div>
                </div>

                {/* Skills Slider */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Skills Count</label>
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                      {simSkills} Skills
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={simSkills}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setSimSkills(val)
                      setSelectedPresetId(null)
                      runCustomSimulation(simCgpa, simBacklogs, val, simProjects, simCerts)
                    }}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span>Current: {data.features.skills_count}</span>
                    <span>15 Skills</span>
                  </div>
                </div>

                {/* Projects Slider */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Projects Count</label>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      {simProjects} Projects
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={simProjects}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setSimProjects(val)
                      setSelectedPresetId(null)
                      runCustomSimulation(simCgpa, simBacklogs, simSkills, val, simCerts)
                    }}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span>Current: {data.features.projects_count}</span>
                    <span>8 Projects</span>
                  </div>
                </div>

                {/* Certifications Slider */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Certifications</label>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      {simCerts} Certs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={simCerts}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setSimCerts(val)
                      setSelectedPresetId(null)
                      runCustomSimulation(simCgpa, simBacklogs, simSkills, simProjects, val)
                    }}
                    className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span>Current: {data.features.certifications_count}</span>
                    <span>6 Certs</span>
                  </div>
                </div>

                {/* Simulation Output Card */}
                <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-indigo-950/60 dark:to-slate-900/90 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Live Simulation</span>
                    {simulating && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 animate-pulse font-mono">Simulating...</span>
                    )}
                  </div>
                  <div className="my-1 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500">Output Probability</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {simResult ? simResult.simulated_probability : data.base_probability}%
                      </p>
                    </div>
                    {simResult && (
                      <span className={`text-xs font-mono font-bold ${
                        simResult.delta_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {simResult.delta_pct >= 0 ? '+' : ''}{simResult.delta_pct}%
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    Status: <strong className="text-slate-900 dark:text-white">{simResult ? simResult.simulated_readiness_tier : data.readiness_tier}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Real-time predictions calculated with scikit-learn ML model
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
