export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-[#0d9488] rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Ładowanie...</p>
      </div>
    </div>
  );
}
