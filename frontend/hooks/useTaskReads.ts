import { useReadContract, useReadContracts } from "wagmi";
import { useMemo } from "react";
import { celo } from "viem/chains";
import abiJson from "@/constant/abi.json";
import type { Abi } from "viem";
import { Task } from "@/types/contract";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const abi = abiJson as Abi;

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract;

const baseContract = {
  address: CONTRACT_ADDRESS,
  abi,
  chainId: celo.id,
} as const;


export function useTaskCount() {
  return useReadContract({
    ...baseContract,
    functionName: "taskCount",
    query: {
      staleTime: 10_000,
      select: (data) => Number(data as bigint),
    },
  });
}

export function useTask(taskId: bigint | number | undefined) {
  return useReadContract({
    ...baseContract,
    functionName: "getTask",
    args: taskId !== undefined ? [BigInt(taskId)] : undefined,
    query: {
      enabled: taskId !== undefined,
      staleTime: 10_000,
      select: (data) => data as unknown as Task,
    },
  });
}

export function useTasks() {
  const {
    data: count = 0,
    isLoading: isLoadingCount,
    error: countError,
    refetch: refetchCount,
  } = useTaskCount();

  const contracts = useMemo(() => {
    if (count === 0) return [];
    // Tasks assumed 1-indexed. Change to BigInt(i) if your contract starts at 0.
    return Array.from({ length: count }, (_, i) => ({
      ...baseContract,
      functionName: "getTask" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [count]);

  const {
    data: results,
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
  } = useReadContracts({
    contracts,
    query: {
      enabled: count > 0,
      staleTime: 10_000,
    },
  });

  const tasks = useMemo<Task[]>(() => {
    if (!results) return [];
    return results
      .filter((r) => r.status === "success" && r.result)
      .map((r) => r.result as unknown as Task);
  }, [results]);

  return {
    tasks,
    taskCount: count,
    isLoading: isLoadingCount || isLoadingTasks,
    error: countError ?? tasksError,
    refetch: async () => {
      await refetchCount();
      await refetchTasks();
    },
  };
}