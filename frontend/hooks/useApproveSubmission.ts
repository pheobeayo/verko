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

export function useApproveSubmission() {
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

    toast.success("Submission approved! G$ sent to worker.", { position: "top-center" });
  }, [receipt.isSuccess, writeContract.data, queryClient]);

  const approveSubmission = useCallback(
    async (taskId: bigint | number, workerAddress: `0x${string}`) => {
      try {
        toast.info("Please confirm the transaction in your wallet", { position: "top-center" });

        const txHash = await writeContract.mutateAsync({
          address: CONTRACT_ADDRESS,
          abi: abi as any,
          functionName: "approveSubmission",
          args: [BigInt(taskId), workerAddress],
          chainId: celo.id,
        });

        return txHash;
      } catch (error) {
        const message =
          error instanceof BaseError
            ? error.shortMessage
            : error instanceof Error
            ? error.message
            : "Failed to approve submission";
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
    approveSubmission,
    isWriting:    writeContract.isPending,
    isConfirming: receipt.isLoading,
    isSuccess:    receipt.isSuccess,
    error:        writeContract.error ?? receipt.error,
    txHash:       writeContract.data,
    reset,
  };
}