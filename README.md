# Marketing OGLOB

App interna para planear campañas, programar publicaciones y ver métricas de 3 empresas
(TikTok, Instagram, Facebook, LinkedIn). La app programa; **Make publica** (TikTok vía Buffer).

## Roles
| Rol | Puede |
|---|---|
| ADMIN | Todo, incluye usuarios y empresas |
| MANAGER | Campañas, aprobar y programar posts |
| EDITOR | Crear/editar borradores |
| VIEWER | Solo ver |

Los no-admin solo ven las empresas que se les asignen en **Usuarios**.

## Despliegue en Railway
1. Nuevo proyecto → **Deploy from GitHub repo** + agregar **PostgreSQL**.
2. Variables del servicio web (ver `.env.example`): `DATABASE_URL` (referencia al Postgres), `AUTH_SECRET`,
   `CRON_SECRET`, `APP_URL` (URL pública de Railway), `MAKE_PUBLISH_WEBHOOK_URL`.
3. Build: `npm run build` · Start: `npm start` (aplica migraciones solo).
4. Una vez: `npm run db:seed` (crea el admin y 3 empresas; renómbralas en la app).

## Flujo con Make
**Publicar.** Cada minuto la app busca posts programados cuya hora ya llegó y hace `POST` a
`MAKE_PUBLISH_WEBHOOK_URL` con:
`{ targetId, platform, company, title, caption, mediaUrl, mediaType, scheduledAt, callbackUrl }`.
En Make: Webhook → Router por `platform` → módulo de Instagram/Facebook/LinkedIn, y Buffer para TikTok.
Al terminar, Make llama a `callbackUrl` (`POST /api/webhooks/make/status`, header `x-webhook-secret: <CRON_SECRET>`):
`{ "targetId": "...", "status": "published" | "failed", "externalId": "...", "externalUrl": "...", "error": "..." }`

**Métricas.** Un escenario de Make programado (cada pocas horas) lee los insights de cada post publicado y envía a
`POST /api/webhooks/make/metrics` (mismo header): `{ targetId | externalId, views, reach, likes, comments, shares, clicks }`
(también acepta un arreglo). Cada envío es una "foto"; el dashboard usa la más reciente.

## Local
```
cp .env.example .env   # DATABASE_URL de Railway o Postgres local
npm install && npx prisma migrate dev && npm run db:seed && npm run dev
```
