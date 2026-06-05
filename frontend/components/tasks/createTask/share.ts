import { TaskFormValues, VerificationMethod } from "@/types/contract";

export const CELO_G_DOLLAR = "0x2Ef7d311d08bf6C9990c46D07c86eb3c9ADd7Cb3";
export const PLATFORM_FEE_BPS = 600;
export const GOOD_DOLLAR_DECIMALS = 18;

export const STEPS = [
  "Task Details",
  "Payment & Workers",
  "Verification",
  "Review",
] as const;

export const DEFAULT_FORM: TaskFormValues = {
  title: "",
  description: "",
  category: "",
  bountyPerWorker: "",
  paymentToken: CELO_G_DOLLAR,
  maxWorkers: "1",
  deadline: "",
  verificationMethod: VerificationMethod.OnChainText,
  verificationRef: "",
};

export type FormErrors = Partial<Record<keyof TaskFormValues, string>>;

export interface StepProps {
  values: TaskFormValues;
  errors: FormErrors;
  onChange: (
    key: keyof TaskFormValues,
    value: string | number | VerificationMethod
  ) => void;
}

export const STEP_FIELD_SETS: Array<Array<keyof TaskFormValues>> = [
  ["title", "description", "category"],
  ["bountyPerWorker", "maxWorkers", "paymentToken", "deadline"],
  ["verificationMethod", "verificationRef"],
  [],
];

export function validate(values: TaskFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.title.trim()) errors.title = "Title is required";
  else if (values.title.length > 120) errors.title = "Max 120 characters";

  if (!values.description.trim()) errors.description = "Description is required";
  else if (values.description.length < 50)
    errors.description = "Please provide at least 50 characters";

  if (!values.category) errors.category = "Select a category";

  const workers = parseInt(values.maxWorkers, 10);
  if (!values.maxWorkers || isNaN(workers) || workers < 1)
    errors.maxWorkers = "At least 1 worker required";
  else if (workers > 10000) errors.maxWorkers = "Max 10,000 workers";

  if (!values.deadline) {
    errors.deadline = "Deadline is required";
  } else {
    const ts = Math.floor(new Date(values.deadline).getTime() / 1000);
    if (ts <= Math.floor(Date.now() / 1000) + 3599)
      errors.deadline = "Deadline must be at least 1 hour from now";
  }

  const bounty = parseFloat(values.bountyPerWorker);
  if (values.bountyPerWorker && (isNaN(bounty) || bounty < 0))
    errors.bountyPerWorker = "Enter a valid amount (0 for unpaid tasks)";

  if (
    values.bountyPerWorker &&
    parseFloat(values.bountyPerWorker) > 0 &&
    !values.paymentToken.startsWith("0x")
  ) {
    errors.paymentToken = "Enter a valid token contract address";
  }

  if (
    values.verificationMethod !== VerificationMethod.OnChainText &&
    !values.verificationRef.trim()
  ) {
    errors.verificationRef = "This verification method requires a reference";
  }

  return errors;
}