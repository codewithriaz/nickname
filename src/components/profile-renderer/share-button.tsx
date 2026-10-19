"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Contact, Copy, Download, Share2, X } from "lucide-react";

/** Share sheet: native share, copy link, QR code download and vCard. */
export function ShareButton({ url, name, bio }: { url: string; name: string; bio?: string }) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && !qr) void QRCode.toDataURL(url, { width: 480, margin: 1 }).then(setQr);
  }, [open, qr, url]);

  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nURL:${url}\n${bio ? `NOTE:${bio.replace(/\n/g, " ")}\n` : ""}END:VCARD`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-4 top-4 rounded-full p-2.5 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--nk-text) 12%, transparent)", color: "var(--nk-text)" }}
        aria-label="Share"
      >
        <Share2 className="size-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 text-zinc-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Share {name}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-zinc-100">
                <X className="size-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt="QR code" className="mx-auto size-48 rounded-xl border" /> : <div className="mx-auto size-48 animate-pulse rounded-xl bg-zinc-100" />}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-medium hover:bg-zinc-50"
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="size-4" /> {copied ? "Copied!" : "Copy link"}
              </button>
              {qr && (
                <a href={qr} download={`${name}-qr.png`} className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-medium hover:bg-zinc-50">
                  <Download className="size-4" /> QR code
                </a>
              )}
              <a
                href={`data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`}
                download={`${name}.vcf`}
                className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-medium hover:bg-zinc-50"
              >
                <Contact className="size-4" /> Save contact
              </a>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={() => navigator.share({ title: name, url }).catch(() => undefined)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 font-medium text-white"
                >
                  <Share2 className="size-4" /> Share
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
