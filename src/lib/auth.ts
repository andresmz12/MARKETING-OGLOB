import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { COOKIE, verifySession } from "./session";

export async function getUser() {
  const uid = await verifySession(cookies().get(COOKIE)?.value);
  if (!uid) return null;
  const user = await db.user.findUnique({ where: { id: uid }, include: { companies: true } });
  if (!user || !user.active) return null;
  return user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

// ---- Permisos por rol ----
const rank: Record<Role, number> = { VIEWER: 0, CLIENT: 0, EDITOR: 1, MANAGER: 2, ADMIN: 3 };
export const atLeast = (u: { role: Role }, min: Role) => rank[u.role] >= rank[min];

export const can = {
  edit: (u: { role: Role }) => atLeast(u, "EDITOR"),      // crear/editar borradores
  approve: (u: { role: Role }) => atLeast(u, "MANAGER"), // aprobar, programar, campañas
  admin: (u: { role: Role }) => atLeast(u, "ADMIN"),     // usuarios y empresas
  comment: (u: { role: Role }) => atLeast(u, "EDITOR") || u.role === "CLIENT",
  review: (u: { role: Role }) => u.role === "CLIENT" || u.role === "ADMIN", // aprobar/pedir cambios como cliente
};

export async function requireRole(min: Role): Promise<SessionUser> {
  const u = await requireUser();
  if (!atLeast(u, min)) redirect("/");
  return u;
}

/** IDs de empresas visibles; null = todas (ADMIN) */
export function companyScope(u: SessionUser): string[] | null {
  return u.role === "ADMIN" ? null : u.companies.map((c) => c.companyId);
}

/** Filtro Prisma por empresa según el alcance del usuario */
export function companyWhere(u: SessionUser) {
  const ids = companyScope(u);
  return ids === null ? {} : { companyId: { in: ids } };
}

export function assertCompany(u: SessionUser, companyId: string) {
  const ids = companyScope(u);
  if (ids !== null && !ids.includes(companyId)) throw new Error("Sin acceso a esa empresa");
}
