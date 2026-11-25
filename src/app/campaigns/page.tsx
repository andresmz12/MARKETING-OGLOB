import { requireUser, companyWhere, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleCompanies } from "@/lib/queries";
import { createCampaign, setCampaignStatus } from "../actions";

export const dynamic = "force-dynamic";
const STATUS = { PLANNED: "Planeada", ACTIVE: "Activa", PAUSED: "Pausada", DONE: "Terminada" } as const;

export default async function Campaigns() {
  const user = await requireUser();
  const [companies, campaigns] = await Promise.all([
    visibleCompanies(user),
    db.campaign.findMany({ where: companyWhere(user), include: { company: true, _count: { select: { posts: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Campañas</h1>
      {can.approve(user) && (
        <form action={createCampaign} className="card grid gap-3 md:grid-cols-3">
          <div><label className="label">Empresa</label><select name="companyId" className="input">{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Nombre</label><input name="name" required className="input" /></div>
          <div><label className="label">Tema</label><input name="theme" className="input" /></div>
          <div className="md:col-span-3"><label className="label">Objetivo</label><input name="objective" className="input" /></div>
          <div><label className="label">Inicio</label><input name="startDate" type="date" className="input" /></div>
          <div><label className="label">Fin</label><input name="endDate" type="date" className="input" /></div>
          <div><label className="label">Presupuesto</label><input name="budget" type="number" step="0.01" className="input" /></div>
          <div><button className="btn">Crear campaña</button></div>
        </form>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {campaigns.map((c) => (
          <div key={c.id} className="card border-l-4" style={{ borderLeftColor: c.company.color }}>
            <div className="flex items-start justify-between">
              <div><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.company.name} · {c._count.posts} posts</div></div>
              {can.approve(user) ? (
                <form action={setCampaignStatus} className="flex gap-1"><input type="hidden" name="id" value={c.id} />
                  <select name="status" defaultValue={c.status} className="input w-32">{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  <button className="btn-ghost">OK</button></form>
              ) : <span className="text-xs">{STATUS[c.status]}</span>}
            </div>
            {c.theme && <p className="mt-2 text-sm"><b>Tema:</b> {c.theme}</p>}
            {c.objective && <p className="text-sm"><b>Objetivo:</b> {c.objective}</p>}
            <p className="mt-1 text-xs text-gray-500">{c.startDate?.toLocaleDateString("es") ?? "?"} → {c.endDate?.toLocaleDateString("es") ?? "?"}{c.budget ? ` · $${c.budget}` : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
