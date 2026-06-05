import { Info } from "lucide-react";
import { PLATFORM_FEE_BPS } from "./share";

interface Props {
  bounty: string;
  workers: string;
}

export function CostSummary({ bounty, workers }: Props) {
  const b = parseFloat(bounty) || 0;
  const w = parseInt(workers, 10) || 0;
  const gross = b * w;
  const fee = (gross * PLATFORM_FEE_BPS) / 10000;
  const total = gross + fee;

  if (b === 0 || w === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4 space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-3.5 h-3.5 text-[var(--brown-400)]" />
        <span
          className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          Cost Breakdown
        </span>
      </div>
      {[
        { label: "Bounty per worker", value: `G$ ${b.toFixed(2)}` },
        { label: `× ${w} workers`, value: `G$ ${gross.toFixed(2)}` },
        {
          label: `Platform fee (${PLATFORM_FEE_BPS / 100}%)`,
          value: `G$ ${fee.toFixed(2)}`,
        },
      ].map((row) => (
        <div
          key={row.label}
          className="flex justify-between text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto), sans-serif" }}
        >
          <span>{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
      <div className="pt-2 border-t border-[var(--border)] flex justify-between">
        <span
          className="text-sm font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          Total to deposit
        </span>
        <span
          className="text-sm font-bold text-[var(--brown-500)]"
          style={{ fontFamily: "var(--font-telegraf), 'Space Grotesk', sans-serif" }}
        >
          G$ {total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}