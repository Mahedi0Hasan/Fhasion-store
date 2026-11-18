"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/admin/auth";
import { userClient } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/catalog-source";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  note: z.string().trim().max(300).optional(),
  courier: z.string().trim().max(60).optional(),
  tracking: z.string().trim().max(80).optional(),
});

const MESSAGES: Record<string, string> = {
  TRACKING_REQUIRED: "Add a tracking number before marking the order as shipped.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "Order not found.",
};

export async function updateOrder(_prev: { error?: string; ok?: string }, fd: FormData): Promise<{ error?: string; ok?: string }> {
  await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Please check the form." };
  const v = parsed.data;

  // Runs as the signed-in staff member; the SQL function re-checks is_staff()
  // and enforces valid status transitions (and restocks on cancel).
  const db = await userClient();
  const { error } = await db.rpc("staff_update_order", {
    p_order_id: v.id, p_status: v.status, p_note: v.note || null, p_courier: v.courier || null, p_tracking: v.tracking || null,
  });
  if (error) {
    const code = error.message.split(":")[0];
    if (code === "BAD_TRANSITION") return { error: `Can't move this order ${error.message.split(":")[1]?.trim()}.` };
    return { error: MESSAGES[code] ?? "Couldn't update the order." };
  }
  revalidatePath(`/admin/orders/${v.id}`);
  revalidatePath("/admin/orders");
  if (v.status === "cancelled") revalidateTag(CATALOG_TAG); // stock went back on the shelf
  return { ok: "Order updated." };
}
