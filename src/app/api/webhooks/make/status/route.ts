import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizedWebhook, rollupPost } from "@/lib/rollup";

export const dynamic = "force-dynamic";

// Make llama aquí después de intentar publicar.
// Body: { targetId, status: "published" | "failed", externalId?, externalUrl?, error? }
const Body = z.object({
  targetId: z.string(),
  status: z.enum(["published", "failed"]),
  externalId: z.string().optional(),
  externalUrl: z.string().optional(),
  error: z.string().optional(),
});

export async function POST(req: Request) {
  if (!authorizedWebhook(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  const target = await db.postTarget.update({
    where: { id: b.targetId },
    data:
      b.status === "published"
        ? { status: "PUBLISHED", publishedAt: new Date(), externalId: b.externalId, externalUrl: b.externalUrl, error: null }
        : { status: "FAILED", error: (b.error ?? "Error desconocido en Make").slice(0, 300) },
  });
  await rollupPost(target.postId);
  return NextResponse.json({ ok: true });
}
