import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/" className="text-sm font-semibold text-primary">
        Go home →
      </Link>
    </main>
  );
}
