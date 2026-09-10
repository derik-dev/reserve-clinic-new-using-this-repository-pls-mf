const DEDUP_KEY_PREFIX = "rc_err_reported_";
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

export async function reportarErroCliente(contexto: string, mensagem: string): Promise<void> {
  try {
    const key = `${DEDUP_KEY_PREFIX}${contexto}`;
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < DEDUP_WINDOW_MS) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // sessionStorage indisponível — segue sem dedup
  }

  try {
    await fetch("/api/log-erro-cliente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contexto, mensagem }),
      keepalive: true,
    });
  } catch {
    // silencioso — não bloqueia UX
  }
}
