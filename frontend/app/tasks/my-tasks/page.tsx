"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase, ClipboardList } from "lucide-react";
import { Task, SubmissionStatus, Submission } from "@/types/contract";
import { useTasks } from "@/hooks/useTaskReads";
import { useWorkerTasks } from "@/hooks/useWorkerTasks";
import { useSubmissionNotifier } from "@/hooks/useSubmissionNotifier";
import TaskCard from "@/components/tasks/TaskCard";
import { formatGDollar } from "@/lib/taskUtils";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract as `0x${string}`;
type TabType = "worker" | "poster";

export default function MyTasksPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>("worker");

  const { tasks: allTasks, isLoading: isLoadingAll } = useTasks();
  const { tasks: workerTasks, isLoading: isLoadingWorker } = useWorkerTasks(address);

  const submissionReads = useReadContracts({
    contracts: workerTasks.map((t) => ({
      address: CONTRACT_ADDRESS,
      abi: abi as any,
      functionName: "getSubmission",
      args: [t.id, address ?? "0x0000000000000000000000000000000000000000"],
    })),
    query: {
      enabled: !!address && workerTasks.length > 0,
      refetchInterval: 30_000,
    },
  });

  const submissionMap = useMemo(() => {
    const map = new Map<bigint, Submission>();
    workerTasks.forEach((t, i) => {
      const sub = submissionReads.data?.[i]?.result as Submission | undefined;
      if (sub) map.set(t.id, sub);
    });
    return map;
  }, [workerTasks, submissionReads.data]);

  useSubmissionNotifier(address, workerTasks);

  const posterTasks = useMemo(
    () => allTasks.filter((t) => t.poster.toLowerCase() === address?.toLowerCase()),
    [allTasks, address]
  );

  const totalEarned = useMemo(() => {
    let total = 0n;
    workerTasks.forEach((t) => {
      const sub = submissionMap.get(t.id);
      if (sub?.status === SubmissionStatus.Approved && t.isPaid) {
        total += t.bountyPerWorker;
      }
    });
    return total;
  }, [workerTasks, submissionMap]);

  // Navigate to full detail page — no more drawer
  const handleViewTask = (task: Task) => {
    router.push(`/tasks/${task.id.toString()}`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
          Connect your wallet to view your tasks.
        </p>
      </div>
    );
  }

  const isLoading    = activeTab === "worker" ? isLoadingWorker : isLoadingAll;
  const displayTasks = activeTab === "worker" ? workerTasks : posterTasks;

  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 sm:flex-nowrap">
        <div>
          <h2 className="font-bold text-xl text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
            My Tasks
          </h2>
          <p className="text-xs mt-1 text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
            {isLoading ? "Loading…" : `${workerTasks.length} joined · ${posterTasks.length} posted`}
          </p>
        </div>

        {totalEarned > 0n && (
          <div className="px-4 py-2.5 rounded-[16px] border border-[var(--border)] bg-[var(--brown-50)]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-0.5"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              Total Earned
            </p>
            <p className="text-lg font-black text-[var(--brown-500)]"
              style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif" }}>
              {formatGDollar(totalEarned)}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] w-fit">
        {([
          { key: "worker", label: "Tasks I Joined", icon: <ClipboardList className="w-3.5 h-3.5" />, count: workerTasks.length },
          { key: "poster", label: "Tasks I Posted", icon: <Briefcase     className="w-3.5 h-3.5" />, count: posterTasks.length },
        ] as { key: TabType; label: string; icon: React.ReactNode; count: number }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-[var(--brown-500)] text-[var(--cream-100)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
            {tab.icon}
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.key
                ? "bg-[var(--brown-400)] text-[var(--cream-100)]"
                : "bg-[var(--border)] text-[var(--text-muted)]"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brown-400)]" />
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
            {activeTab === "worker"
              ? <ClipboardList className="w-6 h-6 text-[var(--text-muted)]" />
              : <Briefcase     className="w-6 h-6 text-[var(--text-muted)]" />}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-heading)] mb-1"
              style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
              {activeTab === "worker" ? "No tasks joined yet" : "No tasks posted yet"}
            </p>
            <p className="text-xs text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
              {activeTab === "worker"
                ? "Browse the marketplace to find work."
                : "Post a task to get work done."}
            </p>
          </div>
          <button
            onClick={() => router.push(activeTab === "worker" ? "/tasks" : "/tasks/post")}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-400)] transition-colors"
            style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
            {activeTab === "worker" ? "Browse Tasks" : "Post a Task"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === "worker"
            ? workerTasks.map((task) => {
                const sub = submissionMap.get(task.id);
                return (
                  <div key={task.id.toString()} className="relative">
                    {sub && sub.status !== SubmissionStatus.None && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          sub.status === SubmissionStatus.Approved
                            ? "bg-[rgba(74,124,89,0.1)] text-[var(--success)] border-[rgba(74,124,89,0.3)]"
                            : sub.status === SubmissionStatus.Rejected
                            ? "bg-[rgba(139,58,42,0.1)] text-[var(--error)] border-[rgba(139,58,42,0.3)]"
                            : "bg-[rgba(201,162,39,0.1)] text-[var(--gold)] border-[rgba(201,162,39,0.3)]"
                        }`} style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                          {sub.status === SubmissionStatus.Approved ? "✓ Approved"
                            : sub.status === SubmissionStatus.Rejected ? "✗ Rejected"
                            : "⏳ Under Review"}
                        </span>
                      </div>
                    )}
                    <TaskCard task={task} onView={handleViewTask} />
                  </div>
                );
              })
            : posterTasks.map((task) => (
                <TaskCard key={task.id.toString()} task={task} onView={handleViewTask} />
              ))
          }
        </div>
      )}
    </div>
  );
}