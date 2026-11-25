import { db } from "./db";

const MAX_ATTEMPTS = 3;

/**
 * Busca targets programados que ya les toca y los envía al webhook de Make.
 * Make publica (Meta/LinkedIn directo, TikTok vía Buffer) y luego llama a
 * /api/webhooks/make/status con el resultado.
 */
export async function dispatchDue() {
  const url = process.env.MAKE_PUBLISH_WEBHOOK_URL;
  if (!url) return { skipped: "MAKE_PUBLISH_WEBHOOK_URL no configurada", sent: 0 };

  const due = await db.postTarget.findMany({
    where: {
      status: "SCHEDULED",
      attempts: { lt: MAX_ATTEMPTS },
      post: { scheduledAt: { lte: new Date() } },
    },
    include: { post: { include: { company: true } } },
    take: 20,
  });

  let sent = 0;
  for (const t of due) {
    // "claim" atómico para que dos ciclos no envíen el mismo post
    const claimed = await db.postTarget.updateMany({
      where: { id: t.id, status: "SCHEDULED" },
      data: { status: "PUBLISHING", attempts: { increment: 1 }, error: null },
    });
    if (claimed.count === 0) continue;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: t.id,
          postId: t.postId,
          platform: t.platform,
          company: t.post.company.name,
          title: t.post.title,
          caption: t.post.caption,
          mediaUrl: t.post.mediaUrl,
          mediaType: t.post.mediaType,
          scheduledAt: t.post.scheduledAt,
          callbackUrl: `${process.env.APP_URL ?? ""}/api/webhooks/make/status`,
        }),
      });
      if (!res.ok) throw new Error(`Make respondió ${res.status}`);
      sent++;
    } catch (e) {
      const failedFinal = t.attempts + 1 >= MAX_ATTEMPTS;
      await db.postTarget.update({
        where: { id: t.id },
        data: { status: failedFinal ? "FAILED" : "SCHEDULED", error: String(e).slice(0, 300) },
      });
    }
  }
  return { sent, due: due.length };
}

/** Si Make nunca respondió tras 30 min, lo marcamos como fallido */
export async function reapStuck() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  await db.$executeRaw`UPDATE "PostTarget" SET status='FAILED', error='Make no confirmó la publicación (timeout)'
    WHERE status='PUBLISHING' AND id IN (
      SELECT t.id FROM "PostTarget" t JOIN "Post" p ON p.id=t."postId" WHERE p."scheduledAt" < ${cutoff})`;
}
