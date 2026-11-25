// Corre el scheduler dentro del servidor (Railway mantiene el proceso vivo).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.DISABLE_SCHEDULER) return;
  const { dispatchDue, reapStuck } = await import("./lib/dispatch");
  setInterval(async () => {
    try {
      await dispatchDue();
      await reapStuck();
    } catch (e) {
      console.error("[scheduler]", e);
    }
  }, 60_000);
}
