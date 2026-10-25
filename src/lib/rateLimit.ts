import type { NextRequest } from "next/server";

// Limite em memória por instância: freia abuso simples, mas não é global entre
// instâncias serverless. Para um limite estrito, trocar por um store compartilhado.
const hits = new Map<string, { count: number; resetAt: number }>();

export function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
}

export function rateLimited(req: NextRequest, bucket: string, max: number, windowMs: number) {
  const now = Date.now();
  const key = `${bucket}:${clientIp(req)}`;
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
