import { Link } from "lucide-react";
import {
  VerificationMethod,
  VERIFICATION_METHOD_LABEL,
  VERIFICATION_METHOD_DESCRIPTION,
} from "@/types/contract";
import { Field, Input, Select } from "@/components/tasks/FormFields";
import { verificationRefLabel, verificationRefPlaceholder } from "@/lib/taskUtils";
import type { StepProps } from "./share";

const VERIFICATION_OPTIONS = Object.values(VerificationMethod)
  .filter((v): v is VerificationMethod => typeof v === "number")
  .map((v) => ({ value: v, label: VERIFICATION_METHOD_LABEL[v] }));

export function StepVerification({ values, errors, onChange }: StepProps) {
  const method = values.verificationMethod;

  return (
    <div className="space-y-4">
      <Field label="Verification Method" htmlFor="verificationMethod" required>
        <Select
          id="verificationMethod"
          value={method}
          onChange={(e) =>
            onChange("verificationMethod", parseInt(e.target.value) as VerificationMethod)
          }
          options={VERIFICATION_OPTIONS}
        />
      </Field>

      <div className="grid grid-cols-1 gap-2">
        {VERIFICATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange("verificationMethod", opt.value as VerificationMethod)}
            className={`flex items-start gap-3 text-left p-3 rounded-xl border transition-all duration-200 ${
              method === opt.value
                ? "border-[var(--brown-400)] bg-[var(--brown-50)] dark:bg-[var(--brown-900)]/30"
                : "border-[var(--border)] hover:border-[var(--brown-200)] bg-transparent"
            }`}
          >
            <div
              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                method === opt.value
                  ? "border-[var(--brown-500)] bg-[var(--brown-500)]"
                  : "border-[var(--border)]"
              }`}
            >
              {method === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <div>
              <div
                className="text-sm font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-nunito), sans-serif" }}
              >
                {opt.label}
              </div>
              <div
                className="text-xs text-[var(--text-muted)] mt-0.5"
                style={{ fontFamily: "var(--font-roboto), sans-serif" }}
              >
                {VERIFICATION_METHOD_DESCRIPTION[opt.value as VerificationMethod]}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Field
        label={verificationRefLabel(method)}
        htmlFor="verificationRef"
        required={method !== VerificationMethod.OnChainText}
        error={errors.verificationRef}
      >
        <Input
          id="verificationRef"
          placeholder={verificationRefPlaceholder(method)}
          value={values.verificationRef}
          onChange={(e) => onChange("verificationRef", e.target.value)}
          icon={<Link className="w-3.5 h-3.5" />}
          error={errors.verificationRef}
        />
      </Field>
    </div>
  );
}