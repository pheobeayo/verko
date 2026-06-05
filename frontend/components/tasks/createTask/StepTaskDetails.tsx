import { TASK_CATEGORIES } from "@/types/contract";
import { Field, Input, Textarea, Select } from "@/components/tasks/FormFields";
import type { StepProps } from "./share";

const CATEGORY_OPTIONS = TASK_CATEGORIES.map((c) => ({ value: c, label: c }));

export function StepTaskDetails({ values, errors, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <Field label="Task Title" htmlFor="title" required error={errors.title}>
        <Input
          id="title"
          placeholder="e.g. Translate 5 paragraphs to Yoruba"
          value={values.title}
          onChange={(e) => onChange("title", e.target.value)}
          maxLength={120}
          error={errors.title}
        />
        <span
          className="text-[10px] text-[var(--text-muted)] text-right mt-0.5"
          style={{ fontFamily: "var(--font-roboto), sans-serif" }}
        >
          {values.title.length}/120
        </span>
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        required
        hint="Be specific about what workers need to do and submit"
        error={errors.description}
      >
        <Textarea
          id="description"
          placeholder="Describe the task clearly. Include any specific requirements, quality expectations, tools workers should use, and what the proof should look like..."
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={5}
          error={errors.description}
        />
        <span
          className="text-[10px] text-[var(--text-muted)] text-right mt-0.5"
          style={{ fontFamily: "var(--font-roboto), sans-serif" }}
        >
          {values.description.length} characters{" "}
          {values.description.length < 50 ? `(min 50)` : "✓"}
        </span>
      </Field>

      <Field label="Category" htmlFor="category" required error={errors.category}>
        <Select
          id="category"
          value={values.category}
          onChange={(e) => onChange("category", e.target.value)}
          options={CATEGORY_OPTIONS}
          placeholder="Select a category..."
          error={errors.category}
        />
      </Field>
    </div>
  );
}