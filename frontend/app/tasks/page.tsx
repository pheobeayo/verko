"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { Loader2, TrendingUp, Users, Zap, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import TaskCard from "@/components/tasks/TaskCard";
import EmptyState from "@/components/tasks/EmptyState";
import TasksGridSkeleton from "@/components/tasks/TasksGridSkeleton";
import TasksError from "@/components/tasks/TasksError";
import FilterBar, { type TaskFilters } from "@/components/tasks/FilterBar";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { ClaimBanner }        from "@/components/verification/ClaimBanner";
import { Task, TaskStatus } from "@/types/contract";
import { useTasks } from "@/hooks/useTaskReads";

const DEFAULT_FILTERS: TaskFilters = {
  search: "", status: "all", category: "", sortBy: "newest", paidOnly: false,
};

const TASKS_PER_PAGE = 6;

interface StatCardProps { icon: React.ReactNode; value: string | number; label: string; color: string; }

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 flex items-center gap-4"
      style={{ boxShadow: "0 1px 6px rgba(45,26,10,0.06)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-xl leading-none text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
          {value}
        </p>
        <p className="text-xs mt-0.5 text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase = "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-150 border cursor-pointer";

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        className={`${btnBase} border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brown-400)] hover:text-[var(--brown-500)] disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-[var(--text-muted)]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`${btnBase} ${p === page
              ? "bg-[var(--brown-500)] text-[var(--cream-100)] border-[var(--brown-500)] shadow-sm"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brown-400)] hover:text-[var(--brown-500)]"
            }`}
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className={`${btnBase} border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brown-400)] hover:text-[var(--brown-500)] disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [page, setPage]       = useState(1);
  const router                = useRouter();
  const { isConnected, status } = useAppKitAccount();
  const { tasks, isLoading, error, refetch } = useTasks();

  useEffect(() => {
    if (status !== "reconnecting" && !isConnected) router.replace("/");
  }, [isConnected, status, router]);

  useEffect(() => { setPage(1); }, [filters]);

  const filteredTasks = useMemo(() => {
    let r = [...tasks];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      r = r.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    if (filters.status !== "all") r = r.filter(t => t.status === filters.status);
    if (filters.category) r = r.filter(t => t.category === filters.category);
    if (filters.paidOnly) r = r.filter(t => t.isPaid && t.bountyPerWorker > 0n);
    r.sort((a, b) => {
      if (filters.sortBy === "bounty")   return Number(b.bountyPerWorker - a.bountyPerWorker);
      if (filters.sortBy === "deadline") return Number(a.deadline - b.deadline);
      if (filters.sortBy === "spots")    return (b.maxWorkers - b.currentWorkers) - (a.maxWorkers - a.currentWorkers);
      return Number(b.id - a.id);
    });
    return r;
  }, [tasks, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const pagedTasks = filteredTasks.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);

  const openCount = tasks.filter(t => t.status === TaskStatus.Open).length;
  const paidCount = tasks.filter(t => t.isPaid).length;
  const hasFilters = filters.status !== "all" || filters.category !== "" || filters.paidOnly || filters.search !== "";

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigate to task detail page instead of opening drawer
  const handleViewTask = (task: Task) => {
    router.push(`/tasks/${task.id.toString()}`);
  };

  if (status === "reconnecting" || !isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brown-500)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ClaimBanner />
      <VerificationBanner />

      {/* Section title */}
      <div>
        <h2 className="font-bold text-xl text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
          Task Overview
        </h2>
        <p className="text-xs mt-1 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          {isLoading ? "Loading tasks…" : `${tasks.length} tasks on-chain · ${openCount} open now`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-4">
        <StatCard icon={<Zap        className="w-4 h-4" />} value={openCount}    label="Open tasks"     color="#c47a3a" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} value={paidCount}    label="Paid tasks"     color="#a78bfa" />
        <StatCard icon={<Users      className="w-4 h-4" />} value={tasks.length} label="Total on-chain" color="#34d399" />
        <StatCard icon={<Globe      className="w-4 h-4" />} value="Celo"         label="Network"        color="#fbbf24" />
      </div>

      {/* Filter bar + Post button */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            totalCount={tasks.length}
            filteredCount={filteredTasks.length}
          />
        </div>
        <Link
          href="/tasks/post"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold no-underline whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brown-400)] bg-[var(--brown-500)] text-[var(--cream-100)]"
          style={{ fontFamily: "var(--font-nunito),sans-serif" }}
        >
          + Post a Task
        </Link>
      </div>

      {/* Task grid */}
      {isLoading ? (
        <TasksGridSkeleton />
      ) : error ? (
        <TasksError error={error} onRetry={() => refetch()} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          onCreateTask={() => router.push("/tasks/post")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedTasks.map(task => (
              <TaskCard
                key={task.id.toString()}
                task={task}
                onView={handleViewTask}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              Showing {(page - 1) * TASKS_PER_PAGE + 1}–{Math.min(page * TASKS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length} tasks
            </p>
          </div>
        </>
      )}
    </div>
  );
}