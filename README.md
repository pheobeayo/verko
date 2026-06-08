# Verko — Verified Micro-Task Marketplace

> Real work. Real rewards. On-chain trust.

Verko is a decentralised micro-task marketplace built on **Celo mainnet** that connects task posters with verified workers worldwide. Workers earn **GoodDollar (G$)** for completing real-world tasks, with identity verified automatically through GoodDollar's on-chain whitelist and reputation tracked via soul-bound NFTs.

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
| No verifiable identity | GoodDollar face verification → on-chain whitelist read directly by contract |
| No trustless payment | Smart contract escrow releases G$ on approval |
| No portable reputation | Soul-bound NFT tracks completed tasks per tier |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Tasks   │  │  Post    │  │  Verify  │  │  My Tasks  │ │
│  │  /tasks  │  │ /tasks/  │  │ /verify  │  │ /tasks/    │ │
│  │          │  │   post   │  │          │  │  my-tasks  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │             │             │               │         │
│  ┌────▼─────────────▼─────────────▼───────────────▼──────┐ │
│  │                   React Hooks Layer                     │ │
│  │  useTaskReads  useCreateTask  useJoinTask               │ │
│  │  useCancelTask useCloseTask   useSettlePastTask         │ │
│  │  useExtendDeadline  useSubmissionReads                  │ │
│  │  useGoodDollarIdentity  (verify page only)              │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │ wagmi + viem
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────────┐
│  TaskEscrow.sol │ │WorkerReputa- │ │  GoodDollar          │
│                 │ │tion.sol      │ │  Identity Contract   │
│  • createTask   │ │              │ │                      │
│  • joinTask     │ │  • Soul-bound│ │  0xC361A6E6...F42    │
│    ↓ reads GD   │ │    NFT       │ │  Celo Mainnet        │
│    identity     │ │  • Tier 0–3  │ │                      │
│    directly     │ │  • recordCom-│ │  isWhitelisted()     │
│  • submitProof  │ │    pletion   │ │  ← called directly   │
│  • approveSub   │ │              │ │    by TaskEscrow      │
│  • cancelTask   │ └──────┬───────┘ └─────────────────────┘
│  • closeTask    │        │
│  • extendDead   │        │ setEscrow()
│  • settlePast   │◄───────┘
│  • isWorkerVer  │
│    ified(addr)  │
│                 │
│  G$ Escrow      │
│  6% Platform Fee│
│  Celo Mainnet   │
└─────────────────┘
```

**Key design decision:** `TaskEscrow` reads GoodDollar's identity contract directly on-chain. No backend relay, no manual `setWorkerVerified`, no private key management — pure trustless verification.

---

## Smart Contracts

### TaskEscrow.sol

The core contract managing the full task lifecycle.

**GoodDollar Identity Integration:**
```solidity
// GoodDollar Identity contract on Celo mainnet
address public constant GD_IDENTITY = 0xC361A6E67822a0EDc17D899227dd9FC50BD62F42;

interface IGoodDollarIdentity {
    function isWhitelisted(address user) external view returns (bool);
}

function joinTask(uint256 taskId) external {
    // Automatic — reads GoodDollar whitelist directly
    if (!_isGoodDollarVerified(msg.sender)) revert WorkerNotVerified();
    ...
}
```

Any GoodDollar face-verified wallet can join tasks instantly — no intermediate steps.

**Task Status State Machine:**
```
Open ──► InProgress ──► Completed ──► Closed
  │          │
  └──► Extended ──► Open/InProgress
  │
  └──► Past (deadline passed) ──► Closed
  │
  └──► Cancelled ──► Closed
  │
  └──► Disputed (v2)
```

**Key Functions:**

| Function | Access | Description |
|---|---|---|
| `createTask(params)` | Anyone | Creates a task, locks G$ in escrow |
| `joinTask(taskId)` | GD-verified workers | Worker joins — checks GD whitelist automatically |
| `submitProof(taskId, proof)` | Joined workers | Submits proof on-chain |
| `approveSubmission(taskId, worker)` | Poster | Releases G$ to worker |
| `rejectSubmission(taskId, worker, reason)` | Poster | Frees slot for next worker |
| `cancelTask(taskId)` | Poster | Cancels and refunds unused escrow |
| `extendDeadline(taskId, extraSeconds)` | Poster | Extends deadline (max 3×, 1h–30d) |
| `closeTask(taskId)` | Poster | Archives completed/past/cancelled task |
| `settlePastTask(taskId)` | Anyone | Settles expired task, refunds poster |
| `isWorkerVerified(address)` | View | Returns true if address is GD-whitelisted |
| `withdrawFees(token)` | Owner | Withdraws accumulated platform fees |

**Platform Fee:** 6% (600 bps) on `bounty × maxWorkers` at task creation.

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

Verko integrates GoodDollar at two layers:

### Layer 1 — Smart Contract (Automatic)

`TaskEscrow` calls `isWhitelisted(address)` on GoodDollar's Identity contract directly during `joinTask`. This is fully automatic and trustless — no backend, no API key, no manual verification step.

```solidity
function _isGoodDollarVerified(address user) internal view returns (bool) {
    try IGoodDollarIdentity(GD_IDENTITY).isWhitelisted(user) returns (bool result) {
        return result;
    } catch {
        return false; // safe fallback if GD contract is unreachable
    }
}
```

### Layer 2 — Frontend SDK (Face Verification Flow)

Workers who are not yet GoodDollar-verified are directed to `/verify` where the GoodDollar face verification iframe is shown using `@goodsdks/identity-sdk`.

**Verification Flow:**
```
Worker connects wallet
        │
        ▼
TaskCard reads isWorkerVerified(address) from contract
        │
   GD-verified?
        │
   YES ─┤──► Show "Join Task" button
        │         │
        │         ▼
        │    Worker clicks Join
        │         │
        │         ▼
        │    joinTask() — contract auto-verifies via GD
        │
   NO ──┤──► Show "Verify with GoodDollar to Join" button
              │
              ▼
         Navigate to /verify
              │
              ▼
         identitySDK.generateFVLink(false, callbackUrl, 42220)
              │
              ▼
         GoodDollar face verification iframe
              │
              ▼
         Hook polls getWalletClaimStatus() every 5s
              │
              ▼
         isWhitelisted = true → toast + redirect to /tasks
              │
              ▼
         Worker can now join tasks — contract verifies automatically
```

### Hook: useGoodDollarIdentity

Used only on the `/verify` page to generate the face verification iframe:

```typescript
const {
  status,          // "loading" | "verified" | "not_verified" | "error"
  isVerified,      // true when GD whitelist confirmed
  fvLink,          // iframe URL for GoodDollar face verification
  isVerifying,     // true when polling for status
  isGeneratingLink,// true while fetching fvLink
  setIsVerifying,  // start/stop verification flow
  refresh,         // manually recheck whitelist status
} = useGoodDollarIdentity();
```

### GoodDollar Contracts Used

| Contract | Address (Celo Mainnet) | Purpose |
|---|---|---|
| Identity | `0xC361A6E67822a0EDc17D899227dd9FC50BD62F42` | Worker whitelist check |
| G$ Token | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` | Task bounty currency |

---

## Frontend

### Key Hooks

| Hook | Purpose |
|---|---|
| `useTaskReads` | Read taskCount, getTask, getTasks from contract |
| `useCreateTask` | Create task + auto-approve G$ allowance |
| `useJoinTask` | Join a task (contract auto-verifies GD whitelist) |
| `useCancelTask` | Cancel task and refund escrow |
| `useCloseTask` | Close completed/past/cancelled task |
| `useSettlePastTask` | Settle expired task and refund escrow |
| `useExtendDeadline` | Extend task deadline (max 3 times) |
| `useSubmissionReads` | Read submissions for a task |
| `useGoodDollarIdentity` | Generate GD face verification iframe link |

### Key Components

| Component | Description |
|---|---|
| `TaskCard` | Task grid card — shows Join or Verify button based on GD status |
| `TaskDetailDrawer` | Full task detail with proof submission |
| `PostTask` | Multi-step task creation wizard |
| `VerifyPage` | GoodDollar face verification iframe page |
| `FilterBar` | Search/filter tasks by status/category/bounty |

### Verification in TaskCard

```tsx
// Reads isWorkerVerified directly from contract
const { data: isGDVerified } = useReadContract({
  address: CONTRACT_ADDRESSES.taskContract,
  abi,
  functionName: "isWorkerVerified",
  args: [address],
});

// Conditional rendering
{isGDVerified
  ? <button onClick={handleJoin}>Join Task</button>
  : <button onClick={() => router.push("/verify")}>
      Verify with GoodDollar to Join
    </button>
}
```

---

## User Flows

### Worker Flow
```
1. Connect wallet (Reown AppKit / Celo wallet)
2. Browse tasks at /tasks
3. If not GD-verified: click "Verify with GoodDollar to Join"
   → /verify page → complete face scan → redirect back to /tasks
4. Click "Join Task" → sign transaction
   (contract checks GD whitelist automatically)
5. Click "Submit Proof" → paste proof text/URL → sign
6. Poster reviews → approves → G$ sent instantly
7. Reputation NFT updated (tasksCompleted++)
```

### Poster Flow
```
1. Connect wallet
2. Navigate to /tasks/post
3. Select task type (Paid Bounty / Volunteer)
4. Fill: Title, Description, Category
5. Fill: Bounty (G$), Max Workers, Deadline
6. Select: Verification Method
7. Review summary → "Create Task"
   → If paid: auto-approve G$ allowance
   → createTask() transaction → redirect to /tasks
8. Review submissions at /tasks/my-tasks
9. Approve / Reject each submission
10. Close task when done
```

---

## Deployed Contracts

### Celo Mainnet (Chain 42220)

| Contract | Address |
|---|---|
| TaskEscrow | `0xB4429d77543A6909449a48CAB1903f909d32d44C` |
| WorkerReputation | `0xb5077034f94f6B862dcA37E54c504FE6250637c4` |
| GoodDollar G$ | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` |
| GoodDollar Identity | `0xC361A6E67822a0EDc17D899227dd9FC50BD62F42` |

View on Celoscan:
- [TaskEscrow](https://celoscan.io/address/0xB4429d77543A6909449a48CAB1903f909d32d44C)
- [WorkerReputation](https://celoscan.io/address/0xb5077034f94f6B862dcA37E54c504FE6250637c4)

### Celo Sepolia Testnet (Chain 44787) — Legacy

| Contract | Address |
|---|---|
| TaskEscrow | `0xe53A148e1ea1933b3e6fdA2a590Bb375956267C7` |
| WorkerReputation | `0x081E343f75272830eB1722A548566f135713C78f` |
| MockERC20 (test G$) | `0x2Ef7d311d08bf6C9990c46D07c86eb3c9ADd7Cb3` |

---

## Tech Stack

### Smart Contracts
- **Solidity 0.8.28** — TaskEscrow, WorkerReputation
- **Foundry** — compile, test (47/47 passing), deploy, verify
- **Celo Mainnet** — EVM-compatible, mobile-first, low fees

### Frontend
- **Next.js 16** — App Router, Server Components
- **wagmi v3 + viem** — wallet interactions, contract reads/writes
- **Reown AppKit** — wallet connection
- **@tanstack/react-query** — data fetching and cache invalidation
- **Tailwind CSS** — styling with custom CSS variables
- **Sonner** — toast notifications

### GoodDollar SDKs
- **@goodsdks/citizen-sdk** — ClaimSDK for wallet status check
- **@goodsdks/identity-sdk** — IdentitySDK for FV link generation

---

## Local Development

### Smart Contracts

```bash
cd verko-foundry

forge build
forge test -vv

# Deploy to mainnet
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url celo \
  --broadcast
```

### Frontend

```bash
cd frontend

npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

---

## Environment Variables

### Frontend (.env)

```bash
NEXT_PUBLIC_PROJECTID=your_reown_project_id
NEXT_PUBLIC_ESCROW_ADDRESS=0xB4429d77543A6909449a48CAB1903f909d32d44C
NEXT_PUBLIC_CONTRACT_ADDRESS=0xb5077034f94f6B862dcA37E54c504FE6250637c4
NEXT_PUBLIC_PAYMENT_TOKEN=0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A
```

No `VERIFIER_PRIVATE_KEY` needed — verification is handled on-chain.

### Smart Contracts (.env in verko-foundry)

```bash
PRIVATE_KEY=0x...testnet_deployer_key
MAINNET_PRIVATE_KEY=0x...mainnet_deployer_key
```

---

## Security Notes

- Worker verification is fully on-chain — no private keys, no backend relay, no single point of failure.
- Task escrow funds are held in TaskEscrow — the owner can only withdraw platform fees via `withdrawFees()`, never user funds.
- WorkerReputation NFTs are soul-bound — non-transferable and non-sellable.
- The verifier role is kept for admin functions (`setVerifier`) — can be transferred to a multisig as the platform matures.

---

## License

MIT — built by [Ifeoluwa Sanni](https://github.com/pheobeayo)
