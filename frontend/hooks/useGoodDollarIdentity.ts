"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePublicClient, useWalletClient } from "wagmi";
import { celo } from "wagmi/chains";
import { IdentitySDK } from "@goodsdks/citizen-sdk";

const GD_ENV = "production" as const;

export type IdentityStatus = "loading" | "verified" | "not_verified" | "error";

export function useGoodDollarIdentity() {
  const { address } = useAppKitAccount();
  const publicClient = usePublicClient({ chainId: celo.id });
  const { data: walletClient } = useWalletClient({ chainId: celo.id });

  const [status, setStatus]                     = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink]                     = useState<string | null>(null);
  const [isVerifying, setIsVerifying]           = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const isVerifyingRef = useRef(isVerifying);
  isVerifyingRef.current = isVerifying;

  // Check GoodDollar whitelist status 
  const checkVerification = useCallback(async () => {
    if (!address || !publicClient || !walletClient) {
      setStatus("not_verified");
      return;
    }

    try {
      if (!isVerifyingRef.current) setStatus("loading");

      const sdk = new IdentitySDK({
        account: address as `0x${string}`,
        publicClient,
        walletClient,
        env: GD_ENV,
      } as any);

      const result = await sdk.getWhitelistedRoot(address as `0x${string}`);

      const rawResult = result as unknown;
      let isWhitelisted = false;
      if (typeof rawResult === "string") {
        isWhitelisted =
          (rawResult as string).toLowerCase() !== "0x0000000000000000000000000000000000000000";
      } else if (rawResult && typeof rawResult === "object") {
        const obj = rawResult as any;
        if ("isWhitelisted" in obj) {
          isWhitelisted = Boolean(obj.isWhitelisted);
        } else if ("root" in obj && typeof obj.root === "string") {
          isWhitelisted =
            obj.root.toLowerCase() !== "0x0000000000000000000000000000000000000000";
        }
      }

      if (isWhitelisted) {
        setStatus("verified");
        setIsVerifying(false);
      } else {
        setStatus("not_verified");
      }
    } catch (err) {
      console.error("[Verko] Identity check failed:", err);
      setStatus("error");
    }
  }, [address, publicClient, walletClient]);

  // Generate GoodDollar face verification link
  const generateFVLink = useCallback(async () => {
    console.log("[Verko] generateFVLink called", {
      address,
      hasPublicClient: !!publicClient,
      hasWalletClient: !!walletClient,
      isGeneratingLink,
      chainId: celo.id,
    });

    if (!address || !publicClient || !walletClient || isGeneratingLink) {
      console.warn("[Verko] generateFVLink aborted — missing prerequisites");
      return;
    }

    try {
      setIsGeneratingLink(true);
      console.log("[Verko] constructing IdentitySDK...");

      const sdk = new IdentitySDK({
        account: address as `0x${string}`,
        publicClient,
        walletClient,
        env: GD_ENV,
      } as any);

      console.log("[Verko] calling sdk.generateFVLink — wallet sign prompt may appear");
      const result = await sdk.generateFVLink(
        false,
        typeof window !== "undefined"
          ? `${window.location.origin}/verify`
          : undefined,
        celo.id,
      );

      console.log("[Verko] generateFVLink result:", result);

      const link =
        typeof result === "string" ? result : ((result as any)?.link ?? null);

      console.log("[Verko] extracted link:", link);

      if (link) {
        setFvLink(link);
      } else {
        console.error("[Verko] link is null/empty — setting error");
        setStatus("error");
      }
    } catch (err) {
      console.error("[Verko] generateFVLink failed:", err);
      setStatus("error");
    } finally {
      setIsGeneratingLink(false);
    }
  }, [address, publicClient, walletClient, isGeneratingLink]);

  // Initial check on wallet connect
  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  // Generate link when verification flow starts
  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateFVLink();
    }
  }, [isVerifying, fvLink, isGeneratingLink, generateFVLink]);

  // Poll every 5s while verifying 
  useEffect(() => {
    if (!isVerifying || status === "verified") return;
    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [isVerifying, status, checkVerification]);

  return {
    status,
    isVerified:       status === "verified",
    isLoading:        status === "loading",
    fvLink,
    isVerifying,
    isGeneratingLink,
    setIsVerifying,
    refresh:          checkVerification,
    generateFVLink,
  };
}