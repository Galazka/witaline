export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-[#0d9488] rounded-full animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Ładowanie dashboardu...</p>
      </div>
    </div>
  );
}
