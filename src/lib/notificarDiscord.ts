export type GravidadeDiscord = "critico" | "geral";

export async function notificarDiscord(mensagem: string, gravidade: GravidadeDiscord): Promise<void> {
  const url = gravidade === "critico"
    ? process.env.DISCORD_WEBHOOK_CRITICO
    : process.env.DISCORD_WEBHOOK_GERAL;

  if (!url) {
    console.error(`[notificarDiscord] webhook ${gravidade} não configurado`);
    return;
  }

  const content = gravidade === "critico" ? `@everyone ${mensagem}` : mensagem;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        allowed_mentions: { parse: gravidade === "critico" ? ["everyone"] : [] },
      }),
    });
  } catch (err) {
    console.error("[notificarDiscord] falha ao enviar alerta:", err);
  }
}
