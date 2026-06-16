import { useReadContract, useReadContracts } from "wagmi";
import { useMemo } from "react";
import { celo } from "viem/chains";
import abi from "@/constant/abi.json";
import { Submission } from "@/types/contract";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract;

const baseContract = {
  address: CONTRACT_ADDRESS,
  abi: abi as any,
  chainId: celo.id,
} as const;

export function useSubmission(
  taskId: bigint | number | undefined,
  worker: `0x${string}` | undefined,
) {
  return useReadContract({
    ...baseContract,
    functionName: "getSubmission",
    args: taskId !== undefined && worker ? [BigInt(taskId), worker] : undefined,
    query: {
      enabled: taskId !== undefined && !!worker,
      staleTime: 10_000,
      select: (data) => data as unknown as Submission,
    },
  });
}

export function useSubmissions(
  pairs: Array<{ taskId: bigint | number; worker: `0x${string}` }>,
) {
  const contracts = useMemo(
    () =>
      pairs.map((p) => ({
        ...baseContract,
        functionName: "getSubmission" as const,
        args: [BigInt(p.taskId), p.worker] as const,
      })),
    [pairs],
  );

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: { enabled: pairs.length > 0, staleTime: 10_000 },
  });

  const submissions = useMemo<Submission[]>(() => {
    if (!data) return [];
    return data
      .filter((r) => r.status === "success" && r.result)
      .map((r) => r.result as unknown as Submission);
  }, [data]);

  return { submissions, isLoading, error, refetch };
}

export function useTaskSubmissions(taskId: bigint | number | undefined) {
  const {
    data: workers,
    isLoading: isLoadingWorkers,
    error: workersError,
    refetch: refetchWorkers,
  } = useReadContract({
    ...baseContract,
    functionName: "getTaskWorkers",
    args: taskId !== undefined ? [BigInt(taskId)] : undefined,
    query: {
      enabled: taskId !== undefined,
      staleTime: 10_000,
      select: (data) => data as readonly `0x${string}`[],
    },
  });

  const contracts = useMemo(() => {
    if (!workers || taskId === undefined) return [];
    return workers.map((worker) => ({
      ...baseContract,
      functionName: "getSubmission" as const,
      args: [BigInt(taskId), worker] as const,
    }));
  }, [workers, taskId]);

  const {
    data: results,
    isLoading: isLoadingSubmissions,
    error: submissionsError,
    refetch: refetchSubmissions,
  } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0, staleTime: 10_000 },
  });

  const submissions = useMemo<Submission[]>(() => {
    if (!results) return [];
    return results
      .filter((r) => r.status === "success" && r.result)
      .map((r) => r.result as unknown as Submission);
  }, [results]);

  return {
    submissions,
    workers: workers ?? [],
    isLoading: isLoadingWorkers || isLoadingSubmissions,
    error: workersError ?? submissionsError,
    refetch: async () => {
      await refetchWorkers();
      await refetchSubmissions();
    },
  };
}