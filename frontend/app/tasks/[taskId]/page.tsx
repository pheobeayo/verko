"use client";

import { useState }                    from "react";
import { useParams, useRouter }        from "next/navigation";
import { ArrowLeft }                   from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { TaskStatus }                  from "@/types/contract";
import { canJoin, isExpired }          from "@/lib/taskUtils";
import { useTask }                     from "@/hooks/useTaskReads";
import { useSubmission }               from "@/hooks/useSubmissionReads";
import { useIdentityContext }          from "@/context/IdentityContext";
import abi                             from "@/constant/abi.json";
import { CONTRACT_ADDRESSES }          from "@/constant/contract/address";

import { TaskDetailHeader }   from "@/components/tasks/taskId/TaskDetailHeader";
import { TaskDetailContent }  from "@/components/tasks/taskId/TaskDetailContent";
import { TaskDetailSidebar }  from "@/components/tasks/taskId/TaskDetailSidebar";
import { TaskDetailSkeleton } from "@/components/tasks/taskId/TaskDetailUI";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract as `0x${string}`;

export default function TaskDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const taskId  = params?.taskId as string;

  const [activeTab, setActiveTab] = useState<"details" | "proof">("details");

  const { address }                  = useAccount();
  const { isVerified: isGDVerified } = useIdentityContext();
  const { data: task, isLoading }    = useTask(taskId ? BigInt(taskId) : undefined);

  const isPoster = !!address && !!task && address.toLowerCase() === task.poster.toLowerCase();

  const isPast = !!(task && (
    (isExpired(task.deadline) && (
      task.status === TaskStatus.Open ||
      task.status === TaskStatus.InProgress ||
      task.status === TaskStatus.Extended
    )) || task.status === TaskStatus.Past
  ));

  const { data: hasJoined } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi as any,
    functionName: "hasJoined",
    args: [task?.id ?? 0n, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!task && !!address && !isPoster },
  });

  const { data: submission } = useSubmission(
    task?.id,
    !isPoster ? address : undefined,
  );

  if (isLoading) return <TaskDetailSkeleton />;

  if (!task) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-sm text-[var(--text-muted)]"
        style={{ fontFamily: "var(--font-roboto),sans-serif" }}>
        Task not found.
      </p>
      <button
        onClick={() => router.push("/tasks")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Tasks
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-12">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors w-fit"
        style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
        <ArrowLeft className="w-4 h-4" />
        Back to Tasks
      </button>

      {/* Header — status bar + title + bounty pill */}
      <TaskDetailHeader task={task} />

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TaskDetailContent
          task={task}
          isPoster={isPoster}
          hasJoined={hasJoined as boolean | undefined}
          submission={submission}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TaskDetailSidebar
          task={task}
          isPoster={isPoster}
          hasJoined={hasJoined as boolean | undefined}
          isGDVerified={isGDVerified}
          isPast={isPast}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}