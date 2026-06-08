"use client";

import { useState } from "react";
import {
  ThumbsUp, ThumbsDown, CheckCircle,
  Loader2, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { Task, Submission, SubmissionStatus } from "@/types/contract";
import { shortAddress, formatDate, formatGDollar } from "@/lib/taskUtils";
import { Textarea } from "@/components/tasks/FormFields";
import { useApproveSubmission } from "@/hooks/useApproveSubmission";
import { useRejectSubmission }  from "@/hooks/useRejectSubmission";
import { useTaskSubmissions }   from "@/hooks/useSubmissionReads";


function WorkerRow({
  task,
  worker,
  submission,
}: {
  task: Task;
  worker: `0x${string}`;
  submission: Submission;
}) {
  const [expanded, setExpanded]         = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject]     = useState(false);

  const { approveSubmission, isWriting: isApproving, isSuccess: approved } = useApproveSubmission();
  const { rejectSubmission,  isWriting: isRejecting, isSuccess: rejected  } = useRejectSubmission();

  const statusColor =
    submission.status === SubmissionStatus.Approved ? "text-[var(--success)]"
    : submission.status === SubmissionStatus.Rejected ? "text-[var(--error)]"
    : submission.status === SubmissionStatus.Submitted ? "text-[var(--gold)]"
    : "text-[var(--text-muted)]";

  const statusLabel =
    submission.status === SubmissionStatus.Approved ? "Approved"
    : submission.status === SubmissionStatus.Rejected ? "Rejected"
    : submission.status === SubmissionStatus.Submitted ? "Pending Review"
    : "No Submission";

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-card)]">
      {/* Row header — click to expand */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--brown-100)] flex items-center justify-center text-[10px] font-bold text-[var(--brown-600)]">
            {worker.slice(2, 4).toUpperCase()}
          </div>
          <span className="text-xs font-mono text-[var(--text-secondary)]">{shortAddress(worker)}</span>
          <span className={`text-[10px] font-bold ${statusColor}`} style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
            {statusLabel}
          </span>
        </div>
        {expanded
          ? <ChevronUp   className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">

          {/* Proof text */}
          {submission.proofData ? (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                Submitted Proof
              </p>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                  {submission.proofData}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">
                  Submitted {formatDate(submission.submittedAt)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] mt-3">No proof submitted yet.</p>
          )}

          {/* Rejection reason (if rejected) */}
          {submission.status === SubmissionStatus.Rejected && submission.rejectionReason && (
            <div className="p-3 rounded-lg bg-[rgba(139,58,42,0.06)] border border-[rgba(139,58,42,0.2)]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--error)] mb-1" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                Rejection Reason
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{submission.rejectionReason}</p>
            </div>
          )}

          {/* Approve / Reject actions — only for pending */}
          {submission.status === SubmissionStatus.Submitted && !approved && !rejected && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button
                  onClick={() => approveSubmission(task.id, worker)}
                  disabled={isApproving || isRejecting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50"
                  style={{ background: "var(--success)", fontFamily: "var(--font-nunito),sans-serif" }}
                >
                  {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                  {isApproving
                    ? "Approving…"
                    : `Approve${task.isPaid ? ` · ${formatGDollar(task.bountyPerWorker)}` : ""}`}
                </button>
                <button
                  onClick={() => setShowReject(!showReject)}
                  disabled={isApproving || isRejecting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-colors disabled:opacity-50"
                  style={{ borderColor: "rgba(139,58,42,0.35)", color: "var(--error)", background: "rgba(139,58,42,0.06)", fontFamily: "var(--font-nunito),sans-serif" }}
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              </div>

              {showReject && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for rejection (required)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                  />
                  <button
                    onClick={() => rejectSubmission(task.id, worker, rejectReason)}
                    disabled={!rejectReason.trim() || isRejecting}
                    className="w-full py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50"
                    style={{ background: "var(--error)", fontFamily: "var(--font-nunito),sans-serif" }}
                  >
                    {isRejecting ? "Rejecting…" : "Confirm Rejection"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Post-action confirmation */}
          {approved && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(74,124,89,0.08)]">
              <CheckCircle className="w-4 h-4 text-[var(--success)]" />
              <span className="text-xs text-[var(--success)]">Approved — G$ sent.</span>
            </div>
          )}
          {rejected && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)]">
              <CheckCircle className="w-4 h-4 text-[var(--brown-400)]" />
              <span className="text-xs text-[var(--text-secondary)]">Rejected. Worker can re-submit.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main panel 
export function SubmissionReviewPanel({ task }: { task: Task }) {
  const { submissions, workers, isLoading } = useTaskSubmissions(task.id);

  const pendingCount = submissions.filter(
    (s) => s.status === SubmissionStatus.Submitted
  ).length;

  const hasSubmitted = (worker: `0x${string}`) => {
    const idx = workers.indexOf(worker);
    return idx >= 0 && submissions[idx]?.status !== SubmissionStatus.None;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--brown-400)]" />
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Users className="w-8 h-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          No workers have joined this task yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
          {workers.length} worker{workers.length !== 1 ? "s" : ""} joined
        </p>
        {pendingCount > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(201,162,39,0.1)] text-[var(--gold)] border border-[rgba(201,162,39,0.3)]"
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}
          >
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Workers with submissions */}
      {workers
        .filter((w) => hasSubmitted(w as `0x${string}`))
        .map((worker, i) => {
          const idx = workers.indexOf(worker);
          return (
            <WorkerRow
              key={worker}
              task={task}
              worker={worker as `0x${string}`}
              submission={submissions[idx]}
            />
          );
        })}

      {/* Workers who joined but haven't submitted yet */}
      {workers.filter((w) => !hasSubmitted(w as `0x${string}`)).length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] text-[var(--text-muted)] mb-2" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            Waiting for proof from {workers.filter((w) => !hasSubmitted(w as `0x${string}`)).length} worker{workers.filter((w) => !hasSubmitted(w as `0x${string}`)).length !== 1 ? "s" : ""}:
          </p>
          <div className="flex flex-wrap gap-2">
            {workers
              .filter((w) => !hasSubmitted(w as `0x${string}`))
              .map((w) => (
                <span key={w} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)]">
                  {shortAddress(w as `0x${string}`)}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}