"use client";

import { AlertTriangle, Clock, ChevronRight, Loader2, RefreshCw, Users, X } from "lucide-react";
import { Task, TaskStatus } from "@/types/contract";
import { formatDeadline, formatDate, formatGDollar, capacityPercent, isExpired, canJoin } from "@/lib/taskUtils";
import { useJoinTask }       from "@/hooks/useJoinTask";
import { useCloseTask }      from "@/hooks/useCloseTask";
import { useSettlePastTask } from "@/hooks/useSettlePastTask";
import { Card, SectionTitle } from "./TaskDetailUI";

interface Props {
  task:         Task;
  isPoster:     boolean;
  hasJoined:    boolean | undefined;
  isGDVerified: boolean;
  isPast:       boolean;
  setActiveTab: (tab: "details" | "proof") => void;
}

export function TaskDetailSidebar({
  task, isPoster, hasJoined, isGDVerified, isPast, setActiveTab,
}: Props) {
  const pct     = capacityPercent(task);
  const joinable = canJoin(task);

  const { joinTask,       isWriting: isJoining  } = useJoinTask();
  const { closeTask,      isWriting: isClosing  } = useCloseTask();
  const { settlePastTask, isWriting: isSettling } = useSettlePastTask();

  return (
    <div className="flex flex-col gap-4">

      {/* Capacity */}
      <Card className="p-5">
        <SectionTitle>Worker Capacity</SectionTitle>
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            <Users className="w-3.5 h-3.5" />
            {task.currentWorkers}/{task.maxWorkers} joined
          </span>
          <span className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            {task.approvedCount} approved
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)]">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 90 ? "bg-[var(--error)]"
              : pct >= 70 ? "bg-[var(--brown-400)]"
              : "bg-[var(--brown-300)]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {joinable && (
          <p className="text-xs text-[var(--success)] font-medium mt-2"
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
            {task.maxWorkers - task.currentWorkers} spot{task.maxWorkers - task.currentWorkers !== 1 ? "s" : ""} available
          </p>
        )}
      </Card>

      {/* Deadline */}
      <Card className="p-5">
        <SectionTitle>Deadline</SectionTitle>
        <p className={`text-sm font-semibold flex items-center gap-1.5 ${isExpired(task.deadline) ? "text-[var(--error)]" : "text-[var(--text-secondary)]"}`}
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
          {isExpired(task.deadline)
            ? <AlertTriangle className="w-3.5 h-3.5" />
            : <Clock className="w-3.5 h-3.5" />}
          {formatDeadline(task.deadline)}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          {formatDate(task.deadline)}
        </p>
      </Card>

      {/* Worker action */}
      {!isPoster && (
        <Card className="p-5">
          <SectionTitle>Your Action</SectionTitle>
          {hasJoined ? (
            <button onClick={() => setActiveTab("proof")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-400)] transition-colors"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              Submit Your Proof <ChevronRight className="w-4 h-4" />
            </button>
          ) : joinable && isGDVerified ? (
            <button onClick={() => joinTask(task.id)} disabled={isJoining}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-400)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              {isJoining
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                : <><Users className="w-4 h-4" /> Join Task{task.isPaid ? ` · Earn ${formatGDollar(task.bountyPerWorker)}` : ""}</>}
            </button>
          ) : (
            <div className="w-full text-center py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              {!isGDVerified && joinable
                ? "GoodDollar verification required"
                : isExpired(task.deadline) ? "Task deadline has passed"
                : task.currentWorkers >= task.maxWorkers ? "Task is full"
                : "Task not available"}
            </div>
          )}
        </Card>
      )}

      {/* Poster actions */}
      {isPoster && (
        <Card className="p-5">
          <SectionTitle>Poster Actions</SectionTitle>
          <div className="flex flex-col gap-2">
            <button onClick={() => setActiveTab("proof")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-400)] transition-colors"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              Review Submissions <ChevronRight className="w-4 h-4" />
            </button>

            {isPast &&
              task.status !== TaskStatus.Past &&
              task.status !== TaskStatus.Closed && (
              <button
                onClick={() => settlePastTask(task.id)}
                disabled={isSettling}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[var(--brown-300)] text-[var(--brown-600)] text-sm font-semibold hover:bg-[var(--brown-50)] transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                <RefreshCw className={`w-3.5 h-3.5 ${isSettling ? "animate-spin" : ""}`} />
                {isSettling ? "Settling…" : "Settle & Refund"}
              </button>
            )}

            {(task.status === TaskStatus.Completed ||
              task.status === TaskStatus.Cancelled ||
              task.status === TaskStatus.Past) && (
              <button
                onClick={() => closeTask(task.id)}
                disabled={isClosing}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm font-semibold hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                <X className="w-3.5 h-3.5" />
                {isClosing ? "Closing…" : "Close Task"}
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}