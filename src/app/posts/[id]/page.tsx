import { notFound } from "next/navigation";
import { requireUser, companyWhere, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleCompanies } from "@/lib/queries";
import { PostForm } from "@/components/PostForm";
import { StatusBadge } from "@/components/StatusBadge";
import { PlatformChip } from "@/components/PlatformChip";
import { postAction, markPublished, addMetrics, addComment } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const post = await db.post.findFirst({
    where: { id: params.id, ...companyWhere(user) },
    include: { targets: { include: { metrics: { orderBy: { capturedAt: "desc" }, take: 1 } } }, comments: { include: { user: true }, orderBy: { createdAt: "asc" } } },
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
                {can.approve(user) && t.status !== "PUBLISHED" && t.status !== "PUBLISHING" && (
                  <form action={markPublished} className="ml-auto flex gap-2">
                    <input type="hidden" name="targetId" value={t.id} />
                    <input name="externalUrl" placeholder="Link del post (opcional)" className="input w-52" />
                    <button className="btn-ghost whitespace-nowrap">Marcar publicado</button>
                  </form>
                )}
                {can.approve(user) && t.status === "PUBLISHED" && (
                  <details className="w-full">
                    <summary className="cursor-pointer text-xs font-medium text-indigo-600">Cargar métricas a mano</summary>
                    <form action={addMetrics} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="targetId" value={t.id} />
                      {(["views", "reach", "likes", "comments", "shares", "clicks"] as const).map((k) => (
                        <div key={k}><label className="label">{{ views: "Vistas", reach: "Alcance", likes: "Likes", comments: "Coment.", shares: "Compart.", clicks: "Clics" }[k]}</label><input name={k} type="number" min={0} defaultValue={m?.[k] ?? 0} className="input w-24" /></div>
                      ))}
                      <button className="btn">Guardar</button>
                    </form>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {post.mediaUrl && (
        <div className="overflow-hidden rounded-xl border bg-gray-100 sm:w-72">
          {post.mediaType === "VIDEO" ? <video src={post.mediaUrl} controls className="max-h-80 w-full" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.mediaUrl} alt={post.title} className="max-h-80 w-full object-contain" />}
        </div>
      )}

      <PostForm post={post} companies={companies} campaigns={campaigns} locked={locked} />

      <section className="card">
        <h2 className="mb-3 font-medium">Notas del equipo</h2>
        <ul className="space-y-3">
          {post.comments.map((c) => (
            <li key={c.id} className="text-sm"><b>{c.user.name}</b> <span className="text-xs text-gray-400">{c.createdAt.toLocaleString("es")}</span><p className="whitespace-pre-wrap text-gray-700">{c.body}</p></li>
          ))}
          {post.comments.length === 0 && <li className="text-sm text-gray-500">Sin notas todavía.</li>}
        </ul>
        {can.edit(user) && (
          <form action={addComment} className="mt-3 flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input name="body" required placeholder="Escribe una nota (ajustes, aprobación, ideas…)" className="input" />
            <button className="btn">Enviar</button>
          </form>
        )}
      </section>
    </div>
  );
}
