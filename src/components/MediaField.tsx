"use client";
import { useRef, useState } from "react";

export function MediaField({ defaultUrl, defaultType }: { defaultUrl?: string; defaultType?: string }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [type, setType] = useState(defaultType ?? "IMAGE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true); setError("");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir");
      setUrl(json.url); setType(json.type);
    } catch (e) { setError(e instanceof Error ? e.message : "Error al subir"); }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="label">Flyer o video</label>
          <input name="mediaUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Sube un archivo o pega una URL pública" className="input" />
        </div>
        <div className="w-36">
          <label className="label">Tipo</label>
          <select name="mediaType" value={type} onChange={(e) => setType(e.target.value)} className="input"><option value="IMAGE">Imagen</option><option value="VIDEO">Video</option></select>
        </div>
        <input ref={input} type="file" hidden accept="image/*,video/mp4,video/quicktime" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Subiendo…" : "Subir archivo"}</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {url && (
        <div className="overflow-hidden rounded-lg border bg-gray-100 sm:w-64">
          {type === "VIDEO" ? <video src={url} controls className="max-h-64 w-full" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="Vista previa" className="max-h-64 w-full object-contain" />}
        </div>
      )}
    </div>
  );
}
