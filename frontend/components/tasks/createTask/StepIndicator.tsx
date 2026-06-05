import { CheckCircle2 } from "lucide-react";
import { STEPS } from "./share";

interface Props {
  current: number;
}

export function StepIndicator({ current }: Props) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < current
                  ? "bg-[var(--brown-500)] text-[var(--cream-100)]"
                  : i === current
                  ? "bg-[var(--brown-400)] text-[var(--cream-100)] ring-2 ring-[var(--brown-200)]"
                  : "bg-[var(--border)] text-[var(--text-muted)]"
              }`}
              style={{ fontFamily: "var(--font-nunito), sans-serif" }}
            >
              {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-[10px] hidden sm:block whitespace-nowrap font-medium ${
                i === current ? "text-[var(--brown-500)]" : "text-[var(--text-muted)]"
              }`}
              style={{ fontFamily: "var(--font-roboto), sans-serif" }}
            >
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px mx-1 transition-all duration-300 ${
                i < current ? "bg-[var(--brown-400)]" : "bg-[var(--border)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}