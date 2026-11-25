import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { getUser, can } from "@/lib/auth";
import { logout } from "./actions";

export const metadata = { title: "Marketing OGLOB" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  const links = [
    ["/", "Métricas"],
    ["/calendar", "Calendario"],
    ["/posts", "Posts"],
    ["/campaigns", "Campañas"],
    ...(user && can.admin(user) ? [["/users", "Usuarios"], ["/companies", "Empresas"]] : []),
  ];
  return (
    <html lang="es">
      <body>
        {user && (
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
              <span className="font-semibold">Marketing OGLOB</span>
              <nav className="flex flex-1 gap-4 text-sm">
                {links.map(([href, label]) => (
                  <Link key={href} href={href} className="text-gray-600 hover:text-gray-900">{label}</Link>
                ))}
              </nav>
              <span className="text-xs text-gray-500">{user.name} · {user.role}</span>
              <form action={logout}><button className="btn-ghost">Salir</button></form>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
