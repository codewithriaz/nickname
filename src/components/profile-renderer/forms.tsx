"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { publicApi } from "@/features/public/api";
import { toApiError } from "@/lib/api/client";
import type { FormField } from "@/schemas/block";

type BaseProps = { profileId: string; blockId: string; preview?: boolean; buttonStyle: CSSProperties; radius: string };

const inputStyle = (radius: string): CSSProperties => ({
  borderRadius: radius === "9999px" ? "14px" : radius,
  background: "color-mix(in srgb, var(--nk-text) 7%, white)",
  color: "#111",
});

function useSubmit(preview?: boolean) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    if (preview) return setState("done");
    setState("loading");
    setError(null);
    try {
      await fn();
      setState("done");
    } catch (e) {
      setError(toApiError(e).message);
      setState("idle");
    }
  };
  return { state, error, run };
}

export function EmailSignupForm({
  title,
  description,
  buttonLabel,
  collectName,
  collectPhone,
  successMessage,
  ...p
}: BaseProps & { title: string; description: string; buttonLabel: string; collectName: boolean; collectPhone: boolean; successMessage: string }) {
  const { state, error, run } = useSubmit(p.preview);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(() =>
      publicApi.subscribe({
        profileId: p.profileId,
        blockId: p.blockId,
        email: String(f.get("email") ?? ""),
        name: collectName ? String(f.get("name") ?? "") : undefined,
        phone: collectPhone ? String(f.get("phone") ?? "") : undefined,
      }),
    );
  };
  return (
    <div className="p-4 text-left" style={{ ...p.buttonStyle, borderRadius: p.radius === "9999px" ? "24px" : p.radius }}>
      {title && <p className="font-semibold">{title}</p>}
      {description && <p className="mt-0.5 text-sm opacity-80">{description}</p>}
      {state === "done" ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4" /> {successMessage}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          {collectName && <input name="name" required placeholder="Your name" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle(p.radius)} />}
          <input name="email" type="email" required placeholder="you@email.com" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle(p.radius)} />
          {collectPhone && <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle(p.radius)} />}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={state === "loading"} className="flex w-full items-center justify-center gap-2 bg-black/85 px-4 py-2.5 text-sm font-semibold text-white" style={{ borderRadius: p.radius === "9999px" ? "14px" : p.radius }}>
            {state === "loading" && <Loader2 className="size-4 animate-spin" />}
            {buttonLabel}
          </button>
        </form>
      )}
    </div>
  );
}

export function CustomFormBlock({
  title,
  description,
  fields,
  buttonLabel,
  successMessage,
  ...p
}: BaseProps & { title: string; description: string; fields: FormField[]; buttonLabel: string; successMessage: string }) {
  const { state, error, run } = useSubmit(p.preview);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    let email: string | undefined;
    let phone: string | undefined;
    let name: string | undefined;
    for (const field of fields) {
      const v = String(f.get(field.id) ?? "");
      data[field.label] = v;
      if (field.type === "email" && !email) email = v;
      if (field.type === "phone" && !phone) phone = v;
      if (/name/i.test(field.label) && !name) name = v;
    }
    void run(() => publicApi.subscribe({ profileId: p.profileId, blockId: p.blockId, email, phone, name, data }));
  };
  return (
    <div className="p-4 text-left" style={{ ...p.buttonStyle, borderRadius: p.radius === "9999px" ? "24px" : p.radius }}>
      {title && <p className="font-semibold">{title}</p>}
      {description && <p className="mt-0.5 text-sm opacity-80">{description}</p>}
      {state === "done" ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4" /> {successMessage}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          {fields.map((field) => {
            const common = { name: field.id, required: field.required, placeholder: field.label, className: "w-full px-3 py-2.5 text-sm outline-none", style: inputStyle(p.radius) };
            if (field.type === "textarea") return <textarea key={field.id} rows={3} {...common} />;
            if (field.type === "select")
              return (
                <select key={field.id} {...common} defaultValue="">
                  <option value="" disabled>
                    {field.label}
                  </option>
                  {(field.options ?? []).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              );
            return <input key={field.id} type={field.type === "phone" ? "tel" : field.type} {...common} />;
          })}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={state === "loading"} className="flex w-full items-center justify-center gap-2 bg-black/85 px-4 py-2.5 text-sm font-semibold text-white" style={{ borderRadius: p.radius === "9999px" ? "14px" : p.radius }}>
            {state === "loading" && <Loader2 className="size-4 animate-spin" />}
            {buttonLabel}
          </button>
        </form>
      )}
    </div>
  );
}
