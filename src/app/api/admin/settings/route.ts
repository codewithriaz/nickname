import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { platformSettingsSchema } from "@/schemas/admin";
import { getPlatformSettings, updatePlatformSettings } from "@/server/services/settings.service";
import { gatewayAvailability } from "@/server/services/billing.service";
import { audit } from "@/server/services/audit.service";

export const GET = adminOnly(async () => ok({ settings: await getPlatformSettings(), gateways: gatewayAvailability() }));

export const PUT = adminOnly(async (req, { auth }) => {
  const settings = await updatePlatformSettings(await parseBody(req, platformSettingsSchema));
  await audit(auth.userId, "settings.update", "PlatformSetting", "platform");
  return ok({ settings, gateways: gatewayAvailability() });
});
