import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizedWebhook } from "@/lib/rollup";

export const dynamic = "force-dynamic";

// Make envía métricas periódicas (uno o varios): { targetId, views, reach, likes, comments, shares, clicks }
// También acepta externalId + platform si Make no conoce el targetId.
const Item = z.object({
  targetId: z.string().optional(),
  externalId: z.string().optional(),
  views: z.coerce.number().int().min(0).default(0),
  reach: z.coerce.number().int().min(0).default(0),
  likes: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
  shares: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
});
const Body = z.union([Item, z.array(Item)]);

export async function POST(req: Request) {
  if (!authorizedWebhook(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  let saved = 0;
  for (const { targetId, externalId, ...m } of items) {
    const target = targetId
      ? await db.postTarget.findUnique({ where: { id: targetId } })
      : externalId
        ? await db.postTarget.findFirst({ where: { externalId } })
        : null;
    if (!target) continue;
    await db.metricSnapshot.create({ data: { targetId: target.id, ...m } });
    saved++;
  }
  return NextResponse.json({ ok: true, saved });
}
