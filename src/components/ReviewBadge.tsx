import type { ReviewStatus } from "@prisma/client";

const MAP: Record<ReviewStatus, [string, string] | null> = {
  NONE: null,
  PENDING: ["Esperando al cliente", "bg-sky-100 text-sky-700"],
  APPROVED: ["Aprobado por el cliente", "bg-emerald-100 text-emerald-700"],
  CHANGES: ["Cliente pidió cambios", "bg-rose-100 text-rose-700"],
};

export function ReviewBadge({ review }: { review: ReviewStatus }) {
  const m = MAP[review];
  return m ? <span className={`rounded px-2 py-0.5 text-xs font-medium ${m[1]}`}>{m[0]}</span> : null;
}
