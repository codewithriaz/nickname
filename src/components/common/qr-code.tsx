"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Renders a QR code (optional colors + center logo) with PNG/SVG download. */
export function QrCodeView({
  value,
  fg = "#000000",
  bg = "#ffffff",
  logoUrl,
  size = 220,
  fileName = "qr-code",
  showDownload = true,
}: {
  value: string;
  fg?: string;
  bg?: string;
  logoUrl?: string | null;
  size?: number;
  fileName?: string;
  showDownload?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const opts = { width: size * 2, margin: 2, color: { dark: fg, light: bg }, errorCorrectionLevel: logoUrl ? ("H" as const) : ("M" as const) };
    let cancelled = false;
    void QRCode.toCanvas(el, value, opts).then(() => {
      if (!logoUrl || cancelled) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ctx = el.getContext("2d");
        if (!ctx) return;
        const s = el.width * 0.22;
        const x = (el.width - s) / 2;
        ctx.fillStyle = bg;
        ctx.fillRect(x - 6, x - 6, s + 12, s + 12);
        ctx.drawImage(img, x, x, s, s);
      };
      img.src = logoUrl;
    });
    void QRCode.toString(value, { type: "svg", margin: 2, color: { dark: fg, light: bg } }).then((s) => !cancelled && setSvg(s));
    return () => {
      cancelled = true;
    };
  }, [value, fg, bg, logoUrl, size]);

  const downloadPng = () => {
    const a = document.createElement("a");
    a.href = canvas.current!.toDataURL("image/png");
    a.download = `${fileName}.png`;
    a.click();
  };
  const downloadSvg = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = `${fileName}.svg`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvas} style={{ width: size, height: size }} className="rounded-xl border border-border" />
      {showDownload && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPng}>
            <Download className="size-4" /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={downloadSvg} disabled={!svg || !!logoUrl} title={logoUrl ? "SVG export without logo only" : undefined}>
            <Download className="size-4" /> SVG
          </Button>
        </div>
      )}
    </div>
  );
}
