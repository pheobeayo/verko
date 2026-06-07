// Enums 
export enum TaskStatus {
  Open        = 0,  
  InProgress  = 1,  
  Completed   = 2,  
  Cancelled   = 3,  
  Disputed    = 4,  
  Extended    = 5,  
  Past        = 6,  
  Closed      = 7,  
}

export enum SubmissionStatus {
  None      = 0,
  Submitted = 1,
  Approved  = 2,
  Rejected  = 3,
  Disputed  = 4,
}

export enum VerificationMethod {
  OnChainText = 0,
  GoogleForm  = 1,
  Email       = 2,
  SocialPost  = 3,
  Custom      = 4,
}

//  Interfaces 

export interface Task {
  id:                 bigint;
  poster:             `0x${string}`;
  title:              string;
  description:        string;
  category:           string;
  isPaid:             boolean;
  bountyPerWorker:    bigint;
  paymentToken:       `0x${string}`;
  maxWorkers:         number;
  currentWorkers:     number;
  approvedCount:      number;
  deadline:           bigint;
  extensionCount:     number;  
  status:             TaskStatus;
  verificationMethod: VerificationMethod;
  verificationRef:    string;
  totalEscrowed:      bigint;
}

export interface Submission {
  worker:          string;
  proofData:       string;
  status:          SubmissionStatus;
  rejectionReason: string;
  submittedAt:     number;
}

//  Form types 

export interface TaskFormValues {
  title:              string;
  description:        string;
  category:           string;
  bountyPerWorker:    string;  
  paymentToken:       string;
  maxWorkers:         string;
  deadline:           string;  
  verificationMethod: VerificationMethod;
  verificationRef:    string;
}

// Display helpers 

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Open]:       "Open",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.Completed]:  "Completed",
  [TaskStatus.Cancelled]:  "Cancelled",
  [TaskStatus.Disputed]:   "Disputed",
  [TaskStatus.Extended]:   "Extended",
  [TaskStatus.Past]:       "Past",
  [TaskStatus.Closed]:     "Closed",
};

// Brown/earth-tone palette — no dark: classes (light-only app)
export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  [TaskStatus.Open]:       "bg-[var(--brown-100)] text-[var(--brown-700)]",
  [TaskStatus.InProgress]: "bg-[var(--cream-300)] text-[var(--brown-800)]",
  [TaskStatus.Completed]:  "bg-[rgba(74,124,89,0.12)] text-[var(--success)]",
  [TaskStatus.Cancelled]:  "bg-[var(--brown-50)] text-[var(--text-muted)]",
  [TaskStatus.Disputed]:   "bg-[rgba(139,58,42,0.12)] text-[var(--error)]",
  [TaskStatus.Extended]:   "bg-[var(--cream-200)] text-[var(--brown-600)]",
  [TaskStatus.Past]:       "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
  [TaskStatus.Closed]:     "bg-[var(--brown-50)] text-[var(--text-muted)]",
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  [SubmissionStatus.None]:      "Not Submitted",
  [SubmissionStatus.Submitted]: "Pending Review",
  [SubmissionStatus.Approved]:  "Approved",
  [SubmissionStatus.Rejected]:  "Rejected",
  [SubmissionStatus.Disputed]:  "Disputed",
};

export const SUBMISSION_STATUS_COLOR: Record<SubmissionStatus, string> = {
  [SubmissionStatus.None]:      "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
  [SubmissionStatus.Submitted]: "bg-[rgba(201,162,39,0.12)] text-[var(--gold)]",
  [SubmissionStatus.Approved]:  "bg-[rgba(74,124,89,0.12)] text-[var(--success)]",
  [SubmissionStatus.Rejected]:  "bg-[rgba(139,58,42,0.12)] text-[var(--error)]",
  [SubmissionStatus.Disputed]:  "bg-[rgba(196,122,58,0.12)] text-[var(--brown-400)]",
};

export const VERIFICATION_METHOD_LABEL: Record<VerificationMethod, string> = {
  [VerificationMethod.OnChainText]: "On-Chain Text",
  [VerificationMethod.GoogleForm]:  "Google Form",
  [VerificationMethod.Email]:       "Email",
  [VerificationMethod.SocialPost]:  "Social Post",
  [VerificationMethod.Custom]:      "Custom",
};

export const VERIFICATION_METHOD_DESCRIPTION: Record<VerificationMethod, string> = {
  [VerificationMethod.OnChainText]: "Worker submits text proof directly on-chain",
  [VerificationMethod.GoogleForm]:  "Worker submits via a Google Form link you provide",
  [VerificationMethod.Email]:       "Worker sends proof to an email address you provide",
  [VerificationMethod.SocialPost]:  "Worker submits a URL to a social media post",
  [VerificationMethod.Custom]:      "Custom verification — provide your own reference",
};

export const TASK_CATEGORIES = [
  "Surveys & Research",
  "Photo Verification",
  "Content & Translation",
  "Community Outreach",
  "Mystery Shopping",
  "AI Training Data",
  "Data Labelling",
  "Other",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];