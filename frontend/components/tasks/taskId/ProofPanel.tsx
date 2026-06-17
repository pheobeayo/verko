"use client";

import { useState } from "react";
import { Clock, CheckCircle, AlertTriangle, ExternalLink, Send, Loader2 } from "lucide-react";
import { Task, Submission, SubmissionStatus, VerificationMethod, VERIFICATION_METHOD_LABEL } from "@/types/contract";
import { formatGDollar, formatDate } from "@/lib/taskUtils";
import { Textarea } from "@/components/tasks/FormFields";
import { useSubmitProof }       from "@/hooks/useSubmitProof";
import { useClaimAutoApproval } from "@/hooks/useClaimAutoApproval";
import { APPROVAL_TIMEOUT }     from "./taskDetailConstants";

interface Props {
  task:       Task;
  submission: Submission | null | undefined;
}

export function ProofPanel({ task, submission }: Props) {
  const [proof, setProof] = useState("");
  const { submitProof, isWriting, isConfirming }    = useSubmitProof();
  const { claimAutoApproval, isWriting: isClaiming } = useClaimAutoApproval();

  const canAutoApprove =
    submission?.status === SubmissionStatus.Submitted &&
    submission?.submittedAt &&
    Date.now() / 1000 > Number(submission.submittedAt) + APPROVAL_TIMEOUT;

  // ── Approved ──────────────────────────────────────────────────────────────
  if (submission?.status === SubmissionStatus.Approved) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-[16px] border"
        style={{ background: "rgba(74,124,89,0.08)", borderColor: "rgba(74,124,89,0.25)" }}>
        <CheckCircle className="w-6 h-6 shrink-0" style={{ color: "var(--success)" }} />
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--success)", fontFamily: "var(--font-nunito),sans-serif" }}>
            Submission Approved
          </p>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            {task.isPaid
              ? `${formatGDollar(task.bountyPerWorker)} has been sent to your wallet.`
              : "Thank you for your contribution!"}
          </p>
        </div>
      </div>
    );
  }

  // ── Pending review ────────────────────────────────────────────────────────
  if (submission?.status === SubmissionStatus.Submitted) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-5 rounded-[16px] border"
          style={{ background: "rgba(201,162,39,0.08)", borderColor: "rgba(201,162,39,0.25)" }}>
          <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "var(--gold)", fontFamily: "var(--font-nunito),sans-serif" }}>
              Pending Review
            </p>
            <p className="text-xs mt-0.5 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              Submitted {formatDate(submission.submittedAt)}
            </p>
            {submission.proofData && (
              <div className="mt-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5"
                  style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                  Your proof
                </p>
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words"
                  style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                  {submission.proofData}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Auto-approval after 7 days */}
        {canAutoApprove && (
          <div className="p-4 rounded-[16px] border"
            style={{ background: "rgba(196,122,58,0.06)", borderColor: "rgba(196,122,58,0.3)" }}>
            <p className="text-sm font-bold text-[var(--brown-600)] mb-1"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              Poster hasn't responded in 7+ days
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-3"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              You can now claim auto-approval and receive your bounty.
            </p>
            <button
              onClick={() => claimAutoApproval(task.id)}
              disabled={isClaiming}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-400)] transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              {isClaiming ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming…</> : "Claim Auto-Approval"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── None / Rejected — show submission form ────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Rejection notice */}
      {submission?.status === SubmissionStatus.Rejected && (
        <div className="flex items-start gap-3 p-4 rounded-[16px] border"
          style={{ background: "rgba(139,58,42,0.08)", borderColor: "rgba(139,58,42,0.25)" }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--error)", fontFamily: "var(--font-nunito),sans-serif" }}>
              Submission Rejected
            </p>
            {submission.rejectionReason && (
              <p className="text-xs mt-1 text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
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
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-[16px] border border-[var(--border)] hover:border-[var(--brown-300)] bg-[var(--bg-secondary)]/50 transition-colors group"
        >
          <div>
            <p className="text-sm font-bold text-[var(--text-secondary)]"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              {VERIFICATION_METHOD_LABEL[task.verificationMethod]} Link
            </p>
            <p className="text-xs text-[var(--brown-400)] truncate max-w-[280px] mt-0.5">
              {task.verificationRef}
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--brown-400)] shrink-0 transition-colors" />
        </a>
      )}

      {/* Proof textarea */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide"
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
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
          rows={5}
        />
      </div>

      <button
        type="button"
        onClick={() => submitProof(task.id, proof)}
        disabled={!proof.trim() || isWriting || isConfirming}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-bold hover:bg-[var(--brown-400)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
        {isWriting    ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet…</>
        : isConfirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
        : <><Send className="w-4 h-4" /> Submit Proof</>}
      </button>
    </div>
  );
}