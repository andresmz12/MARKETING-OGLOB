import { db } from "./db";
import type { PostStatus } from "@prisma/client";

/** Calcula el estado del post a partir del estado de sus plataformas */
export async function rollupPost(postId: string) {
  const targets = await db.postTarget.findMany({ where: { postId }, select: { status: true } });
  if (targets.length === 0) return;
  const s = targets.map((t) => t.status);
  let status: PostStatus;
  if (s.every((x) => x === "PUBLISHED")) status = "PUBLISHED";
  else if (s.includes("PUBLISHING")) status = "PUBLISHING";
  else if (s.includes("SCHEDULED")) status = "SCHEDULED";
  else if (s.includes("FAILED")) status = "FAILED";
  else if (s.includes("PUBLISHED")) status = "PUBLISHED";
  else status = s[0];
  await db.post.update({ where: { id: postId }, data: { status } });
}

export function authorizedWebhook(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret");
  return given === secret;
}
