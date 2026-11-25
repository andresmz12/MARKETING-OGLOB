import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createUser, updateUser } from "../actions";

export const dynamic = "force-dynamic";
const ROLES = [["ADMIN", "Admin (todo + usuarios)"], ["MANAGER", "Manager (aprueba y programa)"], ["EDITOR", "Editor (crea borradores)"], ["VIEWER", "Lector (solo ver)"]];

export default async function Users() {
  await requireRole("ADMIN");
  const [users, companies] = await Promise.all([
    db.user.findMany({ include: { companies: true }, orderBy: { createdAt: "asc" } }),
    db.company.findMany({ orderBy: { name: "asc" } }),
  ]);
  const CompanyChecks = ({ selected = [] as string[] }) => (
    <div className="flex flex-wrap gap-3 text-sm">
      {companies.map((c) => <label key={c.id} className="flex items-center gap-1"><input type="checkbox" name="companies" value={c.id} defaultChecked={selected.includes(c.id)} />{c.name}</label>)}
    </div>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Usuarios</h1>
      <form action={createUser} className="card grid gap-3 md:grid-cols-4">
        <div><label className="label">Nombre</label><input name="name" required className="input" /></div>
        <div><label className="label">Correo</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Contraseña (mín. 8)</label><input name="password" type="password" minLength={8} required className="input" /></div>
        <div><label className="label">Rol</label><select name="role" defaultValue="EDITOR" className="input">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="md:col-span-3"><label className="label">Empresas a las que tiene acceso (Admin ve todas)</label><CompanyChecks /></div>
        <div className="self-end"><button className="btn">Crear usuario</button></div>
      </form>
      <div className="space-y-3">
        {users.map((u) => (
          <form key={u.id} action={updateUser} className="card grid items-end gap-3 md:grid-cols-[1fr_200px_160px_auto]">
            <input type="hidden" name="id" value={u.id} />
            <div><div className="font-medium">{u.name}</div><div className="text-xs text-gray-500">{u.email}</div></div>
            <div><label className="label">Rol</label><select name="role" defaultValue={u.role} className="input">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><label className="label">Nueva contraseña</label><input name="password" type="password" placeholder="(sin cambio)" className="input" /></div>
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={u.active} /> Activo</label>
            <div className="md:col-span-3"><CompanyChecks selected={u.companies.map((c) => c.companyId)} /></div>
            <button className="btn-ghost">Guardar</button>
          </form>
        ))}
      </div>
    </div>
  );
}
