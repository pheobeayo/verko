import { TaskStatus } from "@/types/contract";

export const APPROVAL_TIMEOUT = 7 * 24 * 60 * 60;

export const CATEGORY_EMOJI: Record<string, string> = {
  "Surveys & Research":    "📋",
  "Photo Verification":    "📸",
  "Content & Translation": "✍️",
  "Community Outreach":    "📣",
  "Mystery Shopping":      "🔍",
  "AI Training Data":      "🎙️",
  "Data Labelling":        "🏷️",
  "Other":                 "📦",
};

export const STATUS_BADGE: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  [TaskStatus.Open]:       { bg:"bg-[var(--brown-100)]",         text:"text-[var(--brown-700)]",  dot:"bg-[var(--brown-500)]"  },
  [TaskStatus.InProgress]: { bg:"bg-[var(--cream-300)]",         text:"text-[var(--brown-800)]",  dot:"bg-[var(--brown-400)]"  },
  [TaskStatus.Completed]:  { bg:"bg-[rgba(74,124,89,0.12)]",     text:"text-[var(--success)]",    dot:"bg-[var(--success)]"    },
  [TaskStatus.Cancelled]:  { bg:"bg-[var(--brown-50)]",          text:"text-[var(--text-muted)]", dot:"bg-[var(--brown-300)]"  },
  [TaskStatus.Disputed]:   { bg:"bg-[rgba(139,58,42,0.12)]",     text:"text-[var(--error)]",      dot:"bg-[var(--error)]"      },
  [TaskStatus.Extended]:   { bg:"bg-[var(--cream-200)]",         text:"text-[var(--brown-600)]",  dot:"bg-[var(--brown-400)]"  },
  [TaskStatus.Past]:       { bg:"bg-[var(--bg-secondary)]",      text:"text-[var(--text-muted)]", dot:"bg-[var(--brown-300)]"  },
  [TaskStatus.Closed]:     { bg:"bg-[var(--brown-50)]",          text:"text-[var(--text-muted)]", dot:"bg-[var(--brown-200)]"  },
};

export const STATUS_BAR: Record<TaskStatus, string> = {
  [TaskStatus.Open]:       "from-[var(--brown-400)] to-[var(--brown-300)]",
  [TaskStatus.InProgress]: "from-[var(--brown-500)] to-[var(--brown-400)]",
  [TaskStatus.Completed]:  "from-[var(--success)] to-[rgba(74,124,89,0.6)]",
  [TaskStatus.Cancelled]:  "from-[var(--brown-200)] to-[var(--brown-100)]",
  [TaskStatus.Disputed]:   "from-[var(--error)] to-[rgba(139,58,42,0.6)]",
  [TaskStatus.Extended]:   "from-[var(--brown-300)] to-[var(--cream-300)]",
  [TaskStatus.Past]:       "from-[var(--brown-200)] to-[var(--brown-100)]",
  [TaskStatus.Closed]:     "from-[var(--brown-100)] to-[var(--brown-50)]",
};