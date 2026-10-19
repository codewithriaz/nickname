"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";

type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; destructive?: boolean };

/** Promise-based confirm: `const [dialog, confirm] = useConfirm(); if (await confirm({...})) ...` */
export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    setOpts(null);
  };

  const dialog = (
    <Dialog
      open={!!opts}
      onClose={() => close(false)}
      title={opts?.title}
      description={opts?.description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={opts?.destructive ? "destructive" : "primary"} onClick={() => close(true)}>
            {opts?.confirmLabel ?? "Confirm"}
          </Button>
        </>
      }
    >
      <span className="sr-only">{opts?.title}</span>
    </Dialog>
  );
  return [dialog, confirm] as const;
}
