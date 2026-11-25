import { NextResponse } from "next/server";
import { getUser, can } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can.edit(user)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Formato no permitido (JPG, PNG, WEBP, GIF, MP4, MOV)" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 100 MB" }, { status: 400 });

  const media = await db.media.create({
    data: { filename: file.name.slice(0, 200), contentType: file.type, size: file.size, data: Buffer.from(await file.arrayBuffer()) },
    select: { id: true, contentType: true },
  });
  return NextResponse.json({ url: `/api/media/${media.id}`, type: media.contentType.startsWith("video/") ? "VIDEO" : "IMAGE" });
}
