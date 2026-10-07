import React, { useState, useEffect } from 'react'
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface InstallPromptProps {
  variant?: 'button' | 'banner'
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ variant = 'button' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    // Check if running inside installed standalone app
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(checkStandalone)

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowIosModal(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (isIos) {
      setShowIosModal(true)
    } else {
      // Fallback instructions for desktop or browsers that don't emit event
      alert('To install this app on your device:\n\n• Chrome/Edge (Desktop): Click the install icon (⊕) in the browser address bar.\n• Android/Chrome: Tap Chrome menu (⋮) -> "Install App" or "Add to Home Screen".\n• Safari (iOS): Tap the Share button (⎋) -> "Add to Home Screen".')
    }
  }

  // If already running in installed app mode, do not show install prompt
  if (isStandalone) {
    return null
  }

  // Header Button Variant
  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title="Install Placement Portal App"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm hover:from-indigo-700 hover:to-indigo-800 transition active:scale-95 cursor-pointer border border-indigo-500/30"
        >
          {installed ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Installed</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">App</span>
            </>
          )}
        </button>

        {/* iOS Install Guide Modal */}
        {showIosModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    WP
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Install on iPhone / iPad</h3>
                    <p className="text-xs text-slate-500">Run as a standalone app</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIosModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="flex-1">
                    Tap the <strong>Share</strong> button <Share className="inline w-3.5 h-3.5 text-indigo-600 mx-1" /> in Safari's bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 text-indigo-600 mx-1" />.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="flex-1">
                    Tap <strong>Add</strong> in the top-right corner to place the app on your home screen.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIosModal(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Floating Banner Variant
  if (bannerDismissed || installed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-indigo-100 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
          WP
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate">
            Install Waqqas's Placement Portal
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Fast access from your home screen or desktop with notifications and full offline support.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Install App</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-800 rounded-lg transition"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={() => setBannerDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
