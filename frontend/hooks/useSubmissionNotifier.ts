"use client";

import { useEffect, useRef } from "react";
import { useReadContracts } from "wagmi";
import { toast } from "sonner";
import { Submission, SubmissionStatus, Task } from "@/types/contract";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract as `0x${string}`;
const STORAGE_KEY      = "verko_submission_statuses";
const POLL_INTERVAL_MS = 30_000;

type StoredStatuses = Record<string, number>;

function loadStored(): StoredStatuses {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveStored(data: StoredStatuses) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useSubmissionNotifier(
  address: `0x${string}` | undefined,
  workerTasks: Task[],
) {
  const storedRef = useRef<StoredStatuses>(loadStored());

  const submissionReads = useReadContracts({
    contracts: workerTasks.map((t) => ({
      address: CONTRACT_ADDRESS,
      abi: abi as any,
      functionName: "getSubmission",
      args: [t.id, address ?? "0x0000000000000000000000000000000000000000"],
    })),
    query: {
      enabled:          !!address && workerTasks.length > 0,
      refetchInterval:  POLL_INTERVAL_MS,
      refetchOnMount:   true,
    },
  });

  useEffect(() => {
    if (!submissionReads.data || !address) return;

    const stored  = storedRef.current;
    const updated = { ...stored };
    let changed   = false;

    submissionReads.data.forEach((read, i) => {
      const sub  = read.result as Submission | undefined;
      if (!sub) return;

      const task    = workerTasks[i];
      const key     = task.id.toString();
      const prev    = stored[key];
      const current = sub.status;

      if (prev === SubmissionStatus.Submitted && current !== SubmissionStatus.Submitted) {
        if (current === SubmissionStatus.Approved) {
          toast.success(
            `Task "${task.title}" approved${task.isPaid ? " — G$ sent to your wallet!" : ""}`,
            { position: "top-center", duration: 6000 },
          );
        } else if (current === SubmissionStatus.Rejected) {
          toast.error(
            `Submission rejected for "${task.title}" — check My Tasks for details.`,
            { position: "top-center", duration: 6000 },
          );
        }
        changed = true;
      }

      if (current === SubmissionStatus.Submitted && prev !== SubmissionStatus.Submitted) {
        changed = true;
      }

      updated[key] = current;
    });

    if (changed) {
      storedRef.current = updated;
      saveStored(updated);
    }
  }, [submissionReads.data, address, workerTasks]);
}