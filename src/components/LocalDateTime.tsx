"use client";
import { useState } from "react";

// Muestra la hora local del navegador y envía ISO (UTC) al servidor
export function LocalDateTime({ name, defaultIso }: { name: string; defaultIso?: string | null }) {
  const toLocal = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const [local, setLocal] = useState(toLocal(defaultIso));
  return (
    <>
      <input type="datetime-local" className="input" value={local} onChange={(e) => setLocal(e.target.value)} />
      <input type="hidden" name={name} value={local ? new Date(local).toISOString() : ""} />
    </>
  );
}
