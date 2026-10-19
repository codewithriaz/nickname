export function ShopSkeleton() {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <div className="h-14 border-b bg-white" />
      <div className="mx-auto max-w-3xl animate-pulse px-4 pt-4">
        <div className="h-7 w-48 rounded bg-zinc-200" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
