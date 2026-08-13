export default function EvaluatorLoading() {
  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center bg-zinc-50/50 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#E31E24]"></div>
        <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading evaluator dashboard...</p>
      </div>
    </div>
  );
}
