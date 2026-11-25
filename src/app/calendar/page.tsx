import Link from "next/link";
import { requireUser, companyWhere } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { PlatformChip } from "@/components/PlatformChip";

export const dynamic = "force-dynamic";

export default async function Calendar({ searchParams }: { searchParams: { m?: string } }) {
  const user = await requireUser();
  const now = new Date();
  const [y, m] = (searchParams.m ?? `${now.getFullYear()}-${now.getMonth() + 1}`).split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const next = new Date(y, m, 1);
  const posts = await db.post.findMany({
    where: { ...companyWhere(user), scheduledAt: { gte: new Date(y, m - 1, 1 - 7), lt: new Date(y, m, 8) } },
    include: { company: true, targets: true },
    orderBy: { scheduledAt: "asc" },
  });

  const offset = (first.getDay() + 6) % 7; // semana empieza lunes
  const days = new Date(y, m, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => new Date(y, m - 1, i - offset + 1));
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const byDay = new Map<string, typeof posts>();
  for (const p of posts) {
    const k = key(p.scheduledAt!);
    byDay.set(k, [...(byDay.get(k) ?? []), p]);
  }
  const link = (d: Date) => `/calendar?m=${d.getFullYear()}-${d.getMonth() + 1}`;
  const title = first.toLocaleDateString("es", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title.charAt(0).toUpperCase() + title.slice(1)}</h1>
        <div className="flex gap-2">
          <Link className="btn-ghost" href={link(new Date(y, m - 2, 1))}>←</Link>
          <Link className="btn-ghost" href="/calendar">Hoy</Link>
          <Link className="btn-ghost" href={link(next)}>→</Link>
          <Link className="btn" href="/posts/new">Nuevo post</Link>
        </div>
      </div>
      <div className="hidden grid-cols-7 gap-px md:grid overflow-hidden rounded-xl border bg-gray-200 text-xs shadow-sm">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => <div key={d} className="bg-gray-100 p-2 font-medium">{d}</div>)}
        {cells.map((d) => (
          <div key={d.toISOString()} className={`min-h-28 bg-white p-1.5 ${d.getMonth() !== m - 1 ? "bg-gray-50 opacity-50" : ""}`}>
            <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${key(d) === key(now) ? "bg-indigo-600 font-semibold text-white" : "text-gray-500"}`}>{d.getDate()}</div>
            <div className="space-y-1">
              {(byDay.get(key(d)) ?? []).map((p) => (
                <Link key={p.id} href={`/posts/${p.id}`} className="block rounded border-l-4 bg-gray-50 p-1.5 shadow-sm transition hover:bg-gray-100" style={{ borderColor: p.company.color }}>
                  <div className="truncate font-medium">{p.scheduledAt!.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} {p.title}</div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="flex gap-0.5">{p.targets.map((t) => <PlatformChip key={t.id} platform={t.platform} />)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Móvil: agenda en lista */}
      <div className="space-y-2 md:hidden">
        {posts.filter((p) => p.scheduledAt! >= first && p.scheduledAt! < next).map((p) => (
          <Link key={p.id} href={`/posts/${p.id}`} className="card flex items-center gap-3 border-l-4 p-3" style={{ borderLeftColor: p.company.color }}>
            <div className="w-12 text-center leading-tight"><div className="text-lg font-bold">{p.scheduledAt!.getDate()}</div><div className="text-[10px] uppercase text-gray-500">{p.scheduledAt!.toLocaleDateString("es", { weekday: "short" })}</div></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{p.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1"><span className="mr-1 text-xs text-gray-500">{p.scheduledAt!.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</span>{p.targets.map((t) => <PlatformChip key={t.id} platform={t.platform} />)}<StatusBadge status={p.status} /></div>
            </div>
          </Link>
        ))}
        {posts.filter((p) => p.scheduledAt! >= first && p.scheduledAt! < next).length === 0 && <p className="text-center text-sm text-gray-500">Nada programado este mes.</p>}
      </div>
    </div>
  );
}
