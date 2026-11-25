import type { Platform, PostStatus } from "@prisma/client";

export const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: "TIKTOK", label: "TikTok", color: "#111827" },
  { id: "INSTAGRAM", label: "Instagram", color: "#db2777" },
  { id: "FACEBOOK", label: "Facebook", color: "#2563eb" },
  { id: "LINKEDIN", label: "LinkedIn", color: "#0369a1" },
];
export const platformLabel = (p: Platform) => PLATFORMS.find((x) => x.id === p)!.label;

export const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHING: "Publicando…",
  PUBLISHED: "Publicado",
  FAILED: "Falló",
};
export const STATUS_COLOR: Record<PostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  APPROVED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-amber-100 text-amber-800",
  PUBLISHING: "bg-purple-100 text-purple-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};
