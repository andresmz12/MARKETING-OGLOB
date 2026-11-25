import type { Platform } from "@prisma/client";
import { PLATFORMS } from "@/lib/platforms";

const SHORT: Record<Platform, string> = { TIKTOK: "TT", INSTAGRAM: "IG", FACEBOOK: "FB", LINKEDIN: "IN" };

export function PlatformChip({ platform, full }: { platform: Platform; full?: boolean }) {
  const p = PLATFORMS.find((x) => x.id === platform)!;
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white" style={{ background: p.color }}>
      {full ? p.label : SHORT[platform]}
    </span>
  );
}
