"use client";
import { Wallet, TrendingUp, Clock, ArrowDownLeft } from "lucide-react";

const MOCK_TXS: never[] = [];

const STATS = [
  { icon: <Wallet className="w-5 h-5" />,     label: "Total Earned",     value: "0 G$", color: "#c47a3a" },
  { icon: <TrendingUp className="w-5 h-5" />, label: "This Month",       value: "0 G$", color: "#34d399" },
  { icon: <Clock className="w-5 h-5" />,      label: "Pending Approval", value: "0 G$", color: "#fbbf24" },
];

export default function EarningsPage() {
  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <h2
          className="font-bold text-xl text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
        >
          Earnings
        </h2>
        <p className="text-xs mt-1 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto)" }}>
          Your G$ payment history and balance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] p-5 flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${s.color}18`, color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p
                className="font-bold text-xl leading-none text-[var(--text-heading)]"
                style={{ fontFamily: "var(--font-telegraf)" }}
              >
                {s.value}
              </p>
              <p className="text-xs mt-1 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto)" }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <ArrowDownLeft className="w-4 h-4 text-[var(--text-muted)]" />
          <p
            className="font-semibold text-sm text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-telegraf)" }}
          >
            Payment History
          </p>
        </div>

        {MOCK_TXS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)]">
              <Wallet className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
            <p
              className="font-semibold text-sm text-[var(--text-heading)]"
              style={{ fontFamily: "var(--font-telegraf)" }}
            >
              No payments yet
            </p>
            <p
              className="text-xs text-center max-w-xs text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto)" }}
            >
              Complete tasks and get approved to start earning G$. Payments appear here instantly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}