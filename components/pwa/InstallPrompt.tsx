"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to prevent hydration mismatch / flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Run only on client
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Check if dismissed previously
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS doesn't support beforeinstallprompt, so we just show our custom banner
      setShowPrompt(true);
    } else {
      // For Android/Chrome, wait for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Show anyway as a fallback for Android after 3 seconds if event hasn't fired
      // (some browsers might not fire it reliably)
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        clearTimeout(timer);
      };
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback if beforeinstallprompt didn't fire but they clicked Install anyway
      alert("To install, tap the 3-dot menu in your browser and select 'Install app' or 'Add to Home screen'.");
      return;
    }
    
    // Show the native prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    // We've used the prompt, and can't use it again until it's fired again
    setDeferredPrompt(null);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="rounded-2xl border border-teal-500/20 bg-[#1a1a24]/95 backdrop-blur-xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Install StudySync</h3>
              <p className="text-xs text-white/60">Get the full mobile app experience</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-white/40 hover:text-white transition-colors shrink-0 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-2 rounded-xl bg-black/40 p-3 text-sm text-white/80 border border-white/5">
            <p className="flex items-center gap-2 mb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs font-medium">1</span>
              Tap the <Share className="h-4 w-4 text-teal-400 mx-0.5" /> Share button
            </p>
            <p className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs font-medium">2</span>
              Select <PlusSquare className="h-4 w-4 text-teal-400 mx-0.5" /> Add to Home Screen
            </p>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="mt-2 w-full rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-400 transition-colors shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
