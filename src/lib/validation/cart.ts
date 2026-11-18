import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  size: z.string().min(1).max(8),
  qty: z.number().int().min(1).max(10),
});

export const couponRequestSchema = z.object({
  code: z.string().trim().min(2).max(32),
  lines: z.array(cartLineSchema).min(1).max(50),
});
