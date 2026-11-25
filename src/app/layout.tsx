import "./globals.css";
import { NavLinks } from "@/components/NavLinks";
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
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">O</span>
                <span className="hidden font-semibold tracking-tight sm:block">Marketing OGLOB</span>
              </div>
              <NavLinks links={links} />
              <span className="hidden text-xs text-gray-500 sm:block">{user.name} <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">{user.role}</span></span>
              <form action={logout}><button className="btn-ghost">Salir</button></form>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
