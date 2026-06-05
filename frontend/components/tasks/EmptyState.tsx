"use client";

import { Search, Plus } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateTask: () => void;
}

export default function EmptyState({ hasFilters, onClearFilters, onCreateTask }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-[var(--text-muted)]" />
      </div>

      <h3
        className="text-base font-bold text-[var(--text-primary)] mb-2"
        style={{ fontFamily: "var(--font-nunito), sans-serif" }}
      >
        {hasFilters ? "No tasks match your filters" : "No tasks yet"}
      </h3>

      <p
        className="text-sm text-[var(--text-muted)] max-w-xs mb-6"
        style={{ fontFamily: "var(--font-roboto), sans-serif" }}
      >
        {hasFilters
          ? "Try adjusting your search or filters to find tasks that match."
          : "Be the first to post a task and get work done by verified humans."}
      </p>

      <div className="flex gap-3">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            Clear Filters
          </button>
        )}
        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brown-500)] text-[var(--cream-100)] text-sm font-semibold hover:bg-[var(--brown-600)] transition-colors"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          <Plus className="w-4 h-4" />
          Post a Task
        </button>
      </div>
    </div>
  );
}
