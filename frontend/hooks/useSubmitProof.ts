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

export function useSubmitProof() {
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

    toast.success("Proof submitted! Awaiting poster review.", { position: "top-center" });
  }, [receipt.isSuccess, writeContract.data, queryClient]);

  const submitProof = useCallback(
    async (taskId: bigint | number, proofData: string) => {
      if (!proofData.trim()) {
        toast.error("Proof cannot be empty.", { position: "top-center" });
        return;
      }
      try {
        toast.info("Please confirm the transaction in your wallet", { position: "top-center" });

        const txHash = await writeContract.mutateAsync({
          address: CONTRACT_ADDRESS,
          abi: abi as any,
          functionName: "submitProof",
          args: [BigInt(taskId), proofData.trim()],
          chainId: celo.id,
        });

        return txHash;
      } catch (error) {
        const message =
          error instanceof BaseError
            ? error.shortMessage
            : error instanceof Error
            ? error.message
            : "Failed to submit proof";
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
    submitProof,
    isWriting:    writeContract.isPending,
    isConfirming: receipt.isLoading,
    isSuccess:    receipt.isSuccess,
    error:        writeContract.error ?? receipt.error,
    txHash:       writeContract.data,
    reset,
  };
}