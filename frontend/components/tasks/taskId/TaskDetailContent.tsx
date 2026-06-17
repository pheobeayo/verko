"use client";

import { ExternalLink } from "lucide-react";
import { Task, SubmissionStatus, Submission, SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_COLOR, VERIFICATION_METHOD_LABEL, VerificationMethod } from "@/types/contract";
import { shortAddress, formatDate } from "@/lib/taskUtils";
import { SubmissionReviewPanel } from "@/components/tasks/SubmissionReviewPanel";
import { Card, InfoRow, SectionTitle } from "./TaskDetailUI";
import { ProofPanel } from "./ProofPanel";

interface Props {
  task:        Task;
  isPoster:    boolean;
  hasJoined:   boolean | undefined;
  submission:  Submission | undefined;
  activeTab:   "details" | "proof";
  setActiveTab: (tab: "details" | "proof") => void;
}

export function TaskDetailContent({
  task, isPoster, hasJoined, submission, activeTab, setActiveTab,
}: Props) {
  return (
    <div className="lg:col-span-2 flex flex-col gap-5">

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
        {(["details", "proof"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? "text-[var(--brown-500)] border-[var(--brown-500)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
            }`}
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
            {tab === "details" ? "Task Details" : isPoster ? "Review Submissions" : "My Proof"}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === "details" ? (
        <div className="flex flex-col gap-4">

          {/* Description */}
          <Card className="p-5 sm:p-6">
            <SectionTitle>Description</SectionTitle>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              {task.description}
            </p>
          </Card>

          {/* Verification link */}
          {task.verificationRef && task.verificationMethod !== VerificationMethod.OnChainText && (
            <a
              href={task.verificationRef.startsWith("http") ? task.verificationRef : `mailto:${task.verificationRef}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-[20px] border border-[var(--border)] hover:border-[var(--brown-300)] bg-[var(--bg-card)] transition-colors group"
            >
              <div>
                <p className="text-sm font-bold text-[var(--text-secondary)]"
                  style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                  {VERIFICATION_METHOD_LABEL[task.verificationMethod]} Link
                </p>
                <p className="text-xs text-[var(--brown-400)] truncate max-w-sm mt-0.5">
                  {task.verificationRef}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--brown-400)] shrink-0 transition-colors" />
            </a>
          )}

          {/* Metadata table */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
              <SectionTitle>Task Info</SectionTitle>
            </div>
            <InfoRow label="Task ID"      value={`#${task.id.toString()}`} />
            <InfoRow label="Category"     value={task.category} />
            <InfoRow label="Posted by"    value={shortAddress(task.poster)} mono />
            <InfoRow label="Verification" value={VERIFICATION_METHOD_LABEL[task.verificationMethod]} />
            {task.verificationRef && <InfoRow label="Reference"    value={task.verificationRef} mono />}
            {task.isPaid          && <InfoRow label="Payment Token" value={shortAddress(task.paymentToken)} mono />}
            <InfoRow label="Deadline"     value={formatDate(task.deadline)} />
          </Card>
        </div>

      ) : (
        /* Proof tab */
        <Card className="p-5 sm:p-6">
          {isPoster ? (
            <SubmissionReviewPanel task={task} />
          ) : (
            <div className="space-y-4">
              {/* Submission status badge */}
              {submission && submission.status !== SubmissionStatus.None && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border)]">
                  <span className="text-xs text-[var(--text-muted)]"
                    style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                    Your submission status
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBMISSION_STATUS_COLOR[submission.status]}`}
                    style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                    {SUBMISSION_STATUS_LABEL[submission.status]}
                  </span>
                </div>
              )}

              {hasJoined ? (
                <ProofPanel task={task} submission={submission} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-[var(--text-muted)]"
                    style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
                    Join this task first to submit proof.
                  </p>
                  <button onClick={() => setActiveTab("details")}
                    className="text-sm text-[var(--brown-400)] underline"
                    style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                    Back to task details
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}