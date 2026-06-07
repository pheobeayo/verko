import { TaskStatus, VerificationMethod } from "@/types/contract";


export function isExpired(unixTs: number | bigint): boolean {
  return Date.now() > Number(unixTs) * 1000;
}

export function timeLeft(unixTs: number | bigint): string {
  const ms = Number(unixTs) * 1000 - Date.now();
  if (ms <= 0) return "Expired";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d left`;
  if (h > 0) return `${h}h left`;
  return `${m}m left`;
}

export function formatDeadline(unixTs: number | bigint): string {
  return new Date(Number(unixTs) * 1000).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}


export function minDeadline(hoursFromNow = 1): string {
  return new Date(Date.now() + hoursFromNow * 3600000).toISOString().slice(0, 16);
}


export function canJoin(task: {
  status: TaskStatus;
  deadline: number | bigint;
  maxWorkers: number;
  currentWorkers: number;
}): boolean {
  return (
    (task.status === TaskStatus.Open || task.status === TaskStatus.Extended) &&
    !isExpired(task.deadline) &&
    task.currentWorkers < task.maxWorkers
  );
}

export function slotsLeft(task: { maxWorkers: number; currentWorkers: number }): number {
  return Math.max(0, task.maxWorkers - task.currentWorkers);
}

// Alias kept for backward compatibility
export const spotsLeft = slotsLeft;

export function fillPercent(task: { maxWorkers: number; currentWorkers: number }): number {
  if (task.maxWorkers === 0) return 0;
  return Math.round((task.currentWorkers / task.maxWorkers) * 100);
}

// Alias kept for backward compatibility
export const capacityPercent = fillPercent;


export function isLive(task: { status: TaskStatus; deadline: number | bigint }): boolean {
  return (
    (task.status === TaskStatus.Open || task.status === TaskStatus.Extended) &&
    !isExpired(task.deadline)
  );
}


export function effectiveStatusLabel(task: {
  status: TaskStatus;
  deadline: number | bigint;
}): string {
  if (
    (task.status === TaskStatus.Open || task.status === TaskStatus.Extended) &&
    isExpired(task.deadline)
  ) {
    return "Past";
  }
  return STATUS_LABEL[task.status] ?? "Unknown";
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Open]:       "Open",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.Completed]:  "Completed",
  [TaskStatus.Cancelled]:  "Cancelled",
  [TaskStatus.Disputed]:   "Disputed",
  [TaskStatus.Extended]:   "Extended",
  [TaskStatus.Past]:       "Past",
  [TaskStatus.Closed]:     "Closed",
};


export function formatBounty(raw: bigint, decimals = 18): string {
  if (raw === 0n) return "0";
  const divisor = BigInt(10 ** decimals);
  const whole   = raw / divisor;
  const frac    = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2);
  return fracStr === "00" ? whole.toString() : `${whole}.${fracStr}`;
}

// Aliases used by TaskCard and TaskDetailDrawer
export const formatGDollar = formatBounty;
export const formatDate    = formatDeadline;



export function tierLabel(tier: number): string {
  switch (tier) {
    case 0:  return "Newcomer";
    case 1:  return "Trusted";
    case 2:  return "Expert";
    case 3:  return "Elite";
    default: return `Tier ${tier}`;
  }
}

export function tierColor(tier: number): string {
  switch (tier) {
    case 0:  return "var(--text-muted)";
    case 1:  return "var(--brown-400)";
    case 2:  return "var(--gold)";
    case 3:  return "#a78bfa";
    default: return "var(--text-muted)";
  }
}



export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}



export const VERIFICATION_LABELS: Record<VerificationMethod, string> = {
  [VerificationMethod.OnChainText]: "On-chain text",
  [VerificationMethod.GoogleForm]:  "Google Form",
  [VerificationMethod.Email]:       "Email",
  [VerificationMethod.SocialPost]:  "Social post",
  [VerificationMethod.Custom]:      "Custom",
};

export function verificationRefLabel(method: VerificationMethod): string {
  switch (method) {
    case VerificationMethod.GoogleForm:  return "Google Form URL";
    case VerificationMethod.Email:       return "Submission email address";
    case VerificationMethod.SocialPost:  return "Social post instructions";
    case VerificationMethod.Custom:      return "Custom instructions";
    default:                             return "Submission reference";
  }
}

export function verificationRefPlaceholder(method: VerificationMethod): string {
  switch (method) {
    case VerificationMethod.GoogleForm:  return "https://forms.gle/abc123";
    case VerificationMethod.Email:       return "submissions@yourorg.com";
    case VerificationMethod.SocialPost:  return "Post on X/Twitter tagging @verkoapp and paste your URL";
    case VerificationMethod.Custom:      return "Describe exactly how workers should submit their proof…";
    default:                             return "Workers submit text directly on-chain — no link needed";
  }
}