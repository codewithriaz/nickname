import { authed } from "@/server/http/handler";
import { exportSubscribersCsv } from "@/server/services/subscriber.service";

export const GET = authed<{ id: string }>(async (_req, { auth, params }) => {
  const csv = await exportSubscribersCsv(auth, params.id);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${params.id}.csv"`,
    },
  });
});
