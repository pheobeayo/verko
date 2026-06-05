import { Wallet, Users, Clock } from "lucide-react";
import { Field, Input } from "@/components/tasks/FormFields";
import { minDeadline } from "@/lib/taskUtils";
import { CELO_G_DOLLAR, type StepProps } from "./share";
import { CostSummary } from "./CostSummary";

// Extend StepProps with the optional isVolunteer flag
interface StepPaymentWorkersProps extends StepProps {
  isVolunteer?: boolean;
}

export function StepPaymentWorkers({ values, errors, onChange, isVolunteer = false }: StepPaymentWorkersProps) {
  const isPaid = !isVolunteer && parseFloat(values.bountyPerWorker) > 0;

  return (
    <div className="space-y-4">
      {/* Volunteer notice */}
      {isVolunteer && (
        <div className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "rgba(74,124,89,0.06)", borderColor: "rgba(74,124,89,0.25)" }}>
          <span className="text-lg shrink-0">🌱</span>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--success)", fontFamily: "var(--font-nunito),sans-serif" }}>
              Volunteer task — no payment
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-roboto),sans-serif" }}>
              Workers contribute freely. Each approved submission adds reputation points to their on-chain soul-bound NFT tier.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Bounty field — hidden for volunteer */}
        {!isVolunteer && (
          <Field
            label="Bounty per Worker"
            htmlFor="bountyPerWorker"
            hint="Leave 0 for unpaid / volunteer tasks"
            error={errors.bountyPerWorker}
          >
            <Input
              id="bountyPerWorker"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={values.bountyPerWorker}
              onChange={(e) => onChange("bountyPerWorker", e.target.value)}
              suffix="G$"
              icon={<Wallet className="w-3.5 h-3.5" />}
              error={errors.bountyPerWorker}
            />
          </Field>
        )}

        <Field label="Max Workers" htmlFor="maxWorkers" required error={errors.maxWorkers}>
          <Input
            id="maxWorkers"
            type="number"
            min="1"
            max="10000"
            placeholder="e.g. 50"
            value={values.maxWorkers}
            onChange={(e) => onChange("maxWorkers", e.target.value)}
            icon={<Users className="w-3.5 h-3.5" />}
            error={errors.maxWorkers}
          />
        </Field>
      </div>

      {/* Payment token — only for paid tasks */}
      {isPaid && (
        <Field
          label="Payment Token Address"
          htmlFor="paymentToken"
          required
          error={errors.paymentToken}
        >
          <Input
            id="paymentToken"
            placeholder="0x..."
            value={values.paymentToken}
            onChange={(e) => onChange("paymentToken", e.target.value)}
            error={errors.paymentToken}
          />
          <div className="flex gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => onChange("paymentToken", CELO_G_DOLLAR)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors font-medium ${
                values.paymentToken === CELO_G_DOLLAR
                  ? "bg-[var(--brown-500)] text-[var(--cream-100)] border-[var(--brown-500)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brown-300)]"
              }`}
              style={{ fontFamily: "var(--font-nunito), sans-serif" }}
            >
              G$ (GoodDollar)
            </button>
          </div>
        </Field>
      )}

      <Field label="Task Deadline" htmlFor="deadline" required error={errors.deadline}>
        <Input
          id="deadline"
          type="datetime-local"
          value={values.deadline}
          min={minDeadline()}
          onChange={(e) => onChange("deadline", e.target.value)}
          icon={<Clock className="w-3.5 h-3.5" />}
          error={errors.deadline}
        />
      </Field>

      {!isVolunteer && (
        <CostSummary bounty={values.bountyPerWorker} workers={values.maxWorkers} />
      )}
    </div>
  );
}