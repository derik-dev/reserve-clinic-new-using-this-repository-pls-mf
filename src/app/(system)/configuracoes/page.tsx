"use client";

import { Check, Copy, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

function pixField(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return ((crc & 0xffff).toString(16).toUpperCase().padStart(4, "0"));
}

function gerarPixPayload(chave: string, nome: string, cidade: string): string {
  const mai = pixField("00", "BR.GOV.BCB.PIX") + pixField("01", chave);
  const body = [
    pixField("00", "01"),
    pixField("26", mai),
    pixField("52", "0000"),
    pixField("53", "986"),
    pixField("58", "BR"),
    pixField("59", nome.slice(0, 25)),
    pixField("60", (cidade || "Brasil").slice(0, 15)),
    pixField("62", pixField("05", "***")),
    "6304",
  ].join("");
  return body + crc16(body);
}

export default function ConfiguracoesPage() {
  const [pixChave, setPixChave] = useState("");
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilCidade, setPerfilCidade] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;
      const { data } = await supabase.from("perfis").select("nome, endereco_cidade, pix_chave").eq("id", session.user.id).maybeSingle();
      if (data) {
        const d = data as { nome: string; endereco_cidade: string | null; pix_chave: string | null };
        setPerfilNome(d.nome ?? "");
        setPerfilCidade(d.endereco_cidade ?? "");
        setPixChave(d.pix_chave ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setSaving(false); return; }
    const { error: err } = await supabase.from("perfis").update({ pix_chave: pixChave.trim() || null }).eq("id", session.user.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleCopy() {
    if (!pixChave.trim()) return;
    await navigator.clipboard.writeText(pixChave.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const pixPayload = pixChave.trim() && perfilNome
    ? gerarPixPayload(pixChave.trim(), perfilNome, perfilCidade)
    : null;

  return <>
    <PageHeader title="Configurações" description="Personalize as opções da sua conta." />

    <section className="panel" style={{ padding: 28, maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <QrCode size={20} style={{ color: "#4c6fff" }} />
        <div>
          <strong style={{ fontSize: 14 }}>Pagamento via PIX</strong>
          <p style={{ margin: 0, color: "#7d8597", fontSize: 12 }}>
            A chave aparece como QR Code ao paciente após confirmar o agendamento.
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#858d9f", fontSize: 13 }}>Carregando…</p>
      ) : (
        <div className="formGrid">
          <div className="formRow">
            <label>Chave PIX</label>
            <input
              value={pixChave}
              onChange={(e) => setPixChave(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
            <small style={{ color: "#858d9f" }}>
              Cole aqui sua chave PIX cadastrada no banco.
            </small>
          </div>

          {pixPayload && (
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", padding: "16px 0 8px" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e8ef", borderRadius: 12, padding: 14 }}>
                <QRCode value={pixPayload} size={140} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#7d8597" }}>Prévia do QR Code que o paciente verá:</p>
                <code style={{ display: "block", fontSize: 11, background: "#f5f7fb", border: "1px solid #e0e4eb", borderRadius: 8, padding: "8px 10px", wordBreak: "break-all", color: "#2a3244" }}>{pixChave.trim()}</code>
                <button className="secondaryButton" style={{ marginTop: 8, height: 30, fontSize: 11 }} onClick={handleCopy}>
                  {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar chave</>}
                </button>
              </div>
            </div>
          )}

          {error && <div className="onboardingError">{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>
              {saved ? <><Check size={15} /> Salvo</> : saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </section>
  </>;
}
