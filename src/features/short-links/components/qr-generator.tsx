"use client";

import { useState } from "react";
import { useActiveProfileId, useProfile } from "@/features/profiles/hooks";
import { useFeature } from "@/features/auth/hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ColorInput } from "@/components/ui/color-input";
import { Segmented } from "@/components/ui/segmented";
import { QrCodeView } from "@/components/common/qr-code";
import { ImageUpload } from "@/components/common/image-upload";
import { absoluteUrl, routes } from "@/config/site";

/** QR codes for your page, shop or any URL. Dynamic (trackable) QR codes live under Short links. */
export function QrGenerator() {
  const { profileId } = useActiveProfileId();
  const { data: profile } = useProfile(profileId);
  const canStyle = useFeature("customQr");
  const [target, setTarget] = useState<"page" | "shop" | "custom">("page");
  const [custom, setCustom] = useState("https://");
  const [fg, setFg] = useState("#1e1b4b");
  const [bg, setBg] = useState("#ffffff");
  const [logo, setLogo] = useState<string | null>(null);

  const value =
    target === "custom"
      ? custom
      : profile
        ? `${absoluteUrl(target === "page" ? routes.profile(profile.username) : routes.shop(profile.username))}?utm_source=qr`
        : "";

  return (
    <>
      <PageHeader title="QR codes" description="Print on packaging, flyers and shop counters. For trackable & editable QR codes, create a Short link." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Settings" />
          <CardBody className="space-y-4">
            <Segmented value={target} onChange={setTarget} options={[{ value: "page", label: "My page" }, { value: "shop", label: "My shop" }, { value: "custom", label: "Any URL" }]} />
            {target === "custom" && (
              <Field label="URL">
                <Input value={custom} onChange={(e) => setCustom(e.target.value)} />
              </Field>
            )}
            {canStyle ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Foreground">
                    <ColorInput value={fg} onChange={setFg} />
                  </Field>
                  <Field label="Background">
                    <ColorInput value={bg} onChange={setBg} />
                  </Field>
                </div>
                <Field label="Center logo">
                  <ImageUpload value={logo} onChange={setLogo} />
                </Field>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Custom colors and logo are available on Starter & Pro.</p>
            )}
          </CardBody>
        </Card>
        <Card className="p-6">
          {value && <QrCodeView value={value} fg={canStyle ? fg : "#000000"} bg={canStyle ? bg : "#ffffff"} logoUrl={canStyle ? logo : null} size={240} fileName={profile?.username ?? "qr"} />}
          <p className="mt-3 break-all text-center text-xs text-muted-foreground">{value}</p>
        </Card>
      </div>
    </>
  );
}
