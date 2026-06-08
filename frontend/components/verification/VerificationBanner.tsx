"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck, X, ExternalLink, RefreshCw } from "lucide-react";
import { useIdentityContext } from "@/context/IdentityContext";

export function VerificationBanner() {
  const {
    isVerified,
    isLoading,
    fvLink,
    isVerifying,
    status,
    setIsVerifying,
  } = useIdentityContext();

  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isVerified || isLoading || dismissed) return null;
  if (status === "error" && !isVerifying) return null;

  // ── Collapsed pill ────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--brown-200)] bg-[var(--brown-50)] p-4 transition-all duration-200">
        {/* Icon */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brown-500)]">
          <ShieldCheck size={16} strokeWidth={2.5} className="text-[var(--cream-100)]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--text-heading)] leading-tight"
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
            Verify with GoodDollar to join tasks
          </p>
          <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            One-time face verification — proves you are a unique human.
          </p>
        </div>

        {/* Verify CTA */}
        <button
          onClick={() => { setExpanded(true); setIsVerifying(true); }}
          className="
            inline-flex items-center gap-1.5 rounded-full
            bg-[var(--brown-500)] text-[var(--cream-100)]
            px-3.5 py-2 text-[11.5px] font-bold
            cursor-pointer select-none flex-shrink-0
            border-2 border-transparent
            transition-all duration-150
            hover:bg-[var(--brown-600)] hover:scale-[1.03] hover:shadow-md
            active:scale-[0.97] active:shadow-none
            focus:outline-none focus:ring-2 focus:ring-[var(--brown-400)] focus:ring-offset-2
          "
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}
          title="Click to start GoodDollar face verification"
        >
          Verify now
          <ArrowRight size={11} strokeWidth={2.8} />
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss verification banner"
          className="
            flex h-7 w-7 flex-shrink-0 items-center justify-center
            rounded-full text-[var(--text-muted)]
            cursor-pointer
            transition-all duration-150
            hover:bg-[var(--brown-100)] hover:text-[var(--brown-600)]
            active:scale-95
            focus:outline-none focus:ring-2 focus:ring-[var(--brown-300)]
          "
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-[var(--brown-200)] bg-[var(--bg-card)] p-5 shadow-[0_4px_16px_rgba(45,21,8,0.08)] transition-all duration-200">

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brown-500)]">
          <ShieldCheck size={18} strokeWidth={2.5} className="text-[var(--cream-100)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-bold text-[var(--text-heading)] leading-tight"
            style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
            Verify with GoodDollar
          </h3>
          <p className="text-[12.5px] text-[var(--text-muted)] mt-1 leading-relaxed"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            GoodDollar uses face verification to prove you are a unique human.
            One-time setup — after verifying, you can join any task on Verko instantly.
          </p>
        </div>
        <button
          onClick={() => { setExpanded(false); setIsVerifying(false); }}
          aria-label="Close verification panel"
          className="
            flex h-7 w-7 flex-shrink-0 items-center justify-center
            rounded-full text-[var(--text-muted)]
            cursor-pointer
            transition-all duration-150
            hover:bg-[var(--brown-100)] hover:text-[var(--brown-600)]
            active:scale-95
            focus:outline-none focus:ring-2 focus:ring-[var(--brown-300)]
          "
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Link / loading / error */}
      {status === "error" ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            Failed to generate verification link.
          </p>
          <button
            onClick={() => setIsVerifying(true)}
            className="
              inline-flex items-center gap-2 rounded-xl
              bg-[var(--brown-500)] text-[var(--cream-100)]
              px-4 py-2 text-[12px] font-bold
              cursor-pointer
              transition-all duration-150
              hover:bg-[var(--brown-600)] hover:scale-[1.02]
              active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-[var(--brown-400)] focus:ring-offset-2
            "
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}
          >
            <RefreshCw size={12} strokeWidth={2.5} />
            Try again
          </button>
        </div>
      ) : !fvLink ? (
        <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
          Preparing verification link…
        </div>
      ) : (
        <div className="space-y-3">
          <a
            href={fvLink}
            target="_blank"
            rel="noreferrer"
            className="
              flex items-center justify-center gap-2 w-full rounded-xl
              bg-[var(--brown-500)] text-[var(--cream-100)]
              px-4 py-3 text-[13px] font-bold
              cursor-pointer select-none
              transition-all duration-150
              hover:bg-[var(--brown-600)] hover:scale-[1.01] hover:shadow-md
              active:scale-[0.99] active:shadow-none
              focus:outline-none focus:ring-2 focus:ring-[var(--brown-400)] focus:ring-offset-2
            "
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            title="Opens GoodDollar face verification in a new tab"
          >
            Open GoodDollar verification
            <ExternalLink size={13} strokeWidth={2.5} />
          </a>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />
              Checking status… this page will update automatically once verified.
            </div>
          )}
        </div>
      )}

      {/* Bullet points */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
        <BulletPoint text="One-time setup, takes about 2 minutes" />
        <BulletPoint text="Proves you are a unique human — no duplicates, no bots" />
        <BulletPoint text="Privacy-preserved — face becomes a cryptographic hash" />
      </div>
    </div>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Check size={12} strokeWidth={3} className="mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} />
      <span className="text-[11.5px] text-[var(--text-muted)] leading-tight"
        style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
        {text}
      </span>
    </div>
  );
}