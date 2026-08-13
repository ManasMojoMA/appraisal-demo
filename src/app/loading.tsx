export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#E31E24]"></div>
        <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
