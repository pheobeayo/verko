# Verko — Verified Micro-Task Marketplace

> Real work. Real rewards. On-chain trust.

Verko is a decentralised micro-task marketplace built on **Celo mainnet** that connects task posters with verified workers worldwide. Workers earn **GoodDollar (G$)** for completing real-world tasks, with identity verified through GoodDollar's face verification and reputation tracked via soul-bound NFTs.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [GoodDollar Integration](#gooddollar-integration)
5. [Frontend](#frontend)
6. [User Flows](#user-flows)
7. [Deployed Contracts](#deployed-contracts)
8. [Tech Stack](#tech-stack)
9. [Local Development](#local-development)
10. [Environment Variables](#environment-variables)

---

## Overview

Verko solves three core problems for informal workers:

| Problem | Verko Solution |
|---|---|
| No verifiable identity | GoodDollar face verification → on-chain whitelist |
| No trustless payment | Smart contract escrow releases G$ on approval |
| No portable reputation | Soul-bound NFT tracks completed tasks per tier |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Tasks    │  │ Post     │  │ Verify   │  │ My Tasks   │ │
│  │ /tasks   │  │ /tasks/  │  │ /verify  │  │ /tasks/    │ │
│  │          │  │ post     │  │          │  │ my-tasks   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │             │             │               │         │
│  ┌────▼─────────────▼─────────────▼───────────────▼──────┐ │
│  │                    React Hooks Layer                    │ │
│  │  useTaskReads  useCreateTask  useJoinTask  useCancelTask│ │
│  │  useCloseTask  useSettlePastTask  useExtendDeadline     │ │
│  │  useGoodDollarIdentity  useSubmissionReads              │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │ wagmi + viem
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  TaskEscrow.sol │ │WorkerReputa- │ │  GoodDollar       │
│                 │ │tion.sol      │ │  Identity         │
│  • createTask   │ │              │ │  Contracts        │
│  • joinTask     │ │  • Soul-bound│ │                   │
│  • submitProof  │ │    NFT       │ │  • isWhitelisted  │
│  • approveSubmis│ │  • Tier 0–3  │ │  • getWhitelisted │
│  • cancelTask   │ │  • recordComp│ │    Root           │
│  • closeTask    │ │    letion    │ │                   │
│  • extendDeadline│ │             │ │  Celo Mainnet     │
│  • settlePastTask│ └──────┬───────┘ └──────────────────┘
│                 │        │
│  G$ Escrow      │        │ setEscrow()
│  6% Platform Fee│◄───────┘
│                 │
│  Celo Mainnet   │
└─────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│         Next.js API Routes          │
│                                     │
│  POST /api/verify-worker            │
│  • Receives: { address }            │
│  • Checks: GD whitelist confirmed   │
│  • Calls: setWorkerVerified()       │
│    using VERIFIER_PRIVATE_KEY       │
└─────────────────────────────────────┘
```

---

## Smart Contracts

### TaskEscrow.sol

The core contract managing the full task lifecycle.

**Task Status State Machine:**
```
Open ──► InProgress ──► Completed ──► Closed
  │          │               │
  │          │               └──► Cancelled ──► Closed
  │          │
  └──► Extended ──► Open/InProgress
  │
  └──► Past (deadline passed) ──► Closed
  │
  └──► Disputed (v2)
```

**Key Functions:**

| Function | Access | Description |
|---|---|---|
| `createTask(params)` | Anyone | Creates a task, locks G$ in escrow |
| `joinTask(taskId)` | Verified workers | Worker joins an open task |
| `submitProof(taskId, proof)` | Joined workers | Submits proof on-chain |
| `approveSubmission(taskId, worker)` | Poster | Releases G$ to worker |
| `rejectSubmission(taskId, worker, reason)` | Poster | Frees slot for next worker |
| `cancelTask(taskId)` | Poster | Cancels and refunds unused escrow |
| `extendDeadline(taskId, extraSeconds)` | Poster | Extends deadline (max 3×, 1h–30d) |
| `closeTask(taskId)` | Poster | Archives completed/past/cancelled task |
| `settlePastTask(taskId)` | Anyone | Settles expired task, refunds poster |
| `setWorkerVerified(worker)` | Verifier | Whitelists a GoodDollar-verified worker |
| `withdrawFees(token)` | Owner | Withdraws accumulated platform fees |

**Platform Fee:** 6% (600 bps) on bounty × maxWorkers at task creation.

### WorkerReputation.sol

Soul-bound NFT tracking worker performance.

**WorkerStats struct:**
```solidity
struct WorkerStats {
    uint256 tasksCompleted;
    uint256 tasksAttempted;
    uint256 totalEarned;
    uint8   tier;        // 0=Newcomer, 1=Trusted, 2=Expert, 3=Elite
    uint256 tokenId;     // Soul-bound NFT ID
}
```

**Tier Thresholds:**
- Tier 0 (Newcomer): 0–4 completions
- Tier 1 (Trusted): 5–19 completions
- Tier 2 (Expert): 20–49 completions
- Tier 3 (Elite): 50+ completions

NFTs are non-transferable — calling `transferFrom` reverts with `NonTransferable`.

---

## GoodDollar Integration

Verko uses two GoodDollar SDKs from `@goodsdks/citizen-sdk` and `@goodsdks/identity-sdk`.

### Identity Verification Flow

```
Worker connects wallet
        │
        ▼
useGoodDollarIdentity hook
        │
        ├──► identitySDK.getWhitelistedRoot(address)
        │         │
        │    isWhitelisted?
        │         │
        │    YES ─┤──► Status: "verified"
        │         │         │
        │         │         ▼
        │         │    POST /api/verify-worker
        │         │         │
        │         │         ▼
        │         │    Backend calls setWorkerVerified()
        │         │    using VERIFIER_PRIVATE_KEY
        │         │         │
        │         │         ▼
        │         │    Worker can now joinTask()
        │         │
        │    NO ──┤──► Status: "not_verified"
        │              │
        │              ▼
        │         identitySDK.generateFVLink(
        │           false,           // popup mode
        │           callbackUrl,     // /verify
        │           42220            // Celo mainnet chainId
        │         )
        │              │
        │              ▼
        │         Render iframe with fvLink
        │              │
        │              ▼
        │         Poll checkVerification() every 5s
        │              │
        │              ▼
        │         isWhitelisted = true → call backend
        │
        └──► Redirect to /tasks
```

### Hook: useGoodDollarIdentity

```typescript
const {
  status,          // "loading" | "verified" | "not_verified" | "error"
  isVerified,      // boolean shorthand
  fvLink,          // GoodDollar face verification iframe URL
  isVerifying,     // true when polling for status
  isGeneratingLink,// true while fetching fvLink
  setIsVerifying,  // start/stop verification flow
  refresh,         // manually recheck whitelist status
} = useGoodDollarIdentity();
```

### API Route: /api/verify-worker

After GoodDollar confirms the wallet is whitelisted, the frontend calls this Next.js API route. The route uses `VERIFIER_PRIVATE_KEY` (the TaskEscrow verifier address) to call `setWorkerVerified` on-chain:

```typescript
// POST /api/verify-worker
// Body: { address: "0x..." }
// 
// 1. Validates address
// 2. Checks if already verified (avoids duplicate tx)
// 3. Calls setWorkerVerified(address) via verifier wallet
// 4. Waits for receipt
// 5. Returns { success: true, txHash }
```

### GoodDollar G$ Token

On Celo mainnet, the real GoodDollar token is used:
```
Address: 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A
Network: Celo Mainnet (chain 42220)
```

Task posters must hold G$ and approve the TaskEscrow contract to spend it before creating paid tasks. The `useCreateTask` hook handles this automatically — it checks allowance before calling `createTask` and sends an `approve(escrow, uint256.max)` transaction if needed.

---

## Frontend

### Key Hooks

| Hook | Purpose |
|---|---|
| `useTaskReads` | Read taskCount, getTask, getTasks from contract |
| `useCreateTask` | Create task + auto-approve G$ allowance |
| `useJoinTask` | Join a task (requires verified worker) |
| `useCancelTask` | Cancel task and refund escrow |
| `useCloseTask` | Close completed/past/cancelled task |
| `useSettlePastTask` | Settle expired task and refund escrow |
| `useExtendDeadline` | Extend task deadline (max 3 times) |
| `useSubmissionReads` | Read submissions for a task |
| `useGoodDollarIdentity` | Check GD whitelist status + generate FV link |

### Key Components

| Component | Description |
|---|---|
| `TaskCard` | Task grid card with Join/Settle/Close actions |
| `TaskDetailDrawer` | Full task detail with proof submission |
| `PostTask` | Multi-step task creation wizard |
| `VerifyPage` | GoodDollar face verification iframe page |
| `FilterBar` | Search/filter tasks by status/category/bounty |

### ABI Files

| File | Contract |
|---|---|
| `src/constant/abi.json` | TaskEscrow ABI |
| `src/constant/escrow.json` | Same (legacy reference) |

All hooks import from `@/constant/abi.json`.

---

## User Flows

### Worker Flow
```
1. Connect wallet (Reown AppKit / Celo wallet)
2. Navigate to /verify
3. Complete GoodDollar face verification (iframe)
4. Backend calls setWorkerVerified() on TaskEscrow
5. Browse tasks at /tasks
6. Click "Join Task" → sign transaction
7. Click "Submit Proof" → paste proof text/URL → sign
8. Poster reviews → approves → G$ sent instantly
9. Reputation NFT updated (tasksCompleted++)
```

### Poster Flow
```
1. Connect wallet
2. Navigate to /tasks/post
3. Select task type (Paid Bounty / Volunteer)
4. Fill: Title, Description, Category
5. Fill: Bounty (G$), Max Workers, Deadline
6. Select: Verification Method (On-chain text, Google Form, Email, etc.)
7. Review summary
8. Click "Create Task"
   → If paid: auto-approve G$ allowance (if needed)
   → createTask() transaction
9. Task appears at /tasks
10. Review incoming submissions at /tasks/my-tasks
11. Approve / Reject each submission
12. Close task when done
```

---

## Deployed Contracts

### Celo Mainnet (Chain 42220)

| Contract | Address |
|---|---|
| TaskEscrow | `0xB4429d77543A6909449a48CAB1903f909d32d44C` |
| WorkerReputation | `0xb5077034f94f6B862dcA37E54c504FE6250637c4` |
| GoodDollar G$ | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` |

View on Celoscan:
- [TaskEscrow](https://celoscan.io/address/0xB4429d77543A6909449a48CAB1903f909d32d44C)
- [WorkerReputation](https://celoscan.io/address/0xb5077034f94f6B862dcA37E54c504FE6250637c4)

### Celo Sepolia Testnet (Chain 44787)

| Contract | Address |
|---|---|
| TaskEscrow | `0xe53A148e1ea1933b3e6fdA2a590Bb375956267C7` |
| WorkerReputation | `0x081E343f75272830eB1722A548566f135713C78f` |
| MockERC20 (G$ test token) | `0x2Ef7d311d08bf6C9990c46D07c86eb3c9ADd7Cb3` |

---

## Tech Stack

### Smart Contracts
- **Solidity 0.8.28** — TaskEscrow, WorkerReputation, MockERC20
- **Foundry** — compile, test, deploy, verify
- **Celo Mainnet** — EVM-compatible, mobile-first, low fees

### Frontend
- **Next.js 16** — App Router, Server Components
- **wagmi v3 + viem** — wallet interactions, contract reads/writes
- **Reown AppKit** — wallet connection (WalletConnect, MetaMask, Celo wallets)
- **@tanstack/react-query** — data fetching and cache invalidation
- **Tailwind CSS** — styling with custom CSS variables
- **Sonner** — toast notifications

### GoodDollar SDKs
- **@goodsdks/citizen-sdk** — ClaimSDK for UBI eligibility and wallet status
- **@goodsdks/identity-sdk** — IdentitySDK for whitelist check and FV link generation

### Tooling
- **TypeScript** — full type safety
- **Foundry** — Forge tests (47/47 passing), deployment scripts
- **Vercel** — frontend hosting

---

## Local Development

### Prerequisites
- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- A Celo wallet with CELO for gas

### Smart Contracts

```bash
cd verko-foundry

# Install forge-std
forge install foundry-rs/forge-std

# Compile
forge build

# Run tests
forge test -vv

# Deploy to testnet
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url celo_sepolia \
  --broadcast \
  --legacy

# Deploy to mainnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url celo \
  --broadcast
```

### Frontend

```bash
cd frontend

npm install --legacy-peer-deps

# Copy and fill env
cp .env.example .env.local

npm run dev   # runs on http://localhost:3000
```

---

## Environment Variables

### Frontend (.env)

```bash
# Reown AppKit project ID
NEXT_PUBLIC_PROJECTID=your_reown_project_id

# Mainnet contract addresses
NEXT_PUBLIC_ESCROW_ADDRESS=0x851ab8d8428C574B5BA6473aAEee02c11FD6064B
NEXT_PUBLIC_CONTRACT_ADDRESS=0x54fc35c86CcB4F76B75bc07e2A7D0F0AdB9ae66C
NEXT_PUBLIC_PAYMENT_TOKEN=0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A

# Backend verifier (server-side only — NEVER expose publicly)
VERIFIER_PRIVATE_KEY=0x...your_verifier_wallet_private_key
```

### Smart Contracts (.env in verko-foundry)

```bash
PRIVATE_KEY=0x...testnet_deployer_key
MAINNET_PRIVATE_KEY=0x...mainnet_deployer_key
```

---

## Security Notes

- `VERIFIER_PRIVATE_KEY` is used server-side only in `/api/verify-worker`. Never expose it client-side.
- The verifier role can be transferred via `setVerifier()` to a multisig as the platform matures.
- Task escrow funds are held in the TaskEscrow contract — the owner can only withdraw platform fees via `withdrawFees()`, never user funds.
- WorkerReputation NFTs are soul-bound — they cannot be transferred or sold.

---

## License

MIT — built by [Ifeoluwa Sanni](https://github.com/pheobeayo) for Proof of Ship.
