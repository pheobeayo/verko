"use client";

import { Task, TaskStatus } from "@/types/contract";
import { shortAddress, formatGDollar } from "@/lib/taskUtils";
import { CATEGORY_EMOJI, STATUS_BADGE, STATUS_BAR } from "./taskDetailConstants";

interface Props {
  task: Task;
}

export function TaskDetailHeader({ task }: Props) {
  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE[TaskStatus.Open];

  return (
    <>
      {/* Status accent bar */}
      <div className={`h-1 w-full rounded-full bg-gradient-to-r ${STATUS_BAR[task.status] ?? STATUS_BAR[TaskStatus.Open]}`} />

      {/* Header row */}
      <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
        <span className="text-3xl mt-1">{CATEGORY_EMOJI[task.category] ?? "📦"}</span>

        <div className="flex-1 min-w-0">
          {/* Status chips */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
              {TaskStatus[task.status]}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              Task #{task.id.toString()}
            </span>
            {task.extensionCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--cream-200)] text-[var(--brown-600)]"
                style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                🔁 Extended ×{task.extensionCount}
              </span>
            )}
          </div>

          <h1 className="font-bold text-[clamp(1.3rem,3vw,1.8rem)] text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
            {task.title}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            Posted by {shortAddress(task.poster)} · {task.category}
          </p>
        </div>

        {/* Bounty pill */}
        {task.isPaid ? (
          <div className="w-full sm:w-auto sm:shrink-0 px-5 py-3 rounded-[16px] border border-[var(--border)] bg-[var(--brown-50)] sm:text-right">
            <p className="text-2xl font-black text-[var(--brown-500)]"
              style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
              {formatGDollar(task.bountyPerWorker)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              per worker · instant payout
            </p>
          </div>
        ) : (
          <div className="w-full sm:w-auto sm:shrink-0 px-4 py-3 rounded-[16px] border border-[var(--border)] bg-[var(--bg-secondary)]">
            <p className="text-sm font-bold text-[var(--text-muted)] text-center"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              🌱 Volunteer
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 text-center"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              No payment
            </p>
          </div>
        )}
      </div>
    </>
  );
}