export type GravidadeDiscord = "critico" | "geral";

export async function notificarDiscord(mensagem: string, gravidade: GravidadeDiscord): Promise<void> {
  const url = gravidade === "critico"
    ? process.env.DISCORD_WEBHOOK_CRITICO
    : process.env.DISCORD_WEBHOOK_GERAL;

  if (!url) {
    console.error(`[notificarDiscord] webhook ${gravidade} não configurado`);
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: mensagem }),
    });
  } catch (err) {
    console.error("[notificarDiscord] falha ao enviar alerta:", err);
  }
}
