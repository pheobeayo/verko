"use client";

import { useState } from "react";
import {
  Coins, X, Loader2, CheckCircle2,
  ExternalLink, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { useGoodDollarClaim } from "@/hooks/useGoodDollarClaim";
import { useIdentityContext } from "@/context/IdentityContext";

function formatNextClaim(date: Date | null): string {
  if (!date) return "tomorrow";
  const now   = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH  = Math.floor(diffMs / 1000 / 60 / 60);
  const diffM  = Math.floor((diffMs / 1000 / 60) % 60);
  if (diffH <= 0 && diffM <= 0) return "soon";
  if (diffH === 0) return `${diffM}m`;
  return `${diffH}h ${diffM}m`;
}

export function ClaimBanner() {
  const { isVerified } = useIdentityContext();
  const {
    status, claimable, nextClaim, txHash,
    canClaim, isClaiming, claimedToday, isLoading,
    claim, checkStatus,
  } = useGoodDollarClaim();

  const [expanded, setExpanded]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isVerified) return null;
  if (isLoading || status === "not_eligible" || dismissed) return null;
  if (status === "error") return null;

  //  Claimed today 
  if (claimedToday) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 sm:px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--success)] shrink-0">
            <CheckCircle2 size={14} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="min-w-0">
            <p
              className="text-[12px] font-bold text-[var(--text-heading)] leading-tight truncate"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              {status === "success" ? `Claimed ${claimable} G$ today` : "G$ claimed today ✓"}
            </p>
            <p
              className="text-[11px] text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}
            >
              Next claim in {formatNextClaim(nextClaim)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {txHash && (
            <a
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[var(--brown-400)] hover:text-[var(--brown-600)] transition-colors"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}
            >
              <ExternalLink size={10} />
              Celoscan
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--brown-100)] transition-colors cursor-pointer shrink-0"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // Collapsed — can claim 
  if (!expanded) {
    return (
      <div className="rounded-2xl border border-[var(--brown-200)] bg-[var(--brown-50)] p-3.5 sm:px-4 sm:py-3.5 transition-all duration-200">
        <div className="flex items-start sm:items-center gap-3">
          {/* Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brown-500)] shrink-0">
            <Coins size={16} strokeWidth={2.5} className="text-[var(--cream-100)]" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] font-bold text-[var(--text-heading)] leading-tight"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              Your daily G$ is ready to claim
              {claimable !== "0" && (
                <span className="ml-1.5 text-[var(--brown-500)]">{claimable} G$</span>
              )}
            </p>
            <p
              className="text-[11.5px] text-[var(--text-muted)] mt-0.5"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}
            >
              Claim your GoodDollar UBI — free every day.
            </p>
          </div>

          {/* Expand + Dismiss — top row on mobile */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(true)}
              aria-label="Learn more"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--brown-100)] transition-colors cursor-pointer"
            >
              <ChevronDown size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss claim banner"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--brown-100)] transition-colors cursor-pointer"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Claim CTA — full width on mobile, inline on sm+ */}
        <button
          onClick={claim}
          disabled={isClaiming}
          className="
            mt-3 sm:mt-0 sm:ml-12
            w-full sm:w-auto
            inline-flex items-center justify-center gap-1.5 rounded-full
            bg-[var(--brown-500)] text-[var(--cream-100)]
            px-3.5 py-2.5 sm:py-2 text-[12px] sm:text-[11.5px] font-bold
            cursor-pointer select-none
            transition-all duration-150
            hover:bg-[var(--brown-600)] hover:scale-[1.02] hover:shadow-md
            active:scale-[0.98]
            focus:outline-none focus:ring-2 focus:ring-[var(--brown-400)] focus:ring-offset-2
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
          "
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}
        >
          {isClaiming
            ? <><Loader2 size={11} className="animate-spin" /> Claiming…</>
            : <>Claim G$<Coins size={11} strokeWidth={2.5} /></>}
        </button>
      </div>
    );
  }

  // Expanded panel
  return (
    <div className="rounded-2xl border border-[var(--brown-200)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-[0_4px_16px_rgba(45,21,8,0.08)]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brown-500)]">
          <Coins size={18} strokeWidth={2.5} className="text-[var(--cream-100)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] leading-tight"
            style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
          >
            Claim your daily G$
          </h3>
          <p
            className="text-[12px] sm:text-[12.5px] text-[var(--text-muted)] mt-1 leading-relaxed"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}
          >
            GoodDollar is a Universal Basic Income protocol. As a verified member
            you receive G$ every day — use it to participate in tasks or hold it
            in your wallet.
          </p>
        </div>
        <button
          onClick={() => setExpanded(false)}
          aria-label="Collapse"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--brown-50)] transition-colors cursor-pointer"
        >
          <ChevronUp size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Amount pill */}
      {claimable !== "0" && (
        <div className="flex items-center justify-center gap-3 rounded-xl p-4 mb-4 border border-[var(--brown-200)] bg-[var(--brown-50)]">
          <div className="text-center">
            <p
              className="text-[1.9rem] sm:text-[2.2rem] font-black text-[var(--brown-500)] leading-none"
              style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
            >
              {claimable}
            </p>
            <p
              className="text-[11px] sm:text-[12px] font-bold text-[var(--text-muted)] mt-1"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}
            >
              G$ available today
            </p>
          </div>
        </div>
      )}

      {/* Claim button */}
      <button
        onClick={claim}
        disabled={isClaiming}
        className="
          w-full flex items-center justify-center gap-2 rounded-xl
          bg-[var(--brown-500)] text-[var(--cream-100)]
          px-4 py-3 text-[13px] font-bold
          cursor-pointer select-none
          transition-all duration-150
          hover:bg-[var(--brown-600)] hover:scale-[1.01] hover:shadow-md
          active:scale-[0.99]
          focus:outline-none focus:ring-2 focus:ring-[var(--brown-400)] focus:ring-offset-2
          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
        "
        style={{ fontFamily: "var(--font-nunito),sans-serif" }}
      >
        {isClaiming
          ? <><Loader2 size={15} className="animate-spin" /> Confirming in wallet…</>
          : <><Coins size={15} /> Claim {claimable !== "0" ? `${claimable} ` : ""}G$ now</>}
      </button>

      {/* Refresh + info — stacks on mobile */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <button
          onClick={checkStatus}
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--brown-500)] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}
        >
          <RefreshCw size={10} />
          Refresh status
        </button>
        <a
          href="https://www.gooddollar.org"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--brown-400)] transition-colors"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}
        >
          <ExternalLink size={10} />
          About GoodDollar UBI
        </a>
      </div>
    </div>
  );
}