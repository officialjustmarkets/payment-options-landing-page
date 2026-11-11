import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Only operational metadata is accepted. Form contents (phone numbers, member IDs,
// wallet addresses, card data, PINs) are never part of this schema, so they cannot be stored.
export const auditEventSchema = z.object({
  session_id: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  event_type: z.enum(["tab_click", "method_open", "transaction"]),
  method: z.string().max(60).optional(),
  tab: z.string().max(40).optional(),
  reference_id: z.string().regex(/^TX-\d{5,8}$/).optional(),
  state: z.enum(["initiated", "pending_verification", "completed", "cancelled"]).optional(),
  value_usd: z.number().nonnegative().max(10_000_000).optional(),
  value_local: z.number().nonnegative().max(2_000_000_000).optional(),
  points: z.number().nonnegative().max(100_000_000).optional(),
}).strict();

export const logAuditEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => auditEventSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("audit_events").insert(Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as typeof data & { session_id: string; event_type: string });
    if (error) console.error("audit insert failed", error.message);
    return { ok: !error };
  });
