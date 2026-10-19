"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "./button";

export function CopyButton({ value, label, ...props }: { value: string; label?: string } & Omit<ButtonProps, "onClick" | "value">) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size={label ? "sm" : "icon"}
      {...props}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy"
    >
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      {label}
    </Button>
  );
}
