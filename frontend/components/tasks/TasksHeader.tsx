"use client";

import { Plus, Zap, Shield, Star } from "lucide-react";

interface TasksHeaderProps {
  onCreateTask: () => void;
  totalTasks: number;
  openTasks: number;
}

export default function TasksHeader({ onCreateTask, totalTasks, openTasks }: TasksHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Page title row */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div
            className="text-xs font-bold uppercase tracking-widest text-[var(--brown-400)] mb-1.5"
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            Task Marketplace
          </div>
          <h1
            className="font-bold text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-telegraf), 'Space Grotesk', sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            }}
          >
            Browse Tasks
          </h1>
          <p
            className="text-sm text-[var(--text-muted)] mt-1 max-w-lg"
            style={{ fontFamily: "var(--font-roboto), sans-serif" }}
          >
            {openTasks} open task{openTasks !== 1 ? "s" : ""} available. Complete work, submit proof, earn G$ instantly.
          </p>
        </div>

        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-600)] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          <Plus className="w-4 h-4" />
          Post a Task
        </button>
      </div>

      {/* Quick trust signals */}
      <div className="flex gap-3 flex-wrap">
        {[
          {
            icon: <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
            label: "All workers face-verified",
            bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
          },
          {
            icon: <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
            label: "Instant G$ payout on approval",
            bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
          },
          {
            icon: <Star className="w-3.5 h-3.5 text-[var(--brown-500)]" />,
            label: "On-chain reputation NFT",
            bg: "bg-[var(--brown-50)] dark:bg-[var(--brown-900)]/20 border-[var(--brown-200)] dark:border-[var(--brown-800)]",
          },
        ].map((chip, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-[var(--text-secondary)] ${chip.bg}`}
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            {chip.icon}
            {chip.label}
          </div>
        ))}
      </div>
    </div>
  );
}
