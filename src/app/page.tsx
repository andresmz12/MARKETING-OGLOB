import { requireUser, companyWhere, companyScope } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLATFORMS } from "@/lib/platforms";
import { PlatformChip } from "@/components/PlatformChip";
import type { Platform } from "@prisma/client";

export const dynamic = "force-dynamic";
const nf = new Intl.NumberFormat("es", { useGrouping: "always" });
const fmt = (n: number) => nf.format(n);

export default async function Dashboard({ searchParams }: { searchParams: { company?: string } }) {
  const user = await requireUser();
  const where = companyWhere(user);
  const scope = companyScope(user);
  const companies = await db.company.findMany({ where: scope ? { id: { in: scope } } : {}, orderBy: { name: "asc" } });
  const companyId = searchParams.company && companies.some((c) => c.id === searchParams.company) ? searchParams.company : undefined;

  // Último snapshot de cada target publicado (las métricas son acumuladas)
  const targets = await db.postTarget.findMany({
    where: { status: "PUBLISHED", post: { ...where, ...(companyId ? { companyId } : {}) } },
    include: { post: { include: { company: true, campaign: true } }, metrics: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });
  const rows = targets.map((t) => ({ t, m: t.metrics[0] }));
  const sum = (list: typeof rows, k: "views" | "reach" | "likes" | "comments" | "shares" | "clicks") => list.reduce((a, r) => a + (r.m?.[k] ?? 0), 0);

  const byPlatform = PLATFORMS.map((p) => {
    const list = rows.filter((r) => r.t.platform === p.id);
    return { ...p, posts: list.length, views: sum(list, "views"), likes: sum(list, "likes"), clicks: sum(list, "clicks") };
  });
  const maxViews = Math.max(1, ...byPlatform.map((p) => p.views));
  const top = [...rows].sort((a, b) => (b.m?.views ?? 0) - (a.m?.views ?? 0)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Métricas</h1><p className="text-sm text-gray-500">Resultados de lo publicado, actualizados por Make</p></div>
        <form className="flex gap-2">
          <select name="company" defaultValue={companyId ?? ""} className="input w-52">
            <option value="">Todas las empresas</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-ghost">Filtrar</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {([["Posts publicados", rows.length], ["Vistas", sum(rows, "views")], ["Alcance", sum(rows, "reach")], ["Likes", sum(rows, "likes")], ["Comentarios", sum(rows, "comments")], ["Clics", sum(rows, "clicks")]] as const).map(([label, v]) => (
          <div key={label} className="card"><div className="label">{label}</div><div className="text-2xl font-bold tracking-tight">{fmt(v)}</div></div>
        ))}
      </div>

      <section className="card">
        <h2 className="mb-3 font-medium">Vistas por plataforma</h2>
        <div className="space-y-2">
          {byPlatform.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <span className="w-24">{p.label}</span>
              <div className="h-5 flex-1 rounded-full bg-gray-100">
                <div className="h-5 rounded-full" style={{ width: `${(p.views / maxViews) * 100}%`, background: p.color }} />
              </div>
              <span className="w-40 text-right text-gray-600">{fmt(p.views)} vistas · {p.posts} {p.posts === 1 ? "post" : "posts"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-medium">Posts con más vistas</h2>
        {top.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay métricas. Cuando Make envíe datos a /api/webhooks/make/metrics aparecerán aquí.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-500"><th>Post</th><th>Empresa</th><th>Red</th><th className="text-right">Vistas</th><th className="text-right">Likes</th><th className="text-right">Clics</th></tr></thead>
            <tbody>
              {top.map(({ t, m }) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2"><a className="text-indigo-600 hover:underline" href={`/posts/${t.postId}`}>{t.post.title}</a></td>
                  <td><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: t.post.company.color }} />{t.post.company.name}</td><td><PlatformChip platform={t.platform as Platform} full /></td>
                  <td className="text-right">{fmt(m?.views ?? 0)}</td><td className="text-right">{fmt(m?.likes ?? 0)}</td><td className="text-right">{fmt(m?.clicks ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
