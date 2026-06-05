

const TasksGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden animate-pulse"
        >
          <div className="h-1 w-full bg-(--border)" />
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-24 rounded-full bg-(--bg-secondary)" />
              <div className="h-5 w-16 rounded-full bg-(--bg-secondary)" />
            </div>
            <div className="h-4 w-3/4 rounded bg-(--bg-secondary)" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-(--bg-secondary)" />
              <div className="h-3 w-5/6 rounded bg-(--bg-secondary)" />
            </div>
            <div className="h-5 w-32 rounded-full bg-(--bg-secondary)" />
            <div className="h-1.5 w-full rounded-full bg-(--bg-secondary)" />
            <div className="flex justify-between pt-2 border-t border-(--border)">
              <div className="h-3 w-20 rounded bg-(--bg-secondary)" />
              <div className="h-3 w-16 rounded bg-(--bg-secondary)" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TasksGridSkeleton