"use client";

import { useState } from "react";
import {
  X, Clock, CheckCircle, AlertTriangle, ExternalLink,
  Send, Loader2, ChevronRight, Users,
} from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import {
  Task, Submission, TaskStatus, SubmissionStatus,
  SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_COLOR,
  VERIFICATION_METHOD_LABEL, VerificationMethod,
} from "@/types/contract";
import {
  formatDeadline, formatDate, formatGDollar,
  capacityPercent, shortAddress, canJoin, isExpired,
} from "@/lib/taskUtils";
import { Textarea } from "@/components/tasks/FormFields";
import { SubmissionReviewPanel } from "@/components/tasks/SubmissionReviewPanel";
import { useSubmitProof } from "@/hooks/useSubmitProof";
import { useJoinTask }    from "@/hooks/useJoinTask";
import { useSubmission }  from "@/hooks/useSubmissionReads";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract as `0x${string}`;

//Status maps 
const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Open]:       "Open",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.Completed]:  "Completed",
  [TaskStatus.Cancelled]:  "Cancelled",
  [TaskStatus.Disputed]:   "Disputed",
  [TaskStatus.Extended]:   "Extended",
  [TaskStatus.Past]:       "Past",
  [TaskStatus.Closed]:     "Closed",
};

const STATUS_BADGE: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  [TaskStatus.Open]:       { bg:"bg-[var(--brown-100)]",         text:"text-[var(--brown-700)]",  dot:"bg-[var(--brown-500)]"  },
  [TaskStatus.InProgress]: { bg:"bg-[var(--cream-300)]",         text:"text-[var(--brown-800)]",  dot:"bg-[var(--brown-400)]"  },
  [TaskStatus.Completed]:  { bg:"bg-[rgba(74,124,89,0.12)]",     text:"text-[var(--success)]",    dot:"bg-[var(--success)]"    },
  [TaskStatus.Cancelled]:  { bg:"bg-[var(--brown-50)]",          text:"text-[var(--text-muted)]", dot:"bg-[var(--brown-300)]"  },
  [TaskStatus.Disputed]:   { bg:"bg-[rgba(139,58,42,0.12)]",     text:"text-[var(--error)]",      dot:"bg-[var(--error)]"      },
  [TaskStatus.Extended]:   { bg:"bg-[var(--cream-200)]",         text:"text-[var(--brown-600)]",  dot:"bg-[var(--brown-400)]"  },
  [TaskStatus.Past]:       { bg:"bg-[var(--bg-secondary)]",      text:"text-[var(--text-muted)]", dot:"bg-[var(--brown-300)]"  },
  [TaskStatus.Closed]:     { bg:"bg-[var(--brown-50)]",          text:"text-[var(--text-muted)]", dot:"bg-[var(--brown-200)]"  },
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

// InfoRow 
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
      <span
        className="text-xs text-[var(--text-muted)] shrink-0 w-28"
        style={{ fontFamily: "var(--font-roboto),sans-serif" }}
      >
        {label}
      </span>
      <span
        className={`text-xs font-semibold text-[var(--text-secondary)] text-right break-all ${mono ? "font-mono" : ""}`}
        style={{ fontFamily: mono ? "monospace" : "var(--font-nunito),sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

// ProofPanel 
function ProofPanel({
  task,
  submission,
}: {
  task: Task;
  submission: Submission | null | undefined;
}) {
  const [proof, setProof] = useState("");
  const { submitProof, isWriting, isConfirming } = useSubmitProof();

  // Approved
  if (submission?.status === SubmissionStatus.Approved) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background: "rgba(74,124,89,0.08)", borderColor: "rgba(74,124,89,0.25)" }}
      >
        <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "var(--success)" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--success)", fontFamily: "var(--font-nunito),sans-serif" }}>
            Submission Approved
          </p>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            {task.isPaid
              ? `${formatGDollar(task.bountyPerWorker)} sent to your wallet.`
              : "Thank you for your contribution!"}
          </p>
        </div>
      </div>
    );
  }

  // Pending review
  if (submission?.status === SubmissionStatus.Submitted) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background: "rgba(201,162,39,0.08)", borderColor: "rgba(201,162,39,0.25)" }}
      >
        <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--gold)" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--gold)", fontFamily: "var(--font-nunito),sans-serif" }}>
            Pending Review
          </p>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            Submitted {formatDate(submission.submittedAt)}
          </p>
          {submission.proofData && (
            <p className="text-xs mt-2 p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] line-clamp-3" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              {submission.proofData}
            </p>
          )}
        </div>
      </div>
    );
  }

  // None or Rejected 
  return (
    <div className="space-y-3">
      {/* Rejection notice */}
      {submission?.status === SubmissionStatus.Rejected && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "rgba(139,58,42,0.08)", borderColor: "rgba(139,58,42,0.25)" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--error)", fontFamily: "var(--font-nunito),sans-serif" }}>
              Submission Rejected
            </p>
            {submission.rejectionReason && (
              <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                Reason: {submission.rejectionReason}
              </p>
            )}
            <p className="text-xs mt-1 text-[var(--text-muted)]">You may re-submit below.</p>
          </div>
        </div>
      )}

      {/* Verification link */}
      {task.verificationRef && task.verificationMethod !== VerificationMethod.OnChainText && (
        <a
          href={task.verificationRef.startsWith("http") ? task.verificationRef : `mailto:${task.verificationRef}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brown-300)] bg-[var(--bg-secondary)]/50 transition-colors group"
        >
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              {VERIFICATION_METHOD_LABEL[task.verificationMethod]} Link
            </p>
            <p className="text-xs text-[var(--brown-400)] truncate max-w-[260px] mt-0.5">{task.verificationRef}</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brown-400)] transition-colors" />
        </a>
      )}

      {/* Proof textarea */}
      <div>
        <label
          className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide"
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}
        >
          Your Proof <span style={{ color: "var(--error)" }}>*</span>
          <span className="ml-2 text-[10px] font-normal normal-case text-[var(--text-muted)] tracking-normal">
            {task.verificationMethod === VerificationMethod.OnChainText
              ? "Stored on-chain"
              : "Paste URL or confirmation code"}
          </span>
        </label>
        <Textarea
          placeholder={
            task.verificationMethod === VerificationMethod.OnChainText
              ? "Paste your text proof here — stored on-chain..."
              : task.verificationMethod === VerificationMethod.SocialPost
              ? "https://t.me/groupname/12345 — link to your post..."
              : task.verificationMethod === VerificationMethod.GoogleForm
              ? "Paste the Google Form confirmation code..."
              : "Describe what you did and paste confirmation details..."
          }
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          rows={4}
        />
      </div>

      <button
        type="button"
        onClick={() => submitProof(task.id, proof)}
        disabled={!proof.trim() || isWriting || isConfirming}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-semibold hover:bg-[var(--brown-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "var(--font-nunito),sans-serif" }}
      >
        {isWriting
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet…</>
          : isConfirming
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
          : <><Send className="w-4 h-4" /> Submit Proof</>}
      </button>
    </div>
  );
}

// Main Drawer
interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailDrawer({ task, onClose }: TaskDetailDrawerProps) {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"details" | "proof">("details");

  const isPoster = !!address && !!task && address.toLowerCase() === task.poster.toLowerCase();
  const joinable  = task ? canJoin(task) : false;
  const pct       = task ? capacityPercent(task) : 0;
  const badge     = task
    ? (STATUS_BADGE[task.status] ?? STATUS_BADGE[TaskStatus.Open])
    : STATUS_BADGE[TaskStatus.Open];

  // hasJoined
  const { data: hasJoined } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi as any,
    functionName: "hasJoined",
    args: [task?.id ?? 0n, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!task && !!address && !isPoster },
  });

  // Worker's own submission
  const { data: submission } = useSubmission(
    task?.id,
    !isPoster ? address : undefined,
  );

  const { joinTask, isWriting: isJoining } = useJoinTask();

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-end sm:justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(26,14,5,0.6)" }}
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col bg-[var(--bg-card)] sm:rounded-2xl border-0 sm:border border-[var(--border)] shadow-2xl overflow-hidden">

        {/* Status accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${STATUS_BAR[task.status] ?? STATUS_BAR[TaskStatus.Open]}`} />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
          <span className="text-2xl mt-0.5">{CATEGORY_EMOJI[task.category] ?? "📦"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                {STATUS_LABEL[task.status]}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                Task #{task.id.toString()}
              </span>
            </div>
            <h2
              className="text-sm font-bold text-[var(--text-heading)] line-clamp-2"
              style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
            >
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bounty strip */}
        {task.isPaid && (
          <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--brown-50)] flex items-center justify-between shrink-0">
            <div>
              <p
                className="text-xl font-black text-[var(--brown-500)]"
                style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}
              >
                {formatGDollar(task.bountyPerWorker)}
              </p>
              <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                per worker · instant payout on approval
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-xs font-semibold flex items-center gap-1 justify-end ${isExpired(task.deadline) ? "text-[var(--error)]" : "text-[var(--text-secondary)]"}`}
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                <Clock className="w-3 h-3" />{formatDeadline(task.deadline)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                Expires {formatDate(task.deadline)}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] shrink-0">
          {(["details", "proof"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-[var(--brown-500)] border-[var(--brown-500)]"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
              }`}
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}
            >
              {tab === "details" ? "Task Details" : isPoster ? "Review Submissions" : "My Proof"}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-5">
          {activeTab === "details" ? (
            <>
              {/* Description */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                  Description
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                  {task.description}
                </p>
              </div>

              {/* Capacity bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                    Worker Capacity
                  </p>
                  <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                    {task.currentWorkers}/{task.maxWorkers} joined · {task.approvedCount} approved
                  </p>
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
              </div>

              {/* Metadata */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <InfoRow label="Task ID"      value={`#${task.id.toString()}`} />
                <InfoRow label="Category"     value={task.category} />
                <InfoRow label="Posted by"    value={shortAddress(task.poster)} mono />
                <InfoRow label="Verification" value={VERIFICATION_METHOD_LABEL[task.verificationMethod]} />
                {task.verificationRef && <InfoRow label="Reference" value={task.verificationRef} mono />}
                {task.isPaid && <InfoRow label="Payment Token" value={shortAddress(task.paymentToken)} mono />}
                <InfoRow label="Deadline"     value={formatDate(task.deadline)} />
              </div>

              {/* Verification link */}
              {task.verificationRef && task.verificationMethod !== VerificationMethod.OnChainText && (
                <a
                  href={task.verificationRef.startsWith("http") ? task.verificationRef : `mailto:${task.verificationRef}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brown-300)] bg-[var(--bg-secondary)]/40 transition-colors group text-sm"
                >
                  <span className="text-[var(--brown-500)] font-medium truncate" style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                    Open verification link
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brown-400)] shrink-0" />
                </a>
              )}
            </>
          ) : (
            <>
              {isPoster ? (
               
                <SubmissionReviewPanel task={task} />
              ) : (
                
                <>
                  {submission && submission.status !== SubmissionStatus.None && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border)]">
                      <span className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                        Your submission status
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBMISSION_STATUS_COLOR[submission.status]}`}
                        style={{ fontFamily: "var(--font-nunito),sans-serif" }}
                      >
                        {SUBMISSION_STATUS_LABEL[submission.status]}
                      </span>
                    </div>
                  )}

                  {hasJoined ? (
                    <ProofPanel task={task} submission={submission} />
                  ) : (
                    <div className="space-y-3 py-4 text-center">
                      <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                        Join this task first to submit proof.
                      </p>
                      <button
                        onClick={() => setActiveTab("details")}
                        className="text-xs text-[var(--brown-400)] underline"
                        style={{ fontFamily: "var(--font-nunito),sans-serif" }}
                      >
                        Back to task details
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer — worker actions only */}
        {activeTab === "details" && !isPoster && (
          <div className="px-5 py-4 border-t border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/40">
            {hasJoined ? (
              <button
                onClick={() => setActiveTab("proof")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-600)] transition-colors"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                Submit Your Proof <ChevronRight className="w-4 h-4" />
              </button>
            ) : joinable ? (
              <button
                onClick={() => joinTask(task.id)}
                disabled={isJoining}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-600)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}
              >
                {isJoining
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                  : <><Users className="w-4 h-4" /> Join Task{task.isPaid ? ` · Earn ${formatGDollar(task.bountyPerWorker)}` : ""}</>}
              </button>
            ) : (
              <div
                className="w-full text-center py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-roboto),sans-serif" }}
              >
                {isExpired(task.deadline) ? "Task deadline has passed"
                  : task.currentWorkers >= task.maxWorkers ? "Task is full"
                  : "Task not available"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}