import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@ejemplo.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "cambia-esto";
  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  // Las 3 empresas del cliente: renómbralas desde la app (Empresas)
  const colors = ["#6366f1", "#10b981", "#f59e0b"];
  for (const [i, name] of ["Empresa 1", "Empresa 2", "Empresa 3"].entries()) {
    await db.company.upsert({ where: { name }, update: {}, create: { name, color: colors[i] } });
  }
  console.log("Seed listo:", email);
}
main().finally(() => db.$disconnect());
