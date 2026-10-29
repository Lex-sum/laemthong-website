import { z } from "zod";

/** Max items accepted per request (the SAP script sends batches of 500). */
export const STOCK_SYNC_MAX_ITEMS = 1000;

const stockItemSchema = z.object({
  itemCode: z.string().trim().min(1).max(100),
  itemName: z.string().max(500).default(""),
  onHand: z.number().finite(),
  available: z.number().finite(),
});

/** One batch of items from a sync run. */
export const stockBatchSchema = z.object({
  syncId: z.string().uuid(),
  items: z.array(stockItemSchema).min(1).max(STOCK_SYNC_MAX_ITEMS),
});

/** Sent once after every batch of a run succeeded; removes items missing from SAP. */
export const stockCompleteSchema = z.object({
  syncId: z.string().uuid(),
  complete: z.literal(true),
  total: z.number().int().positive(),
});

export const stockSyncSchema = z.union([stockCompleteSchema, stockBatchSchema]);
