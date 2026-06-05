"use client";

import { useState, useEffect, useCallback } from "react";
import { X, FileText, ChevronRight, CheckCircle2, Loader2, Coins, Heart } from "lucide-react";
import { TaskFormValues, VerificationMethod } from "@/types/contract";
import { useCreateTask } from "@/hooks/useCreateTask";
import {
  STEPS, DEFAULT_FORM, STEP_FIELD_SETS, GOOD_DOLLAR_DECIMALS,
  validate, type FormErrors,
} from "./createTask/share";
import { StepIndicator }     from "./createTask/StepIndicator";
import { StepTaskDetails }   from "./createTask/StepTaskDetails";
import { StepPaymentWorkers } from "./createTask/StepPaymentWorkers";
import { StepVerification }  from "./createTask/StepVerification";
import { StepReview }        from "./createTask/StepReview";

interface Props { open: boolean; onClose: () => void; onSuccess?: (taskId: number) => void; }
type TaskType = "paid" | "volunteer" | null;

function TypeSelector({ onSelect }: { onSelect: (t: TaskType) => void }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-sm text-[var(--text-muted)] mb-1" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
        What kind of task do you want to post?
      </p>
      {(["paid", "volunteer"] as const).map(type => {
        const isPaid = type === "paid";
        const accent = isPaid ? "var(--brown-500)" : "var(--success)";
        return (
          <button key={type} onClick={() => onSelect(type)}
            className="flex items-start gap-4 p-5 rounded-2xl border-2 text-left cursor-pointer w-full transition-all duration-200 hover:-translate-y-0.5 bg-[var(--bg-primary)]"
            style={{ borderColor:"var(--border)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: isPaid ? "var(--bg-secondary)" : "rgba(74,124,89,0.1)", color: accent }}>
              {isPaid ? <Coins className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-sm mb-1.5 text-[var(--text-heading)]"
                style={{ fontFamily:"var(--font-telegraf),\'Space Grotesk\',sans-serif" }}>
                {isPaid ? "Paid Bounty" : "Volunteer Task"}
              </p>
              <p className="text-[0.82rem] leading-relaxed text-[var(--text-muted)]"
                style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                {isPaid
                  ? "Workers earn G$ when their submission is approved. Bounty locked in escrow at creation."
                  : "No G$ payment. Workers contribute for community impact and earn reputation NFT points."}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function CreateTaskModal({ open, onClose, onSuccess }: Props) {
  const [taskType, setTaskType] = useState<TaskType>(null);
  const [step, setStep]         = useState(0);
  const [values, setValues]     = useState<TaskFormValues>(DEFAULT_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});

  const { createTask, isWriting, isConfirming, isSuccess, createdTaskId, reset: resetHook } = useCreateTask();
  const submitting = isWriting || isConfirming;

  useEffect(() => {
    if (open) { setTaskType(null); setStep(0); setValues(DEFAULT_FORM); setErrors({}); resetHook(); }
  }, [open, resetHook]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open && !submitting) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose, submitting]);

  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => { if (createdTaskId !== null) onSuccess?.(Number(createdTaskId)); onClose(); }, 1800);
    return () => clearTimeout(t);
  }, [isSuccess, createdTaskId, onSuccess, onClose]);

  const onChange = useCallback((key: keyof TaskFormValues, value: string | number | VerificationMethod) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  const handleSelectType = (t: TaskType) => {
    setTaskType(t);
    if (t === "volunteer") setValues(prev => ({ ...prev, bountyPerWorker:"0", paymentToken:"0x0000000000000000000000000000000000000000" }));
  };

  const validateStep = () => {
    const all = validate(values);
    if (taskType === "volunteer") { delete all.bountyPerWorker; delete all.paymentToken; }
    const relevant: FormErrors = {};
    for (const key of STEP_FIELD_SETS[step]) { if (all[key]) relevant[key] = all[key]; }
    setErrors(relevant);
    return Object.keys(relevant).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const all = validate(values);
    if (taskType === "volunteer") { delete all.bountyPerWorker; delete all.paymentToken; }
    if (Object.keys(all).length > 0) { setErrors(all); return; }
    try {
      const deadlineUnix = Math.floor(new Date(values.deadline).getTime() / 1000);
      await createTask({
        title:              values.title.trim(),
        description:        values.description.trim(),
        category:           values.category,
        bountyPerWorker:    taskType === "volunteer" ? "0" : (values.bountyPerWorker || "0"),
        paymentToken:       taskType === "volunteer" ? "0x0000000000000000000000000000000000000000" : values.paymentToken as `0x${string}`,
        maxWorkers:         parseInt(values.maxWorkers, 10),
        deadline:           deadlineUnix,
        verificationMethod: values.verificationMethod,
        verificationRef:    values.verificationRef.trim(),
      }, GOOD_DOLLAR_DECIMALS);
    } catch (err) { console.error("[CreateTaskModal]", err); }
  };

  if (!open) return null;

  const isTypeStep = taskType === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background:"rgba(26,14,5,0.65)" }}
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[var(--text-heading)]"
              style={{ fontFamily:"var(--font-telegraf),\'Space Grotesk\',sans-serif" }}>
              {isTypeStep ? "Post a Task" : isSuccess ? "Task Created!" : `Step ${step + 1} — ${STEPS[step]}`}
            </h2>
            {!isTypeStep && !isSuccess && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                {taskType === "paid" ? "💰 Paid Bounty" : "🌱 Volunteer Task"}
              </p>
            )}
          </div>
          <button onClick={onClose} disabled={submitting}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {!isTypeStep && !isSuccess && (
          <div className="px-5 pt-4 shrink-0">
            <StepIndicator current={step} />
          </div>
        )}

        {/* Step label */}
        {!isTypeStep && !isSuccess && (
          <div className="px-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-[var(--brown-400)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]"
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                {STEPS[step]}
              </h3>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background:"rgba(74,124,89,0.12)" }}>
                <CheckCircle2 className="w-7 h-7" style={{ color:"var(--success)" }} />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-[var(--text-heading)]"
                  style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                  Task Created!
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1" style={{ fontFamily:"var(--font-roboto),sans-serif" }}>
                  {createdTaskId !== null ? `Task #${createdTaskId.toString()} is live on Verko.` : "Your task is now live on Verko."}{" "}
                  Workers can start joining.
                </p>
              </div>
            </div>
          ) : isTypeStep ? (
            <TypeSelector onSelect={handleSelectType} />
          ) : step === 0 ? (
            <StepTaskDetails    values={values} errors={errors} onChange={onChange} />
          ) : step === 1 ? (
            <StepPaymentWorkers values={values} errors={errors} onChange={onChange} isVolunteer={taskType === "volunteer"} />
          ) : step === 2 ? (
            <StepVerification   values={values} errors={errors} onChange={onChange} />
          ) : (
            <StepReview values={values} taskType={taskType!} />
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/40">
            <button type="button"
              onClick={isTypeStep ? onClose : step === 0 ? () => setTaskType(null) : handleBack}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
              {isTypeStep ? "Cancel" : step === 0 ? "← Type" : "Back"}
            </button>

            {!isTypeStep && (
              step < STEPS.length - 1 ? (
                <button type="button" onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-semibold hover:bg-[var(--brown-600)] transition-colors"
                  style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-semibold hover:bg-[var(--brown-600)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{isWriting ? "Confirm in wallet…" : "Confirming…"}</>
                  ) : (
                    <><FileText className="w-4 h-4" />Create Task</>
                  )}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}