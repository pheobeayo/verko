import type { Address } from "viem";

export const CONTRACT_ADDRESSES = {
  taskContract: process.env.NEXT_PUBLIC_ESCROW_ADDRESS! as Address,
  workerContract: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS! as Address,
} as const;