import Link from "next/link";
import { requireUser, companyWhere, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { platformLabel } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export default async function Posts() {
  const user = await requireUser();
  const posts = await db.post.findMany({
    where: companyWhere(user),
    include: { company: true, campaign: true, targets: true },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Posts</h1>
        {can.edit(user) && <Link className="btn" href="/posts/new">Nuevo post</Link>}
      </div>
      <div className="card p-0">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="p-3">Título</th><th>Empresa</th><th>Campaña</th><th>Redes</th><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3"><Link className="text-indigo-600 hover:underline" href={`/posts/${p.id}`}>{p.title}</Link></td>
                <td>{p.company.name}</td><td>{p.campaign?.name ?? "—"}</td>
                <td>{p.targets.map((t) => platformLabel(t.platform)).join(", ")}</td>
                <td>{p.scheduledAt ? p.scheduledAt.toLocaleString("es") : "—"}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Aún no hay posts.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
