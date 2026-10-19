export function ProfileSkeleton() {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-gradient-to-b from-violet-50 to-pink-50 px-4 pt-12">
      <div className="flex w-full max-w-[560px] animate-pulse flex-col items-center">
        <div className="size-24 rounded-full bg-black/10" />
        <div className="mt-4 h-5 w-40 rounded bg-black/10" />
        <div className="mt-2 h-4 w-24 rounded bg-black/10" />
        <div className="mt-8 w-full space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 w-full rounded-full bg-black/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
