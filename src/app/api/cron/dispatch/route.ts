import { NextResponse } from "next/server";
import { dispatchDue, reapStuck } from "@/lib/dispatch";
import { authorizedWebhook } from "@/lib/rollup";

export const dynamic = "force-dynamic";

// Alternativa al scheduler interno: un Cron de Railway puede llamar esto cada minuto.
async function run(req: Request) {
  if (!authorizedWebhook(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await dispatchDue();
  await reapStuck();
  return NextResponse.json(result);
}
export const GET = run;
export const POST = run;
