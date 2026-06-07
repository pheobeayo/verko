"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { useIdentitySDK, IdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";

export type IdentityStatus = "loading" | "verified" | "not_verified" | "error";

export function useGoodDollarIdentity() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDKFromHook = useIdentitySDK("production");

  const identitySDK = useMemo(() => {
    if (identitySDKFromHook) return identitySDKFromHook;
    if (!publicClient || !walletClient) return null;
    return new (IdentitySDK as any)(publicClient, walletClient, "production");
  }, [identitySDKFromHook, publicClient, walletClient]);

  const [status, setStatus]                     = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink]                     = useState<string | null>(null);
  const [isVerifying, setIsVerifying]           = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Check GoodDollar whitelist status
  const checkVerification = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient?.account?.address) {
      setStatus("not_verified");
      return;
    }
    try {
      if (!isVerifying) setStatus("loading");

      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });

      const walletStatus = await claimSDK.getWalletClaimStatus();

      if (walletStatus.status === "not_whitelisted") {
        setStatus("not_verified");
      } else {
        setStatus("verified");
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("[Verko] Identity check failed:", error);
      setStatus("error");
    }
  };

  // Generate GoodDollar face verification link 
  const generateFVLink = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient || isGeneratingLink) return;
    try {
      setIsGeneratingLink(true);
      const idSDK = new (IdentitySDK as any)(publicClient, walletClient, "production");

      const linkResult = await idSDK.generateFVLink(
        false,
        `${window.location.origin}/verify`,
        42220, // Celo mainnet
      );

      const finalLink =
        typeof linkResult === "string"
          ? linkResult
          : (linkResult as any)?.link ?? "";

      if (finalLink) {
        setFvLink(finalLink);
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error("[Verko] Failed to generate FV link:", e);
      setStatus("error");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Initial check 
  useEffect(() => {
    checkVerification();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, !!publicClient, !!identitySDK, !!walletClient?.account?.address]);

  // Generate link when verification flow starts 
  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateFVLink();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerifying, !!fvLink, isGeneratingLink]);

  // Poll every 5s while verifying 
  useEffect(() => {
    if (!isVerifying || status === "verified") return;
    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerifying, status]);

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