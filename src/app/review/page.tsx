import Link from "next/link";
import { requireUser, companyWhere } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlatformChip } from "@/components/PlatformChip";
import { ReviewBadge } from "@/components/ReviewBadge";

export const dynamic = "force-dynamic";

export default async function Review() {
  const user = await requireUser();
  const [pending, done] = await Promise.all([
    db.post.findMany({ where: { ...companyWhere(user), clientReview: "PENDING" }, include: { company: true, targets: true }, orderBy: { scheduledAt: "asc" } }),
    db.post.findMany({ where: { ...companyWhere(user), clientReview: { in: ["APPROVED", "CHANGES"] } }, include: { company: true, targets: true }, orderBy: { reviewedAt: "desc" }, take: 15 }),
  ]);
  const Row = ({ p }: { p: (typeof pending)[number] }) => (
    <Link href={`/posts/${p.id}`} className="card flex items-center gap-4 border-l-4 p-3 hover:bg-gray-50" style={{ borderLeftColor: p.company.color }}>
      {p.mediaUrl && p.mediaType === "IMAGE" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.mediaUrl} alt="" className="h-14 w-14 rounded object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{p.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
          {p.company.name} · {p.scheduledAt ? p.scheduledAt.toLocaleString("es") : "sin fecha"} {p.targets.map((t) => <PlatformChip key={t.id} platform={t.platform} />)}
        </div>
      </div>
      <ReviewBadge review={p.clientReview} />
    </Link>
  );
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Revisión</h1><p className="text-sm text-gray-500">Piezas que esperan aprobación del cliente</p></div>
      <section className="space-y-2">
        <h2 className="font-medium">Por revisar ({pending.length})</h2>
        {pending.map((p) => <Row key={p.id} p={p} />)}
        {pending.length === 0 && <p className="text-sm text-gray-500">No hay nada pendiente. 🎉</p>}
      </section>
      <section className="space-y-2">
        <h2 className="font-medium">Revisadas recientemente</h2>
        {done.map((p) => <Row key={p.id} p={p} />)}
        {done.length === 0 && <p className="text-sm text-gray-500">Aún no hay revisiones.</p>}
      </section>
    </div>
  );
}
