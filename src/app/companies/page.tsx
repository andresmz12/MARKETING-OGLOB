import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCompany } from "../actions";

export default async function Companies() {
  await requireRole("ADMIN");
  const companies = await db.company.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
      {companies.map((c) => (
        <form key={c.id} action={updateCompany} className="card flex items-end gap-3">
          <input type="hidden" name="id" value={c.id} />
          <div className="flex-1"><label className="label">Nombre</label><input name="name" defaultValue={c.name} className="input" /></div>
          <div><label className="label">Color</label><input name="color" type="color" defaultValue={c.color} className="h-10 w-16 rounded border" /></div>
          <button className="btn-ghost">Guardar</button>
        </form>
      ))}
    </div>
  );
}
