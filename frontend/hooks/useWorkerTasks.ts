"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem } from "viem";
import { celo } from "viem/chains";
import { Task } from "@/types/contract";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract as `0x${string}`;


const DEPLOY_BLOCK = 69708403n;

export function useWorkerTasks(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient({ chainId: celo.id });
  const [joinedTaskIds, setJoinedTaskIds] = useState<bigint[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem(
            "event WorkerJoined(uint256 indexed taskId, address indexed worker)"
          ),
          args: { worker: address },
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        });

        const ids = [...new Set(logs.map((l) => l.args.taskId as bigint))];
        setJoinedTaskIds(ids);
      } catch (err) {
        console.error("[useWorkerTasks] getLogs failed:", err);
        setJoinedTaskIds([]);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [address, publicClient]);

  const taskReads = useReadContracts({
    contracts: joinedTaskIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: abi as any,
      functionName: "getTask",
      args: [id],
    })),
    query: { enabled: joinedTaskIds.length > 0 },
  });

  const tasks = (taskReads.data ?? [])
    .map((r) => r.result as Task | undefined)
    .filter((t): t is Task => !!t);

  return {
    tasks,
    isLoading: isLoadingEvents || taskReads.isLoading,
    joinedTaskIds,
  };
}