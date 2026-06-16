import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useReadContract,
} from "wagmi";
import { useEffect, useRef, useCallback } from "react";
import {
  BaseError,
  decodeEventLog,
  parseUnits,
  type TransactionReceipt,
  erc20Abi,
} from "viem";
import { celo } from "viem/chains";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";
import { VerificationMethod } from "@/types/contract";
import { useAppKitNetwork, useAppKitAccount } from "@reown/appkit/react";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract;

export interface CreateTaskFormData {
  title: string;
  description: string;
  category: string;
  bountyPerWorker: string;
  paymentToken: `0x${string}`;
  maxWorkers: number;
  deadline: number;
  verificationMethod: VerificationMethod;
  verificationRef: string;
}

interface TaskCreatedArgs {
  taskId: bigint;
  poster: `0x${string}`;
  isPaid: boolean;
  bountyPerWorker: bigint;
  maxWorkers: number;
  verificationMethod: number;
}

function extractTaskId(receipt: TransactionReceipt): bigint | null {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: abi as any,
        data: log.data,
        topics: log.topics,
      }) as { eventName: string; args: unknown };
      if (decoded.eventName === "TaskCreated") {
        return (decoded.args as TaskCreatedArgs).taskId;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export function useCreateTask() {
  const toastShownRef = useRef<string | null>(null);
  const queryClient   = useQueryClient();
  const { chainId }   = useAppKitNetwork();
  const { address }   = useAppKitAccount();
  const switchChain   = useSwitchChain();

  const writeContract = useWriteContract();
  const approveWrite  = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: writeContract.data,
    query: { select: extractTaskId },
  });

  const approvalReceipt = useWaitForTransactionReceipt({
    hash: approveWrite.data,
  });

  // FIX: read platformFeeBps from contract instead of hardcoding 600
  const { data: rawFeeBps } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi as any,
    functionName: "platformFeeBps",
    chainId: celo.id,
    query: { staleTime: 60_000 },
  });
  const platformFeeBps: bigint = rawFeeBps !== undefined ? BigInt(rawFeeBps as string | number | bigint) : 600n;

  useEffect(() => {
    if (!receipt.isSuccess || !writeContract.data) return;
    if (toastShownRef.current === writeContract.data) return;
    toastShownRef.current = writeContract.data;

    queryClient.invalidateQueries({ queryKey: ["readContract"] });
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });

    const taskId = receipt.data;
    toast.success(
      taskId !== null && taskId !== undefined
        ? `Task #${taskId.toString()} created successfully`
        : "Task created successfully",
      { position: "top-center" },
    );
  }, [receipt.isSuccess, receipt.data, writeContract.data, queryClient]);

  const createTask = useCallback(
    async (data: CreateTaskFormData, tokenDecimals: number = 18) => {
      try {
        if (chainId !== celo.id) {
          toast.info("Switching to Celo...", { position: "top-center" });
          await switchChain.mutateAsync({ chainId: celo.id });
        }

        const bountyFloat = parseFloat(data.bountyPerWorker || "0");
        const isPaid      = bountyFloat > 0;

        if (isPaid && address) {
          const tokenAddress = data.paymentToken as `0x${string}`;
          const bountyRaw    = parseUnits(data.bountyPerWorker, tokenDecimals);
          const gross        = bountyRaw * BigInt(data.maxWorkers);
          // FIX: use on-chain platformFeeBps instead of hardcoded 600n
          const feeBps       = platformFeeBps;
          const fee          = (gross * feeBps) / 10000n;
          const totalNeeded  = gross + fee;

          // Read current allowance
          let currentAllowance = 0n;
          try {
            const resp = await fetch("https://forno.celo.org", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0", id: 1,
                method: "eth_call",
                params: [{
                  to: tokenAddress,
                  data: `0xdd62ed3e${address.slice(2).padStart(64, "0")}${CONTRACT_ADDRESS.slice(2).padStart(64, "0")}`,
                }, "latest"],
              }),
            });
            const json = await resp.json();
            currentAllowance = BigInt(json.result ?? "0x0");
          } catch {
            currentAllowance = 0n;
          }

          if (currentAllowance < totalNeeded) {
            toast.info("Approving token spend...", { position: "top-center" });

            // FIX: approve exact amount instead of MAX_UINT256
            await approveWrite.mutateAsync({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "approve",
              args: [CONTRACT_ADDRESS, totalNeeded],
              chainId: celo.id,
            });

            toast.info("Waiting for approval to confirm...", { position: "top-center" });

            // FIX: use proper async wait instead of polling with stale closure
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error("Approval timeout")), 90_000);
              const check = setInterval(() => {
                if (approvalReceipt.isSuccess) {
                  clearInterval(check);
                  clearTimeout(timeout);
                  resolve();
                }
                if (approvalReceipt.isError) {
                  clearInterval(check);
                  clearTimeout(timeout);
                  reject(new Error("Approval failed"));
                }
              }, 1000);
            });
          }
        }

        const taskParams = {
          title:              data.title,
          description:        data.description,
          category:           data.category,
          bountyPerWorker:    isPaid ? parseUnits(data.bountyPerWorker, tokenDecimals) : 0n,
          paymentToken:       isPaid
            ? data.paymentToken
            : "0x0000000000000000000000000000000000000000" as `0x${string}`,
          maxWorkers:         data.maxWorkers,
          deadline:           BigInt(data.deadline),
          verificationMethod: data.verificationMethod,
          verificationRef:    data.verificationRef,
        };

        toast.info("Please confirm the transaction in your wallet", {
          position: "top-center",
        });

        const txHash = await writeContract.mutateAsync({
          address: CONTRACT_ADDRESS,
          abi: abi as any,
          functionName: "createTask",
          args: [taskParams],
          chainId: celo.id,
        });

        return txHash;
      } catch (error) {
        const message =
          error instanceof BaseError
            ? error.shortMessage
            : error instanceof Error
              ? error.message
              : "Failed to create task";
        toast.error(message, { position: "top-center" });
        throw error;
      }
    },
    [chainId, address, platformFeeBps, writeContract.mutateAsync, approveWrite.mutateAsync, approvalReceipt.isSuccess, approvalReceipt.isError, switchChain],
  );

  const reset = useCallback(() => {
    writeContract.reset();
    approveWrite.reset();
    toastShownRef.current = null;
  }, [writeContract.reset, approveWrite.reset]);

  return {
    createTask,
    isWriting:     writeContract.isPending || approveWrite.isPending,
    isConfirming:  receipt.isLoading || approvalReceipt.isLoading,
    isSuccess:     receipt.isSuccess,
    error:         writeContract.error ?? receipt.error ?? approveWrite.error,
    txHash:        writeContract.data,
    createdTaskId: receipt.data ?? null,
    reset,
  };
}