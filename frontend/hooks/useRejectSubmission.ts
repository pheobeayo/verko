import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useEffect, useRef, useCallback } from "react";
import { BaseError } from "viem";
import { celo } from "viem/chains";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract as `0x${string}`;

export function useRejectSubmission() {
  const toastShownRef = useRef<string | null>(null);
  const queryClient   = useQueryClient();

  const writeContract = useWriteContract();
  const receipt       = useWaitForTransactionReceipt({ hash: writeContract.data });

  useEffect(() => {
    if (!receipt.isSuccess || !writeContract.data) return;
    if (toastShownRef.current === writeContract.data) return;
    toastShownRef.current = writeContract.data;

    queryClient.invalidateQueries({ queryKey: ["readContract"] });
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });

    toast.success("Submission rejected. Worker notified.", { position: "top-center" });
  }, [receipt.isSuccess, writeContract.data, queryClient]);

  const rejectSubmission = useCallback(
    async (
      taskId: bigint | number,
      workerAddress: `0x${string}`,
      reason: string,
    ) => {
      if (!reason.trim()) {
        toast.error("Please provide a rejection reason.", { position: "top-center" });
        return;
      }
      try {
        toast.info("Please confirm the transaction in your wallet", { position: "top-center" });

        const txHash = await writeContract.mutateAsync({
          address: CONTRACT_ADDRESS,
          abi: abi as any,
          functionName: "rejectSubmission",
          args: [BigInt(taskId), workerAddress, reason.trim()],
          chainId: celo.id,
        });

        return txHash;
      } catch (error) {
        const message =
          error instanceof BaseError
            ? error.shortMessage
            : error instanceof Error
            ? error.message
            : "Failed to reject submission";
        toast.error(message, { position: "top-center" });
        throw error;
      }
    },
    [writeContract.mutateAsync],
  );

  const reset = useCallback(() => {
    writeContract.reset();
    toastShownRef.current = null;
  }, [writeContract.reset]);

  return {
    rejectSubmission,
    isWriting:    writeContract.isPending,
    isConfirming: receipt.isLoading,
    isSuccess:    receipt.isSuccess,
    error:        writeContract.error ?? receipt.error,
    txHash:       writeContract.data,
    reset,
  };
}