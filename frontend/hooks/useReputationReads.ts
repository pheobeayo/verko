"use client";

import { useReadContract } from "wagmi";
import { celo } from "viem/chains";
import reputationAbi from "@/constant/escrow.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.workerContract;

const baseContract = {
  address: CONTRACT_ADDRESS,
  abi: reputationAbi as any,
  chainId: celo.id,
} as const;

export interface WorkerStats {
  tasksCompleted: bigint;
  tasksAttempted: bigint;
  totalEarned:    bigint;
  tier:           number;
  tokenId:        bigint;
}


export function useWorkerStats(worker: `0x${string}` | undefined) {
  return useReadContract({
    ...baseContract,
    functionName: "getStats",
    args: worker ? [worker] : undefined,
    query: {
      enabled:   !!worker,
      staleTime: 30_000,
      select:    (data) => data as unknown as WorkerStats,
    },
  });
}


export function useWorkerTier(worker: `0x${string}` | undefined) {
  return useReadContract({
    ...baseContract,
    functionName: "getTier",
    args: worker ? [worker] : undefined,
    query: {
      enabled:   !!worker,
      staleTime: 30_000,
      select:    (data) => Number(data as bigint),
    },
  });
}


export function useWorkerApprovalRate(worker: `0x${string}` | undefined) {
  return useReadContract({
    ...baseContract,
    functionName: "approvalRate",
    args: worker ? [worker] : undefined,
    query: {
      enabled:   !!worker,
      staleTime: 30_000,
      select:    (data) => Number(data as bigint) / 100, 
    },
  });
}


export function useReputationNFTOwner(tokenId: bigint | number | undefined) {
  return useReadContract({
    ...baseContract,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: {
      enabled:   tokenId !== undefined,
      staleTime: 60_000,
      select:    (data) => data as `0x${string}`,
    },
  });
}


export function useReputationTokenURI(tokenId: bigint | number | undefined) {
  return useReadContract({
    ...baseContract,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: {
      enabled:   tokenId !== undefined,
      staleTime: 60_000,
      select:    (data) => data as string,
    },
  });
}


export function useReputationTotalSupply() {
  return useReadContract({
    ...baseContract,
    functionName: "totalSupply",
    query: {
      staleTime: 30_000,
      select:    (data) => Number(data as bigint),
    },
  });
}


export function useWorkerProfile(worker: `0x${string}` | undefined) {
  const stats        = useWorkerStats(worker);
  const tier         = useWorkerTier(worker);
  const approvalRate = useWorkerApprovalRate(worker);

  const TIER_LABEL: Record<number, string> = {
    0: "Newcomer",
    1: "Trusted",
    2: "Expert",
    3: "Elite",
  };

  return {
    stats:          stats.data,
    tier:           tier.data ?? 0,
    tierLabel:      TIER_LABEL[tier.data ?? 0],
    approvalRate:   approvalRate.data ?? 0,
    tasksCompleted: stats.data?.tasksCompleted ?? 0n,
    tasksAttempted: stats.data?.tasksAttempted ?? 0n,
    totalEarned:    stats.data?.totalEarned ?? 0n,
    tokenId:        stats.data?.tokenId ?? 0n,
    hasNFT:         (stats.data?.tokenId ?? 0n) > 0n,
    isLoading:      stats.isLoading || tier.isLoading || approvalRate.isLoading,
    error:          stats.error ?? tier.error ?? approvalRate.error,
    refetch: async () => {
      await stats.refetch();
      await tier.refetch();
      await approvalRate.refetch();
    },
  };
}