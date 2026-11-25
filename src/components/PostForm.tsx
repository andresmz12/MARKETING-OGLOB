import type { Campaign, Company, Platform, Post, PostTarget } from "@prisma/client";
import { PLATFORMS } from "@/lib/platforms";
import { LocalDateTime } from "./LocalDateTime";
import { savePost } from "@/app/actions";

type Props = { post?: Post & { targets: PostTarget[] }; companies: Company[]; campaigns: Campaign[]; locked?: boolean };

export function PostForm({ post, companies, campaigns, locked }: Props) {
  const selected = new Set<Platform>(post?.targets.map((t) => t.platform) ?? []);
  return (
    <form action={savePost} className="card space-y-4">
      <fieldset disabled={locked} className="m-0 min-w-0 space-y-4 border-0 p-0">
        {post && <input type="hidden" name="id" value={post.id} />}
        <div className="grid gap-4 md:grid-cols-3">
          <div><label className="label">Empresa</label>
            <select name="companyId" defaultValue={post?.companyId} required className="input">{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Campaña</label>
            <select name="campaignId" defaultValue={post?.campaignId ?? ""} className="input"><option value="">— Ninguna —</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Fecha y hora de publicación</label><LocalDateTime name="scheduledAt" defaultIso={post?.scheduledAt?.toISOString()} /></div>
        </div>
        <div><label className="label">Título interno</label><input name="title" defaultValue={post?.title} required className="input" /></div>
        <div><label className="label">Texto / caption</label><textarea name="caption" defaultValue={post?.caption} rows={5} className="input" /></div>
        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
          <div><label className="label">URL del flyer o video (pública)</label><input name="mediaUrl" defaultValue={post?.mediaUrl} placeholder="https://…" className="input" /></div>
          <div><label className="label">Tipo</label>
            <select name="mediaType" defaultValue={post?.mediaType ?? "IMAGE"} className="input"><option value="IMAGE">Imagen</option><option value="VIDEO">Video</option></select></div>
        </div>
        <div><label className="label">Publicar en</label>
          <div className="flex flex-wrap gap-4">
            {PLATFORMS.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="platforms" value={p.id} defaultChecked={selected.has(p.id)} /> {p.label}
              </label>
            ))}
          </div>
        </div>
        <button className="btn">{post ? "Guardar cambios (vuelve a borrador)" : "Crear borrador"}</button>
      </fieldset>
    </form>
  );
}
