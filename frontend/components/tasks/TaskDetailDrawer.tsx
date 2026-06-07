"use client";

import { useState } from "react";
import {
  X, Clock, CheckCircle, AlertTriangle, ExternalLink,
  Send, ThumbsUp, ThumbsDown, AlertCircle, Loader2, ChevronRight
} from "lucide-react";
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

const MOCK_WORKER = "0xF9...Demo";
const MOCK_SUBMISSION: Submission = {
  worker: MOCK_WORKER,
  proofData: "",
  status: SubmissionStatus.None,
  rejectionReason: "",
  submittedAt: 0,
};

// Status maps 
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

// Info row
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
      <span className="text-xs text-[var(--text-muted)] shrink-0 w-28"
        style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
        {label}
      </span>
      <span className={`text-xs font-semibold text-[var(--text-secondary)] text-right break-all ${mono ? "font-mono" : ""}`}
        style={{ fontFamily: mono ? "monospace" : "var(--font-nunito),sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

// ── Proof submission panel ────────────────────────────────────────────────────
function ProofPanel({ task, submission, onSubmit }: {
  task: Task; submission: Submission; onSubmit: (proof: string) => Promise<void>;
}) {
  const [proof, setProof]     = useState(submission.proofData || "");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handleSubmit = async () => {
    if (!proof.trim()) return;
    setLoading(true);
    await onSubmit(proof);
    setLoading(false);
    setDone(true);
  };

  if (submission.status === SubmissionStatus.Approved) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background:"rgba(74,124,89,0.08)", borderColor:"rgba(74,124,89,0.25)" }}>
        <CheckCircle className="w-5 h-5 shrink-0" style={{ color:"var(--success)" }} />
        <div>
          <p className="text-sm font-bold" style={{ color:"var(--success)", fontFamily:"var(--font-nunito),sans-serif" }}>
            Submission Approved
          </p>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
            {formatGDollar(task.bountyPerWorker)} has been sent to your wallet.
          </p>
        </div>
      </div>
    );
  }

  if (submission.status === SubmissionStatus.Rejected) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background:"rgba(139,58,42,0.08)", borderColor:"rgba(139,58,42,0.25)" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:"var(--error)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color:"var(--error)", fontFamily:"var(--font-nunito),sans-serif" }}>
              Submission Rejected
            </p>
            {submission.rejectionReason && (
              <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                Reason: {submission.rejectionReason}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
          You may re-submit a new proof below.
        </p>
        <ProofInput task={task} proof={proof} setProof={setProof} onSubmit={handleSubmit} loading={loading} done={done} />
      </div>
    );
  }

  if (submission.status === SubmissionStatus.Submitted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background:"rgba(201,162,39,0.08)", borderColor:"rgba(201,162,39,0.25)" }}>
        <Clock className="w-4 h-4 shrink-0" style={{ color:"var(--gold)" }} />
        <div>
          <p className="text-sm font-bold" style={{ color:"var(--gold)", fontFamily:"var(--font-nunito),sans-serif" }}>
            Submission Pending Review
          </p>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
            Submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
      </div>
    );
  }

  return <ProofInput task={task} proof={proof} setProof={setProof} onSubmit={handleSubmit} loading={loading} done={done} />;
}

function ProofInput({ task, proof, setProof, onSubmit, loading, done }: {
  task: Task; proof: string; setProof: (v: string) => void;
  onSubmit: () => void; loading: boolean; done: boolean;
}) {
  if (done) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background:"rgba(201,162,39,0.08)", borderColor:"rgba(201,162,39,0.25)" }}>
        <CheckCircle className="w-4 h-4" style={{ color:"var(--gold)" }} />
        <span className="text-sm font-bold" style={{ color:"var(--gold)", fontFamily:"var(--font-nunito),sans-serif" }}>
          Proof submitted! Awaiting poster review.
        </span>
      </div>
    );
  }

  const isLinkBased = task.verificationMethod !== VerificationMethod.OnChainText;

  return (
    <div className="space-y-3">
      {isLinkBased && task.verificationRef && (
        <a href={task.verificationRef.startsWith("http") ? task.verificationRef : `mailto:${task.verificationRef}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brown-300)] bg-[var(--bg-secondary)]/50 transition-colors group">
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)]" style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
              {VERIFICATION_METHOD_LABEL[task.verificationMethod]} Link
            </p>
            <p className="text-xs text-[var(--brown-400)] truncate max-w-[260px] mt-0.5">
              {task.verificationRef}
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brown-400)] transition-colors" />
        </a>
      )}

      <div>
        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide"
          style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
          Your Proof <span style={{ color:"var(--error)" }}>*</span>
          <span className="ml-2 text-[10px] font-normal normal-case text-[var(--text-muted)] tracking-normal">
            {task.verificationMethod === VerificationMethod.OnChainText
              ? "Text stored directly on-chain"
              : "Paste a URL, confirmation code, or description"}
          </span>
        </label>
        <Textarea
          placeholder={
            task.verificationMethod === VerificationMethod.OnChainText
              ? "Paste your text proof here — it will be stored on-chain..."
              : task.verificationMethod === VerificationMethod.SocialPost
              ? "https://t.me/groupname/12345 — paste the link to your post..."
              : task.verificationMethod === VerificationMethod.GoogleForm
              ? "Paste the Google Form confirmation code or response URL..."
              : "Describe what you did and paste any confirmation details..."
          }
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          rows={4}
        />
      </div>

      <button type="button" onClick={onSubmit} disabled={!proof.trim() || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-semibold hover:bg-[var(--brown-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Proof</>}
      </button>
    </div>
  );
}

// Poster actions 
function PosterActions({ taskId, workerAddress, submissionStatus }: {
  taskId: number; workerAddress: string; submissionStatus: SubmissionStatus;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject]     = useState(false);
  const [loading, setLoading]           = useState<"approve"|"reject"|"dispute"|null>(null);
  const [done, setDone]                 = useState<"approve"|"reject"|"dispute"|null>(null);

  const handle = async (action: "approve"|"reject"|"dispute") => {
    setLoading(action);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(null);
    setDone(action);
  };

  if (submissionStatus !== SubmissionStatus.Submitted) return null;

  if (done) {
    const msgs = {
      approve: "Submission approved. G$ sent to worker.",
      reject:  "Submission rejected. Worker notified.",
      dispute: "Dispute raised. Arbitration pool notified.",
    };
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
        <CheckCircle className="w-4 h-4 text-[var(--brown-400)]" />
        <span className="text-sm text-[var(--text-secondary)]" style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
          {msgs[done]}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)] mb-2" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
        Reviewing submission from <span className="font-mono">{shortAddress(workerAddress)}</span>
      </p>
      <div className="flex gap-2">
        <button onClick={() => handle("approve")} disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50"
          style={{ background:"var(--success)", fontFamily:"var(--font-nunito),sans-serif" }}>
          {loading === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
          Approve
        </button>
        <button onClick={() => setShowReject(!showReject)} disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-colors disabled:opacity-50"
          style={{ borderColor:"rgba(139,58,42,0.35)", color:"var(--error)", background:"rgba(139,58,42,0.06)", fontFamily:"var(--font-nunito),sans-serif" }}>
          <ThumbsDown className="w-3.5 h-3.5" /> Reject
        </button>
        <button onClick={() => handle("dispute")} disabled={loading !== null}
          className="px-3 py-2 rounded-xl border text-xs font-bold transition-colors disabled:opacity-50"
          style={{ borderColor:"rgba(201,162,39,0.35)", color:"var(--gold)", background:"rgba(201,162,39,0.08)", fontFamily:"var(--font-nunito),sans-serif" }}>
          {loading === "dispute" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        </button>
      </div>
      {showReject && (
        <div className="space-y-2 pt-1">
          <Textarea placeholder="Reason for rejection (required)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={2} />
          <button onClick={() => handle("reject")} disabled={!rejectReason.trim() || loading !== null}
            className="w-full py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50"
            style={{ background:"var(--error)", fontFamily:"var(--font-nunito),sans-serif" }}>
            {loading === "reject" && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />}
            Confirm Rejection
          </button>
        </div>
      )}
    </div>
  );
}

// Main drawer 
interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  viewerRole?: "worker" | "poster";
}

export default function TaskDetailDrawer({ task, onClose, viewerRole = "worker" }: TaskDetailDrawerProps) {
  const [joining, setJoining]       = useState(false);
  const [joined, setJoined]         = useState(false);
  const [submission, setSubmission] = useState<Submission>(MOCK_SUBMISSION);
  const [activeTab, setActiveTab]   = useState<"details"|"proof">("details");

  const handleJoin = async () => {
    setJoining(true);
    await new Promise(r => setTimeout(r, 1500));
    setJoining(false);
    setJoined(true);
    setActiveTab("proof");
  };

  const handleSubmitProof = async (proof: string) => {
    await new Promise(r => setTimeout(r, 1500));
    setSubmission({ ...submission, proofData: proof, status: SubmissionStatus.Submitted, submittedAt: Math.floor(Date.now() / 1000) });
  };

  if (!task) return null;

  const joinable = canJoin(task);
  const pct      = capacityPercent(task);
  const badge    = STATUS_BADGE[task.status] ?? STATUS_BADGE[TaskStatus.Open];

  const CATEGORY_EMOJI: Record<string, string> = {
    "Surveys & Research":"📋","Photo Verification":"📸","Content & Translation":"✍️",
    "Community Outreach":"📣","Mystery Shopping":"🔍","AI Training Data":"🎙️",
    "Data Labelling":"🏷️","Other":"📦",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-end sm:justify-center p-0 sm:p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background:"rgba(26,14,5,0.6)" }} onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col bg-[var(--bg-card)] sm:rounded-2xl border-0 sm:border border-[var(--border)] shadow-2xl overflow-hidden">

        {/* Status accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${STATUS_BAR[task.status] ?? STATUS_BAR[TaskStatus.Open]}`} />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
          <span className="text-2xl mt-0.5">{CATEGORY_EMOJI[task.category] ?? "📦"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                {STATUS_LABEL[task.status]}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                Task #{task.id.toString()}
              </span>
            </div>
            <h2 className="text-sm font-bold text-[var(--text-heading)] line-clamp-2"
              style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
              {task.title}
            </h2>
          </div>
          <button onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bounty strip */}
        {task.isPaid && (
          <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--brown-50)] flex items-center justify-between shrink-0">
            <div>
              <p className="text-xl font-black text-[var(--brown-500)]"
                style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
                {formatGDollar(task.bountyPerWorker)}
              </p>
              <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                per worker · instant payout on approval
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold flex items-center gap-1 justify-end ${isExpired(task.deadline) ? "text-[var(--error)]" : "text-[var(--text-secondary)]"}`}
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                <Clock className="w-3 h-3" />{formatDeadline(task.deadline)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                Expires {formatDate(task.deadline)}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] shrink-0">
          {(["details","proof"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-[var(--brown-500)] border-[var(--brown-500)]"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
              }`}
              style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
              {tab === "details" ? "Task Details" : viewerRole === "poster" ? "Submissions" : "My Proof"}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-5">
          {activeTab === "details" ? (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2"
                  style={{ fontFamily:"var(--font-nunito),sans-serif" }}>Description</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                  {task.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]"
                    style={{ fontFamily:"var(--font-nunito),sans-serif" }}>Worker Capacity</p>
                  <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                    {task.currentWorkers}/{task.maxWorkers} joined · {task.approvedCount} approved
                  </p>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)]">
                  <div className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-[var(--error)]" : pct >= 70 ? "bg-[var(--brown-400)]" : "bg-[var(--brown-300)]"
                  }`} style={{ width:`${pct}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <InfoRow label="Task ID"      value={`#${task.id.toString()}`} />
                <InfoRow label="Category"     value={task.category} />
                <InfoRow label="Posted by"    value={shortAddress(task.poster)} mono />
                <InfoRow label="Verification" value={VERIFICATION_METHOD_LABEL[task.verificationMethod]} />
                {task.verificationRef && <InfoRow label="Reference" value={task.verificationRef} mono />}
                {task.isPaid && <InfoRow label="Payment Token" value={shortAddress(task.paymentToken)} mono />}
                <InfoRow label="Deadline"     value={formatDate(task.deadline)} />
              </div>

              {task.verificationRef && task.verificationMethod !== VerificationMethod.OnChainText && (
                <a href={task.verificationRef.startsWith("http") ? task.verificationRef : `mailto:${task.verificationRef}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brown-300)] bg-[var(--bg-secondary)]/40 transition-colors group text-sm">
                  <span className="text-[var(--brown-500)] font-medium truncate" style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                    Open verification link
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brown-400)] shrink-0" />
                </a>
              )}
            </>
          ) : (
            <>
              {viewerRole === "poster" ? (
                <PosterActions
                  taskId={Number(task.id)}
                  workerAddress={MOCK_WORKER}
                  submissionStatus={SubmissionStatus.Submitted}
                />
              ) : (
                <>
                  {submission.status !== SubmissionStatus.None && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border)]">
                      <span className="text-xs text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                        Your submission status
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBMISSION_STATUS_COLOR[submission.status]}`}
                        style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                        {SUBMISSION_STATUS_LABEL[submission.status]}
                      </span>
                    </div>
                  )}
                  {joined || submission.status !== SubmissionStatus.None ? (
                    <ProofPanel task={task} submission={submission} onSubmit={handleSubmitProof} />
                  ) : (
                    <div className="space-y-3 py-4 text-center">
                      <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                        You need to join this task before you can submit proof.
                      </p>
                      <button onClick={() => setActiveTab("details")}
                        className="text-xs text-[var(--brown-400)] underline" style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                        Back to task details
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Action footer */}
        {activeTab === "details" && viewerRole === "worker" && (
          <div className="px-5 py-4 border-t border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/40">
            {joined ? (
              <button onClick={() => setActiveTab("proof")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-600)] transition-colors"
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                Submit Your Proof <ChevronRight className="w-4 h-4" />
              </button>
            ) : joinable ? (
              <button onClick={handleJoin} disabled={joining}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-600)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                {joining
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                  : <>Join Task · Earn {formatGDollar(task.bountyPerWorker)}</>}
              </button>
            ) : (
              <div className="w-full text-center py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-muted)]"
                style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
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