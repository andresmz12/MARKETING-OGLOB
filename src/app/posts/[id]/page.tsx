import { notFound } from "next/navigation";
import { requireUser, companyWhere, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleCompanies } from "@/lib/queries";
import { PostForm } from "@/components/PostForm";
import { StatusBadge } from "@/components/StatusBadge";
import { PlatformChip } from "@/components/PlatformChip";
import { postAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const post = await db.post.findFirst({
    where: { id: params.id, ...companyWhere(user) },
    include: { targets: { include: { metrics: { orderBy: { capturedAt: "desc" }, take: 1 } } } },
  });
  if (!post) notFound();
  const [companies, campaigns] = await Promise.all([
    visibleCompanies(user),
    db.campaign.findMany({ where: companyWhere(user), orderBy: { createdAt: "desc" } }),
  ]);
  const locked = !can.edit(user) || post.status === "PUBLISHING" || post.status === "PUBLISHED";
  const Btn = ({ action, label, cls = "btn" }: { action: string; label: string; cls?: string }) => (
    <form action={postAction}><input type="hidden" name="id" value={post.id} /><input type="hidden" name="action" value={action} /><button className={cls}>{label}</button></form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1><StatusBadge status={post.status} />
      </div>

      {can.approve(user) && (
        <div className="flex flex-wrap gap-2">
          {post.status === "DRAFT" && <Btn action="approve" label="Aprobar" cls="btn-ghost" />}
          {(post.status === "DRAFT" || post.status === "APPROVED" || post.status === "FAILED") && <Btn action="schedule" label="Programar publicación" />}
          {post.status === "SCHEDULED" && <Btn action="unschedule" label="Cancelar programación" cls="btn-ghost" />}
          {post.status === "FAILED" && <Btn action="retry" label="Reintentar" />}
          {post.status !== "PUBLISHING" && <Btn action="delete" label="Eliminar" cls="btn-danger" />}
        </div>
      )}

      <section className="card">
        <h2 className="mb-2 font-medium">Plataformas</h2>
        <ul className="divide-y text-sm">
          {post.targets.map((t) => {
            const m = t.metrics[0];
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <span className="w-24"><PlatformChip platform={t.platform} full /></span>
                <StatusBadge status={t.status} />
                {t.externalUrl && <a className="text-indigo-600 hover:underline" href={t.externalUrl} target="_blank">Ver publicación</a>}
                {t.error && <span className="text-red-600">{t.error}</span>}
                {m && <span className="text-gray-600">{m.views} vistas · {m.likes} likes · {m.comments} coment. · {m.clicks} clics</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <PostForm post={post} companies={companies} campaigns={campaigns} locked={locked} />
    </div>
  );
}
