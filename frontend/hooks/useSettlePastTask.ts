import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { useEffect, useRef } from "react";
import { BaseError } from "viem";
import { celo } from "viem/chains";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import abi from "@/constant/abi.json";
import { CONTRACT_ADDRESSES } from "@/constant/contract/address";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.taskContract;

export function useSettlePastTask() {
  const toastShownRef = useRef<string | null>(null);
  const queryClient   = useQueryClient();
  const chainId       = useChainId();
  const writeContract = useWriteContract();
  const receipt       = useWaitForTransactionReceipt({ hash: writeContract.data });

  useEffect(() => {
    if (!receipt.isSuccess || !writeContract.data) return;
    if (toastShownRef.current === writeContract.data) return;
    toastShownRef.current = writeContract.data;
    queryClient.invalidateQueries({ queryKey: ["readContract"] });
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });
    toast.success("Task settled — escrow refunded to poster", { position: "top-center" });
  }, [receipt.isSuccess, writeContract.data, queryClient]);

  const settlePastTask = async (taskId: bigint | number) => {
    try {
      if (chainId !== celo.id) {
        toast.error("Please switch to Celo network", { position: "top-center" });
        return;
      }
      toast.info("Please confirm the transaction in your wallet", { position: "top-center" });
      return await writeContract.mutateAsync({
        address: CONTRACT_ADDRESS,
        abi: abi as any,
        functionName: "settlePastTask",
        args: [BigInt(taskId)],
        chainId: celo.id,
      });
    } catch (error) {
      const message =
        error instanceof BaseError ? error.shortMessage
        : error instanceof Error  ? error.message
        : "Failed to settle task";
      toast.error(message, { position: "top-center" });
      throw error;
    }
  };

  const reset = () => { writeContract.reset(); toastShownRef.current = null; };

  return {
    settlePastTask,
    isWriting:    writeContract.isPending,
    isConfirming: receipt.isLoading,
    isSuccess:    receipt.isSuccess,
    error:        writeContract.error ?? receipt.error,
    txHash:       writeContract.data,
    reset,
  };
}