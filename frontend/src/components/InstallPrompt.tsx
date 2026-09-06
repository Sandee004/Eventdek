import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("eventdek_pwa_dismissed") === "true";
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Don't pester them again for the rest of this session
    sessionStorage.setItem("eventdek_pwa_dismissed", "true");
  };

  return (
    <aside
      aria-label="Install EventDek"
      className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-going/10 border border-going/20 text-going">
            <Download className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              Install EventDek
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Swipe faster & view passes offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="tactile rounded-lg bg-going px-3 py-1.5 text-xs font-bold text-going-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="tactile grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
