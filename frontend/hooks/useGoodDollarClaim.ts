"use client";

import { useCallback, useEffect, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { celo } from "wagmi/chains";
import { ClaimSDK, IdentitySDK } from "@goodsdks/citizen-sdk";
import { toast } from "sonner";

const GD_ENV = "production" as const;

export type ClaimStatus =
  | "idle"
  | "loading"
  | "can_claim"
  | "already_claimed"
  | "not_eligible"
  | "claiming"
  | "success"
  | "error";

export interface ClaimState {
  status:      ClaimStatus;
  claimable:   string;  
  nextClaim:   Date | null;
  txHash:      string | null;
  errorMsg:    string | null;
}

const INITIAL: ClaimState = {
  status:    "idle",
  claimable: "0",
  nextClaim: null,
  txHash:    null,
  errorMsg:  null,
};

export function useGoodDollarClaim() {
  const { address } = useAppKitAccount();
  const publicClient = usePublicClient({ chainId: celo.id });
  const { data: walletClient } = useWalletClient({ chainId: celo.id });

  const [state, setState] = useState<ClaimState>(INITIAL);

  // Build SDKs 
  const buildSDKs = useCallback(() => {
    if (!address || !publicClient || !walletClient) return null;
    const identitySDK = new IdentitySDK({
      account:      address as `0x${string}`,
      publicClient,
      walletClient,
      env:          GD_ENV,
    } as any);
    const claimSDK = new ClaimSDK({
      account:     address as `0x${string}`,
      publicClient: publicClient as any,
      walletClient: walletClient as any,
      identitySDK:  identitySDK as any,
      env:          GD_ENV,
    });
    return { claimSDK, identitySDK };
  }, [address, publicClient, walletClient]);

  // Check claim status 
  const checkStatus = useCallback(async () => {
    if (!address || !publicClient || !walletClient) return;

    setState(prev => ({ ...prev, status: "loading" }));

    try {
      const sdks = buildSDKs();
      if (!sdks) return;

      const walletStatus = await sdks.claimSDK.getWalletClaimStatus();
      console.log("[useGoodDollarClaim] walletStatus:", walletStatus);

      if (walletStatus.status === "not_whitelisted") {
        setState(prev => ({ ...prev, status: "not_eligible" }));
        return;
      }

      // Try to get claimable amount
      let claimableFormatted = "0";
      try {
        const claimableRaw = await sdks.claimSDK.checkEntitlement();
        const raw = claimableRaw as any;
        const amount =
          typeof raw === "bigint"            ? raw :
          typeof raw?.claimable === "bigint" ? raw.claimable :
          typeof raw?.amount === "bigint"    ? raw.amount :
          0n;
        claimableFormatted = amount > 0n
          ? (Number(amount) / 100).toFixed(2)
          : "0";
      } catch {
        claimableFormatted = "0";
      }

      if (
        walletStatus.status === "already_claimed" ||
        claimableFormatted === "0"
      ) {
       
        const tomorrow = new Date();
        tomorrow.setUTCHours(24, 0, 0, 0);
        setState(prev => ({
          ...prev,
          status:    "already_claimed",
          claimable: claimableFormatted,
          nextClaim: tomorrow,
        }));
      } else {
        setState(prev => ({
          ...prev,
          status:    "can_claim",
          claimable: claimableFormatted,
          nextClaim: null,
        }));
      }
    } catch (err) {
      console.error("[useGoodDollarClaim] checkStatus failed:", err);
      setState(prev => ({
        ...prev,
        status:   "error",
        errorMsg: err instanceof Error ? err.message : "Failed to check claim status",
      }));
    }
  }, [address, buildSDKs, publicClient, walletClient]);

  // Claim UBI 
  const claim = useCallback(async () => {
    if (state.status !== "can_claim") return;

    setState(prev => ({ ...prev, status: "claiming", errorMsg: null }));

    try {
      const sdks = buildSDKs();
      if (!sdks) throw new Error("SDK not ready");

      toast.info("Please confirm the claim transaction in your wallet", {
        position: "top-center",
      });

      const result = await sdks.claimSDK.claim();
      console.log("[useGoodDollarClaim] claim result:", result);

      const hash =
        typeof result === "string"     ? result :
        (result as any)?.hash          ? (result as any).hash :
        (result as any)?.txHash        ? (result as any).txHash :
        null;

      toast.success(
        `🎉 Claimed ${state.claimable} G$! Check your wallet.`,
        { position: "top-center", duration: 6000 }
      );

      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);

      setState(prev => ({
        ...prev,
        status:    "success",
        txHash:    hash,
        nextClaim: tomorrow,
      }));
    } catch (err) {
      console.error("[useGoodDollarClaim] claim failed:", err);
      const msg = err instanceof Error ? err.message : "Claim failed";
      toast.error(msg, { position: "top-center" });
      setState(prev => ({
        ...prev,
        status:   "error",
        errorMsg: msg,
      }));
    }
  }, [state.status, state.claimable, buildSDKs]);

  // Check on wallet connect 
  useEffect(() => {
    if (address && publicClient && walletClient) {
      checkStatus();
    } else {
      setState(INITIAL);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, !!publicClient, !!walletClient]);

  return {
    ...state,
    checkStatus,
    claim,
    canClaim:      state.status === "can_claim",
    isClaiming:    state.status === "claiming",
    isLoading:     state.status === "loading" || state.status === "idle",
    claimedToday:  state.status === "already_claimed" || state.status === "success",
  };
}