"use client";
import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { CheckCircle2, Clock, AlertTriangle, ListChecks } from "lucide-react";

type Tab = "joined" | "submitted" | "approved" | "posted";

const TAB_CONFIG: { value: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { value:"joined",    label:"Joined",    icon:<Clock       className="w-3.5 h-3.5" />, color:"#c47a3a" },
  { value:"submitted", label:"Submitted", icon:<ListChecks  className="w-3.5 h-3.5" />, color:"#a78bfa" },
  { value:"approved",  label:"Approved",  icon:<CheckCircle2 className="w-3.5 h-3.5" />, color:"#34d399" },
  { value:"posted",    label:"Posted",    icon:<AlertTriangle className="w-3.5 h-3.5" />, color:"#fbbf24" },
];

const STAT_CARDS = [
  { label:"Tasks Joined", value:0,   color:"#c47a3a" },
  { label:"Submitted",    value:0,   color:"#a78bfa" },
  { label:"Approved",     value:0,   color:"#34d399" },
  { label:"G$ Earned",    value:"0", color:"#fbbf24" },
];

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)]">
        <ListChecks className="w-5 h-5 text-[var(--text-muted)]" />
      </div>
      <p className="font-semibold text-sm text-[var(--text-heading)]"
        style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
        No {label} tasks yet
      </p>
      <p className="text-xs text-center max-w-xs text-[var(--text-muted)]"
        style={{ fontFamily:"var(--font-roboto)" }}>
        {label === "Posted"
          ? "Tasks you post will appear here. Use Post a Task to get started."
          : "Tasks you work on will appear here once you join and submit proof."}
      </p>
    </div>
  );
}

export default function MyTasks() {
  const [tab, setTab] = useState<Tab>("joined");
  const { address }   = useAppKitAccount();

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <h2 className="font-bold text-xl text-[var(--text-heading)]"
          style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
          My Tasks
        </h2>
        <p className="text-xs mt-1 text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
          Track your work, submissions, and earnings
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="font-bold text-2xl leading-none" style={{ fontFamily:"var(--font-telegraf)", color:s.color }}>
              {s.value}
            </p>
            <p className="text-xs mt-1.5 text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border)] -mb-px">
        {TAB_CONFIG.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer bg-transparent border-x-0 border-t-0"
            style={{
              borderBottomColor: tab === t.value ? t.color : "transparent",
              color:              tab === t.value ? "var(--text-heading)" : "var(--text-muted)",
              fontFamily:         "var(--font-nunito),sans-serif",
            }}>
            <span style={{ color:t.color }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <EmptyTab label={TAB_CONFIG.find(t => t.value === tab)?.label ?? ""} />

    </div>
  );
}