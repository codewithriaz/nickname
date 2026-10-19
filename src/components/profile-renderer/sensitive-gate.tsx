"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export function SensitiveGate({ message, preview }: { message?: string; preview?: boolean }) {
  const [accepted, setAccepted] = useState(false);
  if (accepted || preview) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
      <div className="max-w-sm rounded-3xl bg-white p-6 text-center text-zinc-900">
        <ShieldAlert className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-3 text-lg font-semibold">Sensitive content</h2>
        <p className="mt-1 text-sm text-zinc-600">{message || "This page may contain content not suitable for all audiences. Are you 18 or older?"}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => history.back()} className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium">
            Go back
          </button>
          <button type="button" onClick={() => setAccepted(true)} className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
