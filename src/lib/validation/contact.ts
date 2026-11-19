import { z } from "zod";

export const CONTACT_TOPICS = ["order", "sizing", "returns", "wholesale", "other"] as const;

/** Messages are dictionary keys ("err.*"), translated where shown. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "err.msgName").max(120, "err.tooLong"),
  email: z.string().trim().toLowerCase().email("err.email").max(254),
  phone: z.string().trim().max(24, "err.tooLong").optional().or(z.literal("")),
  topic: z.enum(CONTACT_TOPICS, { errorMap: () => ({ message: "err.msgTopic" }) }),
  order_number: z.string().trim().toUpperCase().regex(/^DM-\d{6}-[0-9A-F]{6}$/, "err.trackFormat").optional().or(z.literal("")),
  message: z.string().trim().min(10, "err.msgShort").max(2000, "err.tooLong"),
  /** Honeypot: real people never fill this hidden field. */
  website: z.string().max(0).optional().or(z.literal("")),
});
export type ContactInput = z.infer<typeof contactSchema>;
