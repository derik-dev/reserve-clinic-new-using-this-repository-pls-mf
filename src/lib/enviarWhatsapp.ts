export async function enviarWhatsapp(telefone: string, mensagem: string): Promise<void> {
  const digitos = telefone.replace(/\D/g, "");

  let phone: string;
  if (digitos.startsWith("55") && digitos.length >= 12 && digitos.length <= 13) {
    phone = digitos;
  } else if (digitos.length >= 10 && digitos.length <= 11) {
    phone = `55${digitos}`;
  } else {
    throw new Error(`Telefone com formato inesperado (${digitos.length} dígitos): ${telefone}`);
  }

  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  if (!instanceId || !token) throw new Error("ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados.");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const res = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, message: mensagem }),
    }
  );

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    throw new Error(`Z-API ${res.status}: ${detalhe}`);
  }
}
