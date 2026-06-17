
export function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
      <span className="text-xs text-[var(--text-muted)] shrink-0 w-24 sm:w-28"
        style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
        {label}
      </span>
      <span className={`text-xs font-semibold text-[var(--text-secondary)] text-right break-all ${mono ? "font-mono" : ""}`}
        style={{ fontFamily: mono ? "monospace" : "var(--font-nunito),sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3"
      style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
      {children}
    </p>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] ${className}`}>
      {children}
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-6 w-32 rounded-xl bg-[var(--bg-secondary)]" />
      <div className="h-1.5 w-full rounded-full bg-[var(--bg-secondary)]" />
      <div className="h-10 w-3/4 rounded-xl bg-[var(--bg-secondary)]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-[20px] bg-[var(--bg-secondary)]" />
          <div className="h-64 rounded-[20px] bg-[var(--bg-secondary)]" />
        </div>
        <div className="space-y-4">
          <div className="h-36 rounded-[20px] bg-[var(--bg-secondary)]" />
          <div className="h-28 rounded-[20px] bg-[var(--bg-secondary)]" />
          <div className="h-20 rounded-[20px] bg-[var(--bg-secondary)]" />
        </div>
      </div>
    </div>
  );
}