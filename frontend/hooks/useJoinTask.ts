import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { useEffect, useRef } from "react";
import { BaseError } from "viem";
import { celo } from "viem/chains";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import abi from "@/constant/abi.json"; 
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract;

export function useJoinTask() {
  const toastShownRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const chainId = useChainId();

  const writeContract = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: writeContract.data,
  });

  useEffect(() => {
    if (!receipt.isSuccess || !writeContract.data) return;
    if (toastShownRef.current === writeContract.data) return;
    toastShownRef.current = writeContract.data;

    queryClient.invalidateQueries({ queryKey: ["readContract"] });
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });

    toast.success("Joined task successfully", { position: "top-center" });
  }, [receipt.isSuccess, writeContract.data, queryClient]);

  const joinTask = async (taskId: bigint | number) => {
    try {
      if (chainId !== celo.id) {
        toast.error("Please switch to Celo Sepolia", { position: "top-center" });
        return;
      }

      toast.info("Please confirm the transaction in your wallet", {
        position: "top-center",
      });

      const txHash = await writeContract.mutateAsync({
        address: CONTRACT_ADDRESS,
        abi: abi as any,
        functionName: "joinTask",
        args: [BigInt(taskId)],
        chainId: celo.id,
      });

      return txHash;
    } catch (error) {
      const message =
        error instanceof BaseError
          ? error.shortMessage
          : error instanceof Error
          ? error.message
          : "Failed to join task";
      toast.error(message, { position: "top-center" });
      throw error;
    }
  };

  const reset = () => {
    writeContract.reset();
    toastShownRef.current = null;
  };

  return {
    joinTask,
    isWriting: writeContract.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: writeContract.error ?? receipt.error,
    txHash: writeContract.data,
    reset,
  };
}