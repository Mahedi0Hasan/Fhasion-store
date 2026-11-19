"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/admin/auth";
import { userClient } from "@/lib/supabase/server";

export async function setMessageStatus(fd: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(fd.get("id"));
  const status = z.enum(["new", "replied", "closed"]).parse(fd.get("status"));
  const db = await userClient(); // RLS: staff only
  await db.from("contact_messages").update({ status }).eq("id", id);
  revalidatePath("/admin/messages");
}
