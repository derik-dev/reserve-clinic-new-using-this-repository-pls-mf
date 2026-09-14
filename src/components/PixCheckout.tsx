"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { supabase } from "@/lib/supabase";
import { Check, Copy, AlertCircle, Loader2 } from "lucide-react";

export type PixCheckoutProps = {
  agendamentoId: string;
  clienteNome: string;
  clienteCpf?: string;
  clienteEmail?: string;
  valor: number;
};

type PixData = { pixId: string; qrCodeBase64: string; copiaECola: string };

type RealtimePayload = { new: { status: string } };

// ─── Tokens visuais ───────────────────────────────────────────────
const C = {
  bg:       "#070a10",
  surface:  "#10141d",
  surface2: "#161b26",
  border:   "#232a38",
  blue:     "#3b82f6",
  blueGlow: "rgba(59,130,246,0.35)",
  text:     "#e8eaf0",
  muted:    "#6b7585",
  success:  "#22c55e",
  successG: "rgba(34,197,94,0.3)",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PixCheckout({
  agendamentoId,
  clienteNome,
  clienteCpf,
  clienteEmail,
  valor,
}: PixCheckoutProps) {
  const [pix, setPix] = useState<PixData | null>(null);
  const [loadingPix, setLoadingPix] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [simulando, setSimulando] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const successRef   = useRef<HTMLDivElement>(null);

  // ── 1. Buscar PIX na API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/criar-pagamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agendamentoId, clienteNome, clienteCpf, clienteEmail, valor }),
        });
        const data = await res.json() as PixData & { error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Falha ao gerar cobrança.");
        setPix(data);
      } catch (e) {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : "Erro ao gerar o PIX.");
      } finally {
        if (!cancelled) setLoadingPix(false);
      }
    })();
    return () => { cancelled = true; };
  }, [agendamentoId, clienteNome, clienteCpf, clienteEmail, valor, tentativa]);

  // ── 2. Realtime — aguarda confirmação de pagamento
  useEffect(() => {
    const channel = supabase
      .channel(`pix-${agendamentoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agendamentos", filter: `id=eq.${agendamentoId}` },
        (payload: RealtimePayload) => {
          if (payload.new.status === "confirmado") setConfirmado(true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agendamentoId]);

  // ── 2b. Polling — fallback para quando o Realtime não dispara
  // (webhook aponta para localhost em dev, ou Realtime não habilitado na tabela)
  useEffect(() => {
    if (!pix || confirmado) return;
    const id = setInterval(async () => {
      const { data } = await supabase
        .from("agendamentos")
        .select("status")
        .eq("id", agendamentoId)
        .maybeSingle();
      if (data?.status === "confirmado") setConfirmado(true);
    }, 5000);
    return () => clearInterval(id);
  }, [pix, confirmado, agendamentoId]);

  // ── 3. GSAP — entrada do card
  useEffect(() => {
    if (loadingPix || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".px-animate", {
        opacity: 0,
        y: 28,
        stagger: 0.09,
        duration: 0.6,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [loadingPix]);

  // ── 4. GSAP — tela de sucesso
  useEffect(() => {
    if (!confirmado || !successRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".px-success", {
        opacity: 0,
        scale: 0.88,
        duration: 0.55,
        ease: "back.out(1.5)",
        stagger: 0.1,
      });
    }, successRef);
    return () => ctx.revert();
  }, [confirmado]);

  async function simularPagamento() {
    setSimulando(true);
    try {
      await fetch("/api/simular-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agendamentoId }),
      });
      setConfirmado(true);
    } finally {
      setSimulando(false);
    }
  }

  async function copiar() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback silencioso — usuário pode copiar manualmente
    }
  }

  // ─── Layout raiz ──────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "Inter, var(--font-plex), sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow ambiente */}
      <div aria-hidden style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 480,
        height: 480,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.blueGlow} 0%, transparent 65%)`,
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      {/* ─── Tela de sucesso ──────────────────────── */}
      {confirmado ? (
        <div ref={successRef} style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: `0 0 60px ${C.successG}`,
        }}>
          <div className="px-success" style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.15)",
            border: `2px solid ${C.success}`,
            display: "grid",
            placeItems: "center",
            margin: "0 auto 24px",
            boxShadow: `0 0 32px ${C.successG}`,
          }}>
            <Check size={32} color={C.success} strokeWidth={2.5} />
          </div>
          <h2 className="px-success" style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 28,
            fontWeight: 400,
            color: C.text,
            margin: "0 0 10px",
            lineHeight: 1.2,
          }}>
            Pagamento <em style={{ fontStyle: "italic", color: C.success }}>confirmado!</em>
          </h2>
          <p className="px-success" style={{ color: C.muted, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            Sua consulta foi agendada com sucesso.<br />Em breve você receberá a confirmação.
          </p>
        </div>
      ) : (
        /* ─── Card principal ──────────────────────── */
        <div ref={containerRef} style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
        }}>
          {/* Header do card */}
          <div className="px-animate" style={{ marginBottom: 6, textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Agendamento Reserve Clinic
            </p>
            <h1 style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: 36,
              color: C.text,
              margin: 0,
              lineHeight: 1.1,
            }}>
              Pague com <em style={{ fontStyle: "italic", color: C.blue }}>PIX</em>
            </h1>
            <p style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: 26,
              fontWeight: 600,
              color: C.text,
              margin: "8px 0 0",
            }}>
              {formatBRL(valor)}
            </p>
          </div>

          {/* Card de conteúdo */}
          <div className="px-animate" style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: 28,
            marginTop: 20,
          }}>
            {loadingPix ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
                <Loader2 size={32} style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 12px" }} />
                <p style={{ margin: 0, fontSize: 14 }}>Gerando cobrança PIX…</p>
              </div>
            ) : fetchError ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#f87171" }}>
                <AlertCircle size={28} style={{ margin: "0 auto 10px", display: "block" }} />
                <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.5 }}>{fetchError}</p>
                <button
                  onClick={() => { setFetchError(null); setLoadingPix(true); setTentativa(t => t + 1); }}
                  style={{
                    background: "transparent",
                    border: `1px solid #f87171`,
                    color: "#f87171",
                    borderRadius: 10,
                    padding: "8px 20px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : pix ? (
              <>
                {/* QR Code */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <p style={{ color: C.muted, fontSize: 12, margin: "0 0 14px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Escaneie com seu banco
                  </p>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    {/* Glow atrás do QR */}
                    <div aria-hidden style={{
                      position: "absolute",
                      inset: -12,
                      borderRadius: 16,
                      background: `radial-gradient(circle, ${C.blueGlow} 0%, transparent 70%)`,
                      filter: "blur(20px)",
                    }} />
                    <div style={{
                      position: "relative",
                      background: "#fff",
                      borderRadius: 12,
                      padding: 14,
                      display: "inline-block",
                      boxShadow: `0 0 0 1px ${C.border}, 0 4px 24px rgba(0,0,0,0.4)`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${pix.qrCodeBase64}`}
                        alt="QR Code PIX"
                        width={180}
                        height={180}
                        style={{ display: "block" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Divisor */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "0 0 16px",
                  color: C.muted,
                  fontSize: 12,
                }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  ou copie o código
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                {/* Botão copia-e-cola */}
                <button
                  onClick={copiar}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1px solid ${copied ? C.success : C.blue}`,
                    background: copied
                      ? "rgba(34,197,94,0.08)"
                      : `rgba(59,130,246,0.08)`,
                    color: copied ? C.success : C.blue,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: copied
                      ? `0 0 16px ${C.successG}`
                      : `0 0 16px rgba(59,130,246,0.15)`,
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Código copiado!" : "Copiar código PIX"}
                </button>

                {/* Status aguardando */}
                <div style={{
                  marginTop: 20,
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  <PulsingDot />
                  <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.4 }}>
                    Aguardando confirmação do pagamento…
                    <br />
                    <span style={{ fontSize: 11 }}>Esta página atualiza automaticamente.</span>
                  </p>
                </div>

                {/* Botão de simulação para testes */}
                <button
                  onClick={simularPagamento}
                  disabled={simulando}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: `1px dashed rgba(255,255,255,0.12)`,
                    background: "transparent",
                    color: "rgba(255,255,255,0.28)",
                    fontSize: 12,
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                    transition: "color 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.28)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                >
                  {simulando ? "Simulando…" : "🧪 Simular pagamento confirmado"}
                </button>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <p className="px-animate" style={{
            textAlign: "center",
            color: C.muted,
            fontSize: 11,
            marginTop: 16,
            letterSpacing: "0.04em",
          }}>
            Pagamento seguro · Reserve Clinic
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.75); } }
      `}</style>
    </div>
  );
}

function PulsingDot() {
  return (
    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#3b82f6",
            animation: `pulse-dot 1.4s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}
