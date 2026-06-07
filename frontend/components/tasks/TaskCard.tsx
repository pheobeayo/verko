"use client";

import { Clock, Users, CheckCircle, AlertTriangle, RefreshCw, X, ShieldCheck } from "lucide-react";
import { Task, TaskStatus, VERIFICATION_METHOD_LABEL } from "@/types/contract";
import {
  formatDeadline, formatGDollar, capacityPercent,
  spotsLeft, canJoin, shortAddress, isExpired, effectiveStatusLabel,
} from "@/lib/taskUtils";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { useCloseTask } from "@/hooks/useCloseTask";
import { useSettlePastTask } from "@/hooks/useSettlePastTask";
import { useJoinTask } from "@/hooks/useJoinTask";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
}

const STATUS_BADGE: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  [TaskStatus.Open]:       { bg: "bg-[var(--brown-100)]",           text: "text-[var(--brown-700)]",  dot: "bg-[var(--brown-500)]"  },
  [TaskStatus.InProgress]: { bg: "bg-[var(--cream-300)]",           text: "text-[var(--brown-800)]",  dot: "bg-[var(--brown-400)]"  },
  [TaskStatus.Completed]:  { bg: "bg-[rgba(74,124,89,0.12)]",       text: "text-[var(--success)]",    dot: "bg-[var(--success)]"    },
  [TaskStatus.Cancelled]:  { bg: "bg-[var(--brown-50)]",            text: "text-[var(--text-muted)]", dot: "bg-[var(--brown-300)]"  },
  [TaskStatus.Disputed]:   { bg: "bg-[rgba(139,58,42,0.12)]",       text: "text-[var(--error)]",      dot: "bg-[var(--error)]"      },
  [TaskStatus.Extended]:   { bg: "bg-[var(--cream-200)]",           text: "text-[var(--brown-600)]",  dot: "bg-[var(--brown-400)]"  },
  [TaskStatus.Past]:       { bg: "bg-[var(--bg-secondary)]",        text: "text-[var(--text-muted)]", dot: "bg-[var(--brown-300)]"  },
  [TaskStatus.Closed]:     { bg: "bg-[var(--brown-50)]",            text: "text-[var(--text-muted)]", dot: "bg-[var(--brown-200)]"  },
};

const STATUS_BAR: Record<TaskStatus, string> = {
  [TaskStatus.Open]:       "from-[var(--brown-400)] to-[var(--brown-300)]",
  [TaskStatus.InProgress]: "from-[var(--brown-500)] to-[var(--brown-400)]",
  [TaskStatus.Completed]:  "from-[var(--success)] to-[rgba(74,124,89,0.6)]",
  [TaskStatus.Cancelled]:  "from-[var(--brown-200)] to-[var(--brown-100)]",
  [TaskStatus.Disputed]:   "from-[var(--error)] to-[rgba(139,58,42,0.6)]",
  [TaskStatus.Extended]:   "from-[var(--brown-300)] to-[var(--cream-300)]",
  [TaskStatus.Past]:       "from-[var(--brown-200)] to-[var(--brown-100)]",
  [TaskStatus.Closed]:     "from-[var(--brown-100)] to-[var(--brown-50)]",
};

const CATEGORY_EMOJI: Record<string, string> = {
  "Surveys & Research":    "📋",
  "Photo Verification":    "📸",
  "Content & Translation": "✍️",
  "Community Outreach":    "📣",
  "Mystery Shopping":      "🔍",
  "AI Training Data":      "🎙️",
  "Data Labelling":        "🏷️",
  "Other":                 "📦",
};

export default function TaskCard({ task, onView }: TaskCardProps) {
  const { address } = useAccount();
  const router      = useRouter();

  const pct         = capacityPercent(task);
  const spots       = spotsLeft(task);
  const joinable    = canJoin(task);
  const expired     = isExpired(task.deadline);
  const badge       = STATUS_BADGE[task.status] ?? STATUS_BADGE[TaskStatus.Open];
  const statusLabel = effectiveStatusLabel(task);

  const isPast = (
    expired && (
      task.status === TaskStatus.Open ||
      task.status === TaskStatus.InProgress ||
      task.status === TaskStatus.Extended
    )
  ) || task.status === TaskStatus.Past;

  const isPoster = !!address && address.toLowerCase() === task.poster.toLowerCase();

  // Check if wallet is GoodDollar verified
  const { data: isGDVerified } = useReadContract({
    address: CONTRACT_ADDRESSES.taskContract as `0x${string}`,
    abi: abi as any,
    functionName: "isWorkerVerified",
    args: [address],
    query: { enabled: !!address },
  });

  const { closeTask,      isWriting: isClosing  } = useCloseTask();
  const { settlePastTask, isWriting: isSettling } = useSettlePastTask();
  const { joinTask,       isWriting: isJoining  } = useJoinTask();

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    joinTask(task.id);
  };

  const handleSettle = (e: React.MouseEvent) => {
    e.stopPropagation();
    settlePastTask(task.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeTask(task.id);
  };

  return (
    <div
      className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--brown-300)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden"
      onClick={() => onView(task)}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${STATUS_BAR[task.status] ?? STATUS_BAR[TaskStatus.Open]}`} />

      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{CATEGORY_EMOJI[task.category] ?? "📦"}</span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
              {statusLabel}
            </span>
          </div>

          {task.isPaid ? (
            <div className="shrink-0 text-right">
              <div
                className="text-base font-black text-[var(--brown-500)]"
                style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
              >
                {formatGDollar(task.bountyPerWorker)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                per worker
              </div>
            </div>
          ) : (
            <span
              className="text-[10px] text-[var(--text-muted)] px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--brown-50)]"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              Volunteer
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-bold text-[var(--text-heading)] line-clamp-2"
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}
        >
          {task.title}
        </h3>

        {/* Description */}
        <p
          className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed flex-1"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}
        >
          {task.description}
        </p>

        {/* Category chip */}
        <span
          className="text-[10px] font-medium text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] w-fit"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}
        >
          {task.category}
        </span>

        {/* Extension badge */}
        {task.extensionCount > 0 && (
          <span
            className="text-[10px] font-medium text-[var(--brown-600)] px-2 py-0.5 rounded-full bg-[var(--cream-200)] w-fit"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}
          >
            🔁 Extended ×{task.extensionCount}
          </span>
        )}

        {/* Capacity bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              <Users className="w-3 h-3 inline mr-1" />
              {task.currentWorkers}/{task.maxWorkers} workers
            </span>
            {joinable && (
              <span className="text-[10px] font-medium text-[var(--success)]" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                {spots} spot{spots !== 1 ? "s" : ""} left
              </span>
            )}
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 90 ? "bg-[var(--error)]"
                : pct >= 70 ? "bg-[var(--brown-400)]"
                : "bg-[var(--brown-300)]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div
            className={`flex items-center gap-1 text-[10px] ${expired ? "text-[var(--error)]" : "text-[var(--text-muted)]"}`}
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}
          >
            {expired ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {formatDeadline(task.deadline)}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            <CheckCircle className="w-3 h-3" />
            {task.approvedCount} approved
          </div>
        </div>

        {/* Worker actions */}
        {address && !isPoster && joinable && (
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2">
            {isGDVerified ? (
              // GoodDollar verified — show Join button
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-600)] transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                <Users className="w-3.5 h-3.5" />
                {isJoining ? "Joining…" : "Join Task"}
              </button>
            ) : (
              // Not GoodDollar verified — show Verify button
              <button
                onClick={(e) => { e.stopPropagation(); router.push("/verify"); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-[var(--brown-400)] text-[var(--brown-500)] hover:bg-[var(--brown-50)] transition-colors"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify with GoodDollar to Join
              </button>
            )}
          </div>
        )}

        {/* Poster action buttons */}
        {isPoster && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {isPast && task.status !== TaskStatus.Past && task.status !== TaskStatus.Closed && (
              <button
                onClick={handleSettle}
                disabled={isSettling}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--brown-300)] text-[var(--brown-600)] hover:bg-[var(--brown-50)] transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                <RefreshCw className={`w-3 h-3 ${isSettling ? "animate-spin" : ""}`} />
                {isSettling ? "Settling…" : "Settle & Refund"}
              </button>
            )}
            {(task.status === TaskStatus.Completed ||
              task.status === TaskStatus.Cancelled ||
              task.status === TaskStatus.Past) && (
              <button
                onClick={handleClose}
                disabled={isClosing}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                <X className="w-3 h-3" />
                {isClosing ? "Closing…" : "Close Task"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom strip */}
      <div className="px-5 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)]/40 flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          via {VERIFICATION_METHOD_LABEL[task.verificationMethod]}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          by {shortAddress(task.poster)}
        </span>
      </div>
    </div>
  );
}