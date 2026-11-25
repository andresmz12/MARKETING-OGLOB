import { db } from "./db";
import { companyScope, type SessionUser } from "./auth";

export async function visibleCompanies(u: SessionUser) {
  const scope = companyScope(u);
  return db.company.findMany({ where: scope ? { id: { in: scope } } : {}, orderBy: { name: "asc" } });
}
