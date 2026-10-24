export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-blue-100 dark:border-slate-800 border-t-primary animate-spin" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-secondary animate-pulse">
        Loading KaamWala...
      </p>
    </div>
  );
}
