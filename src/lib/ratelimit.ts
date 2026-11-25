// Límite simple en memoria (una sola instancia en Railway): 5 fallos por correo+IP cada 15 min.
const WINDOW = 15 * 60 * 1000;
const MAX = 5;
const fails = new Map<string, number[]>();

const recent = (key: string) => (fails.get(key) ?? []).filter((t) => Date.now() - t < WINDOW);

export function isLocked(key: string) {
  return recent(key).length >= MAX;
}
export function recordFail(key: string) {
  fails.set(key, [...recent(key), Date.now()]);
  if (fails.size > 5000) fails.clear();
}
export function clearFails(key: string) {
  fails.delete(key);
}
