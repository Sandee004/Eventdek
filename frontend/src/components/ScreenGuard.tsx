import { useState, useEffect } from "react";
import { Smartphone, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export function ScreenGuard() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    setCurrentUrl(window.location.href);

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      toast.success("Link copied! Send it to your phone");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="screen-guard-title"
      className="hidden md:flex fixed inset-0 z-[99999] flex-col items-center justify-center bg-background/95 backdrop-blur-xl px-4 py-8 select-none overflow-y-auto"
    >
      <div className="card-frame relative w-full max-w-md rounded-3xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="relative mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-border bg-surface-2 text-going shadow-inner">
          <Smartphone className="size-10" />
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-going opacity-75" />
            <span className="relative inline-flex size-4 rounded-full bg-going" />
          </span>
        </div>

        <span className="inline-block label-caps text-going">
          Mobile Experience Only
        </span>

        <h1
          id="screen-guard-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground"
        >
          Site is customized for smaller screens only. Pls try something smaller
        </h1>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          EventDek is designed and built specifically for smartphones. Please
          open this link on your phone, or shrink your browser window to a mobile
          screen size.
        </p>

        {currentUrl && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/70 p-4">
            <div className="rounded-xl border border-border/70 bg-background p-3 shadow-inner">
              <QRCodeSVG
                value={currentUrl}
                size={140}
                level="M"
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground"
              />
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <QrCode className="size-3.5 text-going" /> Scan with your phone
              camera
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className="tactile flex flex-1 items-center justify-center gap-2 rounded-xl bg-going py-3 text-xs font-bold text-going-foreground shadow-md transition-opacity hover:opacity-90"
          >
            {copied ? (
              <>
                <Check className="size-4" /> Link Copied
              </>
            ) : (
              <>
                <Copy className="size-4" /> Copy Link for Phone
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80">
          <span>Current width: {screenWidth}px</span>
          <span>·</span>
          <span>Target: &lt; 768px</span>
        </div>
      </div>
    </div>
  );
}
