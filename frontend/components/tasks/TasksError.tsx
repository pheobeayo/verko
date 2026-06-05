import { RefreshCw, AlertCircle } from "lucide-react";

const TasksError = ({ error, onRetry }: { error: Error; onRetry: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p
          className="text-sm font-semibold text-(--text-primary)"
          style={{ fontFamily: "var(--font-nunito), sans-serif" }}
        >
          Couldn&apos;t load tasks
        </p>
        <p
          className="text-xs text-(--text-muted) mt-1 max-w-md"
          style={{ fontFamily: "var(--font-roboto), sans-serif" }}
        >
          {error.message}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-(--border) text-sm font-semibold text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
        style={{ fontFamily: "var(--font-nunito), sans-serif" }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Try again
      </button>
    </div>
  );
}

export default TasksError;