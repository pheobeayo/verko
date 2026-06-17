"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, FileText, Coins, Heart, ArrowLeft } from "lucide-react";
import { TaskFormValues, VerificationMethod } from "@/types/contract";
import { useCreateTask } from "@/hooks/useCreateTask";
import {
  STEPS, DEFAULT_FORM, STEP_FIELD_SETS, GOOD_DOLLAR_DECIMALS,
  validate, type FormErrors,
} from "@/components/tasks/createTask/share";
import { StepIndicator }      from "@/components/tasks/createTask/StepIndicator";
import { StepTaskDetails }    from "@/components/tasks/createTask/StepTaskDetails";
import { StepPaymentWorkers } from "@/components/tasks/createTask/StepPaymentWorkers";
import { StepVerification }   from "@/components/tasks/createTask/StepVerification";
import { StepReview }         from "@/components/tasks/createTask/StepReview";

type TaskType = "paid" | "volunteer" | null;

function TypeCard({ type, selected, onSelect }: { type:"paid"|"volunteer"; selected:boolean; onSelect:()=>void }) {
  const isPaid = type === "paid";
  const accent = isPaid ? "var(--brown-500)" : "var(--success)";

  return (
    <button onClick={onSelect}
      className="w-full flex items-start gap-3 sm:gap-5 p-4 sm:p-6 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: selected ? accent : "var(--border)",
        background:  selected ? (isPaid ? "var(--brown-50)" : "rgba(74,124,89,0.05)") : "var(--bg-card)",
      }}>
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isPaid ? "var(--bg-secondary)" : "rgba(74,124,89,0.1)", color: accent }}>
        {isPaid ? <Coins className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <p className="font-bold text-base mb-1.5 text-[var(--text-heading)]"
          style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
          {isPaid ? "Paid Bounty" : "Volunteer Task"}
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]"
          style={{ fontFamily:"var(--font-roboto)" }}>
          {isPaid
            ? "Workers earn G$ when their submission is approved. Bounty is locked in smart contract escrow at task creation."
            : "No G$ payment. Workers contribute for community impact and earn on-chain reputation NFT points toward higher tiers."}
        </p>
      </div>
      {selected && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color:accent }} />}
    </button>
  );
}

export default function PostTask() {
  const router = useRouter();
  const [taskType, setTaskType] = useState<TaskType>(null);
  const [step, setStep]         = useState(0);
  const [values, setValues]     = useState<TaskFormValues>(DEFAULT_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});

  const { createTask, isWriting, isConfirming, isSuccess, createdTaskId, reset: resetHook } = useCreateTask();
  const submitting = isWriting || isConfirming;

  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => router.push(`/tasks/${createdTaskId?.toString() ?? ""}`), 2000);
    return () => clearTimeout(t);
  }, [isSuccess, createdTaskId, router]);

  const onChange = useCallback((key: keyof TaskFormValues, value: string | number | VerificationMethod) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  const handleSelectType = (t: TaskType) => {
    setTaskType(t);
    if (t === "volunteer") {
      setValues(prev => ({
        ...prev,
        bountyPerWorker: "0",
        paymentToken: "0x0000000000000000000000000000000000000000",
      }));
    }
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
      await createTask({
        title:              values.title.trim(),
        description:        values.description.trim(),
        category:           values.category,
        bountyPerWorker:    taskType === "volunteer" ? "0" : (values.bountyPerWorker || "0"),
        paymentToken:       taskType === "volunteer"
          ? "0x0000000000000000000000000000000000000000"
          : values.paymentToken as `0x${string}`,
        maxWorkers:         parseInt(values.maxWorkers, 10),
        deadline:           Math.floor(new Date(values.deadline).getTime() / 1000),
        verificationMethod: values.verificationMethod,
        verificationRef:    values.verificationRef.trim(),
      }, GOOD_DOLLAR_DECIMALS);
    } catch (err) {
      console.error("[PostTask]", err);
    }
  };

  const isTypeStep = taskType === null;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-12 gap-6">

      {/* Back nav — no X button */}
      <button
        onClick={() => {
          if (!isTypeStep && step > 0) { handleBack(); return; }
          if (!isTypeStep && step === 0) { setTaskType(null); resetHook(); return; }
          router.push("/tasks");
        }}
        disabled={submitting}
        className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors w-fit disabled:opacity-40"
        style={{ fontFamily:"var(--font-nunito),sans-serif" }}
      >
        <ArrowLeft className="w-4 h-4" />
        {isTypeStep
          ? "Back to Tasks"
          : step === 0
          ? "Change task type"
          : `Back to ${STEPS[step - 1]}`}
      </button>

      {/* Page title */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--brown-400)] mb-1.5"
          style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
          {isTypeStep ? "New Task" : isSuccess ? "Done" : `Step ${step + 1} of ${STEPS.length}`}
        </div>
        <h1 className="font-bold text-[clamp(1.5rem,3vw,2rem)] text-[var(--text-heading)]"
          style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
          {isTypeStep ? "Post a Task" : isSuccess ? "Task Created!" : STEPS[step]}
        </h1>
        {!isTypeStep && !isSuccess && (
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)] mt-1"
            style={{ fontFamily:"var(--font-roboto)" }}>
            {taskType === "paid" ? "💰 Paid Bounty" : "🌱 Volunteer Task"}
            <button
              onClick={() => { setTaskType(null); setStep(0); setValues(DEFAULT_FORM); resetHook(); }}
              className="underline text-xs text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-0 hover:text-[var(--text-heading)] transition-colors">
              Change
            </button>
          </p>
        )}
      </div>
      {!isTypeStep && !isSuccess && <StepIndicator current={step} />}

      {isSuccess ? (
        <div className="flex flex-col items-center justify-center gap-5 py-16 text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background:"rgba(74,124,89,0.1)" }}>
            <CheckCircle2 className="w-8 h-8" style={{ color:"var(--success)" }} />
          </div>
          <div>
            <p className="font-bold text-xl text-[var(--text-heading)] mb-1.5"
              style={{ fontFamily:"var(--font-telegraf)" }}>
              Task #{createdTaskId?.toString()} Created!
            </p>
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
              Your task is live on-chain. Taking you there now…
            </p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-[var(--brown-400)]" />
        </div>

      ) : isTypeStep ? (
        /* Type selection — open layout, no card border */
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
            What kind of task do you want to post?
          </p>
          <TypeCard type="paid"      selected={taskType === "paid"}      onSelect={() => handleSelectType("paid")} />
          <TypeCard type="volunteer" selected={taskType === "volunteer"} onSelect={() => handleSelectType("volunteer")} />
        </div>

      ) : (
        /* Form steps — card wrapper */
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-8">
          {step === 0 ? (
            <StepTaskDetails    values={values} errors={errors} onChange={onChange} />
          ) : step === 1 ? (
            <StepPaymentWorkers values={values} errors={errors} onChange={onChange} isVolunteer={taskType === "volunteer"} />
          ) : step === 2 ? (
            <StepVerification   values={values} errors={errors} onChange={onChange} />
          ) : (
            <StepReview         values={values} taskType={taskType!} />
          )}
        </div>
      )}

      {/* Footer navigation */}
      {!isSuccess && (
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-2">
          {/* Left: back/cancel */}
          <button type="button" disabled={submitting}
            onClick={() => {
              if (isTypeStep) { router.push("/tasks"); return; }
              if (step === 0) { setTaskType(null); resetHook(); return; }
              handleBack();
            }}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--border)] bg-transparent text-[var(--text-secondary)] cursor-pointer transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
            style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
            {step > 0 && !isTypeStep && <ChevronLeft className="w-4 h-4" />}
            {isTypeStep ? "Cancel" : step === 0 ? "← Change type" : "Back"}
          </button>

          {/* Right: continue/submit */}
          {isTypeStep && taskType && (
            <button type="button" onClick={() => setStep(0)}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-400)] transition-colors"
              style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {!isTypeStep && (
            step < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext}
                className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-400)] transition-colors"
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-400)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{isWriting ? "Confirm in wallet…" : "Confirming…"}</>
                  : <><FileText className="w-4 h-4" />Create Task</>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}