"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity";
import { toast } from "sonner";

export default function VerifyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const {
    status, isVerified, fvLink,
    isGeneratingLink, setIsVerifying, refresh,
  } = useGoodDollarIdentity();

  const redirected = useRef(false);

  // Start verification polling on mount
  useEffect(() => {
    setIsVerifying(true);
    return () => setIsVerifying(false);
  }, [setIsVerifying]);

 
  useEffect(() => {
    if (!isVerified || redirected.current) return;
    redirected.current = true;
    toast.success(
      "GoodDollar verified! You can now join tasks on Verko 🎉",
      { position: "top-center" }
    );
    setTimeout(() => router.replace("/tasks"), 1500);
  }, [isVerified, router]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p
          className="text-sm text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}
        >
          Please connect your wallet first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold text-[var(--text-heading)] mb-1"
            style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
          >
            Verify with GoodDollar
          </h1>
          <p
            className="text-sm text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}
          >
            Complete face verification to join tasks on Verko. Once you are
            GoodDollar-verified, you can join tasks immediately — no extra steps needed.
          </p>
        </div>

        {/* Status pill */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            status === "verified"
              ? "bg-[rgba(74,124,89,0.1)] text-[var(--success)] border-[rgba(74,124,89,0.3)]"
              : status === "error"
              ? "bg-[rgba(139,58,42,0.1)] text-[var(--error)] border-[rgba(139,58,42,0.3)]"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]"
          }`}
        >
          {status === "verified" && <CheckCircle2 className="w-3.5 h-3.5" />}
          {status === "error"    && <AlertCircle  className="w-3.5 h-3.5" />}
          {(status === "loading" || status === "not_verified") && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          {status === "verified"
            ? "Verified — redirecting to tasks…"
            : status === "error"
            ? "Verification error — try again"
            : status === "loading"
            ? "Checking GoodDollar status…"
            : "Complete face verification below"}
        </div>

        {/* iframe or states */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {status === "verified" ? (
            <div className="flex h-[30vh] items-center justify-center gap-3 text-sm text-[var(--success)]">
              <CheckCircle2 className="w-5 h-5" />
              Verified! Redirecting to tasks…
            </div>
          ) : isGeneratingLink ? (
            <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing GoodDollar verification…
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

        {/* Open in new tab + manual check */}
        {fvLink && status !== "verified" && (
          <div className="flex items-center gap-3 flex-wrap">
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
              Check status manually
            </button>
          </div>
        )}

        <p
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}
        >
          Wallet: {address?.slice(0, 6)}…{address?.slice(-4)} · Powered by
          GoodDollar · Celo Mainnet
        </p>
      </div>
    </div>
  );
}