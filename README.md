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
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────┐ │
│  │  Tasks   │  │  Post    │  │   My Tasks   │  │  Home  │ │
│  │  /tasks  │  │ /tasks/  │  │ /tasks/      │  │   /    │ │
│  │+ Banner  │  │   post   │  │   my-tasks   │  │        │ │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  └────────┘ │
│       │             │               │                       │
│  ┌────▼─────────────▼───────────────▼───────────────────┐  │
│  │                   React Hooks Layer                    │  │
│  │  useTaskReads    useCreateTask    useJoinTask          │  │
│  │  useCancelTask   useCloseTask     useSettlePastTask    │  │
│  │  useExtendDeadline  useSubmissionReads                 │  │
│  │  useWorkerTasks  useSubmissionNotifier                 │  │
│  │  useSubmitProof  useApproveSubmission  useRejectSub    │  │
│  │  useGoodDollarIdentity  (IdentityContext — app-wide)   │  │
│  └────────────────────────┬──────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
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
        return false; 
    }
}
```

### Layer 2 — Frontend SDK (VerificationBanner)

Workers who are not yet GoodDollar-verified see a `VerificationBanner` at the top of the `/tasks` page. The banner is powered by `useGoodDollarIdentity` via `IdentityContext` which is initialised once at the app root and shared across all components.

**Verification Flow:**
```
Worker connects wallet
        │
        ▼
IdentityContext (app root) initialises useGoodDollarIdentity
        │
        ▼
TaskCard reads isVerified from IdentityContext
        │
   GD-verified?
        │
   YES ─┤──► Show "Join Task" button
        │         │
        │         ▼
        │    Worker clicks Join
        │         │
        │         ▼
        │    joinTask() — contract auto-verifies via GD whitelist
        │
   NO ──┤──► VerificationBanner visible at top of /tasks
              │
              ▼
         Worker clicks "Verify now" → banner expands
              │
              ▼
         identitySDK.generateFVLink(false, callbackUrl, 42220)
              │
              ▼
         "Open GoodDollar verification" link opens in new tab
              │
              ▼
         Hook polls getWhitelistedRoot() every 5s in background
              │
              ▼
         isWhitelisted = true → banner auto-hides, Join button appears
              │
              ▼
         Worker can now join tasks — contract verifies automatically
```

### IdentityContext

`useGoodDollarIdentity` runs once at the `ContextProvider` level via `IdentityProvider`. All components consume identity state via `useIdentityContext()` — no re-initialisation, no SDK instance duplication.

```tsx
// ContextProvider (app root)
<WagmiProvider>
  <QueryClientProvider>
    <IdentityProvider>       ← initialises useGoodDollarIdentity once
      {children}
    </IdentityProvider>
  </QueryClientProvider>
</WagmiProvider>

// Any component
const { isVerified, fvLink, setIsVerifying } = useIdentityContext();
```

### Hook: useGoodDollarIdentity

```typescript
const {
  status,          // "loading" | "verified" | "not_verified" | "error"
  isVerified,      // true when GD whitelist confirmed
  fvLink,          // link for GoodDollar face verification (opens in new tab)
  isVerifying,     // true when polling for status
  isGeneratingLink,// true while fetching fvLink
  setIsVerifying,  // start/stop verification flow
  refresh,         // manually recheck whitelist status
  generateFVLink,  // manually trigger link generation
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
| `useSubmissionReads` | Read submissions for a task (useSubmission, useTaskSubmissions) |
| `useSubmitProof` | Submit proof on-chain for a joined task |
| `useApproveSubmission` | Approve a worker submission, release G$ |
| `useRejectSubmission` | Reject a worker submission with reason |
| `useWorkerTasks` | Fetch tasks joined by worker via event filtering (getLogs) |
| `useSubmissionNotifier` | Poll submission statuses, toast on Approved/Rejected |
| `useGoodDollarIdentity` | GD whitelist check + FV link generation (via IdentityContext) |

### Key Components

| Component | Description |
|---|---|
| `TaskCard` | Task grid card — shows Join button if GD-verified, nothing if not (banner handles it) |
| `TaskDetailDrawer` | Full task detail, proof submission panel, submission review panel |
| `SubmissionReviewPanel` | Poster view — all workers listed, approve/reject each |
| `VerificationBanner` | Collapsed pill → expanded panel with GD verification link |
| `PostTask` | Multi-step task creation wizard |
| `FilterBar` | Search/filter tasks by status/category/bounty |
| `MyTasksPage` | Worker + poster task tabs, real contract reads, submission status badges |

### Verification in TaskCard

TaskCard reads `isVerified` from `IdentityContext` — no contract call per card, no stale state:

```tsx
const { isVerified: isGDVerified } = useIdentityContext();

// Join button only shows when GD-verified
{address && !isPoster && joinable && isGDVerified && (
  <button onClick={handleJoin}>Join Task</button>
)}
// Unverified workers see the VerificationBanner at the top of /tasks instead
```

### VerificationBanner

Sits at the top of `/tasks`. Hidden when `isVerified` is true or when dismissed. Collapsed pill expands to a panel with the GD verification link that opens in a new tab. Polls every 5 seconds in background — auto-hides when verification is confirmed.

```tsx
// src/app/tasks/page.tsx
import { VerificationBanner } from "@/components/verification/VerificationBanner";

// Renders at the top of the task list
<VerificationBanner />
```

---

## User Flows

### Worker Flow
```
1. Connect wallet (Reown AppKit / Celo / MiniPay)
2. Browse tasks at /tasks
3. If not GD-verified:
   → VerificationBanner appears at top of page
   → Click "Verify now" → banner expands
   → Click "Open GoodDollar verification" → new tab
   → Complete face scan on GoodDollar
   → Banner auto-hides, Join buttons appear
4. Click "Join Task" → sign transaction
   (contract checks GD whitelist automatically — no extra step)
5. Open task → "My Proof" tab → paste proof → "Submit Proof" → sign
6. Poster reviews → approves → G$ sent instantly to wallet
7. Reputation NFT updated (tasksCompleted++, tier may upgrade)
8. /tasks/my-tasks shows submission status badge (Approved / Rejected / Under Review)
   + toast notification fires automatically on status change
```

### Poster Flow
```
1. Connect wallet
2. Navigate to /tasks/post
3. Select task type (Paid Bounty / Volunteer)
4. Fill: Title, Description, Category
5. Fill: Bounty (G$), Max Workers, Deadline
6. Select: Verification Method + Reference URL
7. Review summary → "Create Task"
   → If paid: auto-approve G$ allowance → createTask() → redirect to /tasks
8. Open any task you posted → "Review Submissions" tab
   → See all workers with their submitted proofs
   → Approve (releases G$ instantly) or Reject (frees slot) each worker
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

---

## Tech Stack

### Smart Contracts
- **Solidity 0.8.28** — TaskEscrow, WorkerReputation
- **Foundry** — compile, test (47/47 passing), deploy, verify
- **Celo Mainnet** — EVM-compatible, mobile-first, low fees

### Frontend
- **Next.js 16** — App Router, Server Components
- **wagmi v3 + viem** — wallet interactions, contract reads/writes
- **Reown AppKit** — wallet connection (Celo, MiniPay, Google social login)
- **@tanstack/react-query** — data fetching and cache invalidation
- **Tailwind CSS v4** — utility-first styling with CSS variable design tokens
- **Sonner** — toast notifications (submission status, tx confirmations)

### GoodDollar SDKs
- **@goodsdks/citizen-sdk** — IdentitySDK for whitelist check + FV link generation
- **@goodsdks/identity-sdk** — supplementary identity utilities

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
# edit .env.local with your values
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



### Smart Contracts (.env in verko-foundry)

```bash
MAINNET_PRIVATE_KEY=0x...mainnet_deployer_key
```

---

## Security Notes

- Worker verification is fully on-chain — no private keys, no backend relay, no single point of failure.
- Task escrow funds are held in TaskEscrow — the owner can only withdraw platform fees via `withdrawFees()`, never user funds.
- WorkerReputation NFTs are soul-bound — non-transferable and non-sellable.
- The verifier role is kept for admin functions (`setVerifier`) — can be transferred to a multisig as the platform matures.
- GoodDollar identity check uses `try/catch` — if the GD contract is temporarily unreachable, `joinTask` fails safely rather than allowing unverified workers through.

---

## License

MIT — built by [Ifeoluwa Sanni](https://github.com/pheobeayo) for Proof of Ship · Celo Mainnet