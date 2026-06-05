import { AlertCircle } from "lucide-react";
import { TaskFormValues, VERIFICATION_METHOD_LABEL } from "@/types/contract";
import { PLATFORM_FEE_BPS } from "./share";

interface Props {
  values: TaskFormValues;
  taskType?: "paid" | "volunteer"; // optional for backward compat
}

export function StepReview({ values, taskType }: Props) {
  const isVolunteer = taskType === "volunteer" || parseFloat(values.bountyPerWorker) === 0;
  const bounty  = parseFloat(values.bountyPerWorker) || 0;
  const workers = parseInt(values.maxWorkers, 10) || 0;
  const gross   = bounty * workers;
  const fee     = (gross * PLATFORM_FEE_BPS) / 10000;

  const rows = [
    { label: "Title",         value: values.title || "—" },
    { label: "Category",      value: values.category || "—" },
    { label: "Task Type",     value: isVolunteer ? "🌱 Volunteer" : "💰 Paid Bounty" },
    { label: "Max Workers",   value: workers.toLocaleString() },
    {
      label: "Bounty / Worker",
      value: isVolunteer ? "Unpaid (volunteer)" : `G$ ${bounty.toFixed(2)}`,
    },
    ...(!isVolunteer ? [
      { label: "Platform Fee",  value: `G$ ${fee.toFixed(2)}` },
      { label: "Total Deposit", value: `G$ ${(gross + fee).toFixed(2)}` },
    ] : []),
    {
      label: "Deadline",
      value: values.deadline ? new Date(values.deadline).toLocaleString() : "—",
    },
    { label: "Verification", value: VERIFICATION_METHOD_LABEL[values.verificationMethod] },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between px-4 py-3 text-sm border-b last:border-b-0 border-[var(--border)] ${
              i % 2 === 0 ? "bg-[var(--bg-card)]" : "bg-[var(--bg-secondary)]/40"
            }`}
          >
            <span className="text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto), sans-serif" }}>
              {row.label}
            </span>
            <span className="font-semibold text-[var(--text-primary)] text-right max-w-[55%] truncate"
              style={{ fontFamily: "var(--font-nunito), sans-serif" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {values.description && (
        <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-card)]">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2"
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}>
            Description
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed"
            style={{ fontFamily: "var(--font-roboto), sans-serif" }}>
            {values.description}
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl border"
        style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.25)" }}>
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#b45309" }} />
        <p className="text-xs leading-relaxed" style={{ color: "#92400e", fontFamily: "var(--font-roboto), sans-serif" }}>
          Submitting will call{" "}
          <code className="font-mono px-1 rounded" style={{ background: "rgba(245,158,11,0.12)" }}>
            createTask()
          </code>{" "}
          on the TaskEscrow contract.
          {!isVolunteer && bounty > 0 &&
            ` G$ ${(gross + fee).toFixed(2)} will be transferred from your wallet to the escrow.`}{" "}
          Ensure your wallet is connected to Celo Sepolia
          {!isVolunteer && " and you have approved the token spend"} before proceeding.
        </p>
      </div>
    </div>
  );
}