"use client";

import { useActionState, useState } from "react";
import { ActionMsg, btn, field } from "@/components/admin/ui";
import { updateOrder } from "../actions";

const LABEL: Record<string, string> = {
  confirmed: "Confirm", processing: "Mark as packing", shipped: "Mark as shipped", delivered: "Mark as delivered",
  cancelled: "Cancel order (restocks items)", refunded: "Mark as refunded",
};

export function StatusForm({ id, options, courier, tracking }: { id: string; options: string[]; courier: string | null; tracking: string | null }) {
  const [state, action, pending] = useActionState(updateOrder, {});
  const [status, setStatus] = useState(options[0]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={field} aria-label="New status">
        {options.map((s) => <option key={s} value={s}>{LABEL[s] ?? s}</option>)}
      </select>
      {status === "shipped" && (
        <div className="grid grid-cols-2 gap-2">
          <select name="courier" defaultValue={courier ?? "Steadfast"} className={field} aria-label="Courier">
            {["Steadfast", "Pathao", "RedX", "Sundarban", "DHL", "FedEx", "Other"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input name="tracking" defaultValue={tracking ?? ""} placeholder="Tracking no." className={field} required aria-label="Tracking number" />
        </div>
      )}
      <input name="note" placeholder="Note for the history (optional)" className={field} />
      <button
        disabled={pending}
        className={btn}
        onClick={(e) => { if (status === "cancelled" && !confirm("Cancel this order and put its items back in stock?")) e.preventDefault(); }}
      >
        {pending ? "Saving…" : "Update"}
      </button>
      <ActionMsg state={state} />
    </form>
  );
}
