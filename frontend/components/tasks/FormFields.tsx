"use client";

import { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

// ─── Label ────────────────────────────────────────────────────────────────────

interface LabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}

export function Label({ htmlFor, children, required, hint }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide"
      style={{ fontFamily: "var(--font-nunito), sans-serif" }}
    >
      {children}
      {required && <span className="text-[var(--error)] ml-1">*</span>}
      {hint && (
        <span
          className="ml-2 text-[10px] font-normal normal-case text-[var(--text-muted)] tracking-normal"
          style={{ fontFamily: "var(--font-roboto), sans-serif" }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

// ─── Error message ────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-1 text-xs text-[var(--error)]"
      style={{ fontFamily: "var(--font-roboto), sans-serif" }}
    >
      {message}
    </p>
  );
}

// ─── Text input ───────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: ReactNode;
  suffix?: string;
}

export function Input({ error, icon, suffix, className = "", ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] 
          placeholder:text-[var(--text-muted)] outline-none transition-all duration-200
          border-[var(--border)]
          focus:border-[var(--brown-400)] focus:ring-2 focus:ring-[var(--brown-300)]/30
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? "pl-9" : ""}
          ${suffix ? "pr-16" : ""}
          ${error ? "border-[var(--error)] focus:ring-red-200/30" : ""}
          ${className}`}
        style={{ fontFamily: "var(--font-roboto), sans-serif" }}
      />
      {suffix && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--brown-400)]"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]
        placeholder:text-[var(--text-muted)] outline-none transition-all duration-200
        border-[var(--border)] resize-none
        focus:border-[var(--brown-400)] focus:ring-2 focus:ring-[var(--brown-300)]/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? "border-[var(--error)]" : ""}
        ${className}`}
      style={{ fontFamily: "var(--font-roboto), sans-serif" }}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ error, options, placeholder, className = "", ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]
        outline-none transition-all duration-200 cursor-pointer appearance-none
        border-[var(--border)]
        focus:border-[var(--brown-400)] focus:ring-2 focus:ring-[var(--brown-300)]/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? "border-[var(--error)]" : ""}
        ${className}`}
      style={{
        fontFamily: "var(--font-roboto), sans-serif",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c47a3a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: "36px",
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0">
      <Label htmlFor={htmlFor} required={required} hint={hint}>
        {label}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function FormDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span
        className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest"
        style={{ fontFamily: "var(--font-nunito), sans-serif" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}
