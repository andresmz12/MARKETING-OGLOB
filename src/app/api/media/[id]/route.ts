import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Pública a propósito: Instagram/TikTok/Buffer necesitan descargar el archivo. El id es imposible de adivinar.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const m = await db.media.findUnique({ where: { id: params.id } });
  if (!m) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.contentType,
      "Content-Length": String(m.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(m.filename)}"`,
    },
  });
}
