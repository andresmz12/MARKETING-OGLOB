import type { PostStatus } from "@prisma/client";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/platforms";

export function StatusBadge({ status }: { status: PostStatus }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}
