import { createWalletClient, http, createPublicClient } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY as `0x${string}`;

// Minimal ABI — only what we need
const ABI = [
  {
    inputs: [{ name: "worker", type: "address" }],
    name: "setWorkerVerified",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "workerVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address || !address.startsWith("0x")) {
      return Response.json({ error: "Invalid address" }, { status: 400 });
    }

    if (!VERIFIER_PRIVATE_KEY) {
      return Response.json({ error: "Verifier not configured" }, { status: 500 });
    }

    const verifierAccount = privateKeyToAccount(VERIFIER_PRIVATE_KEY);

    const publicClient = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    // Check if already verified — avoid redundant tx
    const alreadyVerified = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ABI,
      functionName: "workerVerified",
      args: [address as `0x${string}`],
    });

    if (alreadyVerified) {
      return Response.json({ success: true, alreadyVerified: true });
    }

    const walletClient = createWalletClient({
      account: verifierAccount,
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    const txHash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ABI,
      functionName: "setWorkerVerified",
      args: [address as `0x${string}`],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return Response.json({
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    console.error("[verify-worker] Error:", error);
    return Response.json(
      { error: error?.message ?? "Verification failed" },
      { status: 500 }
    );
  }
}