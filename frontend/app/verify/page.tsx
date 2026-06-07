"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity";
import { toast } from "sonner";

export default function VerifyPage() {
  const router  = useRouter();
  const { address, isConnected } = useAccount();
  const {
    status, isVerified, fvLink,
    isGeneratingLink, setIsVerifying, refresh,
  } = useGoodDollarIdentity();

  // Start verification flow on mount
  useEffect(() => {
    setIsVerifying(true);
    return () => setIsVerifying(false);
  }, [setIsVerifying]);

  // Once GoodDollar confirms the wallet is whitelisted → call our backend
  // to call setWorkerVerified on TaskEscrow, then redirect
  useEffect(() => {
    if (!isVerified || !address) return;

    const callBackend = async () => {
      try {
        toast.info("Almost there — registering on Verko…", { position: "top-center" });

        const res = await fetch("/api/verify-worker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        const data = await res.json();

        if (data.success) {
          toast.success("You are now verified on Verko! 🎉", { position: "top-center" });
          // Give toast time to show, then redirect to tasks
          setTimeout(() => router.replace("/tasks"), 1500);
        } else {
          toast.error(data.error ?? "Verification failed", { position: "top-center" });
        }
      } catch (err) {
        console.error("[verify] Backend call failed:", err);
        toast.error("Something went wrong. Please try again.", { position: "top-center" });
      }
    };

    callBackend();
  }, [isVerified, address, router]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Please connect your wallet first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] mb-1"
            style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
            Verify with GoodDollar
          </h1>
          <p className="text-sm text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            Complete face verification to join tasks on Verko. This proves you are a unique human —
            no duplicates, no bots.
          </p>
        </div>

        {/* Status pill */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          status === "verified"
            ? "bg-[rgba(74,124,89,0.1)] text-[var(--success)] border-[rgba(74,124,89,0.3)]"
            : status === "error"
            ? "bg-[rgba(139,58,42,0.1)] text-[var(--error)] border-[rgba(139,58,42,0.3)]"
            : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]"
        }`}>
          {status === "verified" && <CheckCircle2 className="w-3.5 h-3.5" />}
          {status === "error"    && <AlertCircle  className="w-3.5 h-3.5" />}
          {status === "loading"  && <Loader2      className="w-3.5 h-3.5 animate-spin" />}
          {status === "verified"      ? "Verified — redirecting…"
            : status === "error"     ? "Verification error — try again"
            : status === "loading"   ? "Checking status…"
            : "Awaiting verification"}
        </div>

        {/* iFrame or loading state */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {isGeneratingLink ? (
            <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing verification…
            </div>
          ) : fvLink ? (
            <iframe
              src={fvLink}
              title="GoodDollar face verification"
              className="h-[70vh] w-full"
              allow="camera; microphone"
            />
          ) : (
            <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          )}
        </div>

        {/* Open in new tab fallback */}
        {fvLink && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(fvLink, "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in new tab
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              <Loader2 className="w-3.5 h-3.5" />
              Check status
            </button>
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          Your wallet address ({address?.slice(0, 6)}…{address?.slice(-4)}) will be registered
          on-chain once verification is complete. Powered by GoodDollar.
        </p>
      </div>
    </div>
  );
}