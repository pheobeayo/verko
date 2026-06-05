"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { TaskStatus, TASK_STATUS_LABEL, TASK_CATEGORIES } from "@/types/contract";

export interface TaskFilters {
  search: string;
  status: TaskStatus | "all";
  category: string;
  sortBy: "newest" | "bounty" | "deadline" | "spots";
  paidOnly: boolean;
}

interface FilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: TaskStatus.Open, label: "Open" },
  { value: TaskStatus.InProgress, label: "In Progress" },
  { value: TaskStatus.Completed, label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "bounty", label: "Highest Bounty" },
  { value: "deadline", label: "Soonest Deadline" },
  { value: "spots", label: "Most Spots" },
];

export default function FilterBar({ filters, onChange, totalCount, filteredCount }: FilterBarProps) {
  const update = (partial: Partial<TaskFilters>) =>
    onChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.category !== "" ||
    filters.paidOnly ||
    filters.search !== "";

  return (
    <div className="space-y-3">
      {/* Search + quick filters row */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brown-400)] focus:ring-2 focus:ring-[var(--brown-300)]/30 transition-all"
            style={{ fontFamily: "var(--font-roboto), sans-serif" }}
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Paid only toggle */}
        <button
          onClick={() => update({ paidOnly: !filters.paidOnly })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            filters.paidOnly
              ? "bg-[var(--brown-500)] text-[var(--cream-100)] border-[var(--brown-500)]"
              : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brown-300)] bg-[var(--bg-card)]"
          }`}
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          💰 Paid Only
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onChange({
                search: "",
                status: "all",
                category: "",
                sortBy: "newest",
                paidOnly: false,
              })
            }
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--error)] hover:border-red-300 transition-colors bg-[var(--bg-card)]"
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Dropdowns row */}
      <div className="flex gap-2 flex-wrap items-center">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) =>
            update({ status: e.target.value === "all" ? "all" : (parseInt(e.target.value) as TaskStatus) })
          }
          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--brown-400)] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => update({ category: e.target.value })}
          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--brown-400)] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          <option value="">All Categories</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as TaskFilters["sortBy"] })}
          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--brown-400)] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Result count */}
        <span
          className="ml-auto text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto), sans-serif" }}
        >
          {filteredCount === totalCount
            ? `${totalCount} tasks`
            : `${filteredCount} of ${totalCount} tasks`}
        </span>
      </div>

      {/* Active category chips */}
      {filters.category && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-roboto), sans-serif" }}>
            Filtered by:
          </span>
          <button
            onClick={() => update({ category: "" })}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--brown-100)] dark:bg-[var(--brown-800)] text-[var(--brown-600)] dark:text-[var(--brown-200)] hover:bg-[var(--brown-200)] transition-colors"
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            {filters.category}
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
