"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { reportarErroCliente } from "@/lib/reportarErroCliente";
import { DEFAULT_CONFIG, capitalize, mergeConfig, type AgendaConfig } from "@/lib/agenda";
import { busyByDay, monthWindow, rangeOf, whatsappLink, type Busy, type Slot } from "@/lib/booking";
import { Avatar } from "./Avatar";
import { BookingDone, type DoneInfo } from "./BookingDone";
import { BookingPix } from "./BookingPix";
import { PaymentStep } from "./PaymentStep";
import { ProfessionalStep } from "./ProfessionalStep";
import { ScheduleStep } from "./ScheduleStep";
import { StepProgress } from "./StepProgress";
import type { Patient, PerfilPublic, ProfissionalPublic, Selection } from "./types";
import styles from "./booking.module.css";

type StepId = "profissional" | "horario" | "pagamento";
type Phase = "form" | "reserving" | "pix" | "done";

const STEP_LABEL: Record<StepId, string> = { profissional: "Profissional", horario: "Horário", pagamento: "Pagamento" };
const LEAVE_MS = 220;
const emptyPatient: Patient = { nome: "", email: "", cpf: "", telefone: "" };

export default function AgendamentoPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const profParam = useSearchParams().get("p");

  const [perfil, setPerfil] = useState<PerfilPublic | null>(null);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [profissionais, setProfissionais] = useState<ProfissionalPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(false);

  const [sel, setSel] = useState<Selection>({ profissional: null, data: "", hora: "" });
  const [patient, setPatient] = useState<Patient>(emptyPatient);
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [agendamentoId, setAgendamentoId] = useState("");
  const [serverError, setServerError] = useState("");
  const [doneKind, setDoneKind] = useState<DoneInfo["kind"]>("confirmed");

  const [busy, setBusy] = useState<Map<string, Busy[]>>(new Map());
  const [busyLoading, setBusyLoading] = useState(false);
  const loadedMonths = useRef(new Set<string>());
  const headingRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);

  /* ── Carregar clínica, configuração e profissionais ─────── */
  const loadData = useCallback(async () => {
    setInitError(false);
    setLoading(true);
    try {
      await Promise.race([
        (async () => {
          const { data } = await supabase.from("perfis")
            .select("id, nome, slug, logo_url, telefone, endereco_rua, endereco_numero, endereco_cidade, endereco_uf, valor_consulta")
            .eq("slug", slug).maybeSingle();
          setPerfil(data as PerfilPublic | null);
          if (!data) return;
          const perfilId = (data as PerfilPublic).id;
          const [conf, profs] = await Promise.all([
            supabase.from("configuracoes").select("agenda_config").eq("perfil_id", perfilId).maybeSingle(),
            supabase.from("profissionais").select("id, nome, especialidade, foto_url, valor_consulta").eq("perfil_id", perfilId).eq("ativo", true).order("nome"),
          ]);
          setConfig(mergeConfig(conf.data?.agenda_config));
          const lista = (profs.data as ProfissionalPublic[] | null) ?? [];
          setProfissionais(lista);
          // Um único profissional, ou um link já direcionado (?p=), dispensa a escolha.
          const direct = lista.length === 1 ? lista[0] : lista.find(p => p.id === profParam) ?? null;
          if (direct) setSel(s => ({ ...s, profissional: direct }));
        })(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
    } catch (e) {
      void reportarErroCliente(`agendamento/${slug}`, e instanceof Error ? e.message : String(e));
      setInitError(true);
    } finally {
      setLoading(false);
    }
  }, [slug, profParam]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  /* ── Etapas ─────────────────────────────────────────────── */
  const skipProfessional = profissionais.length <= 1 || (profParam !== null && profissionais.some(p => p.id === profParam));
  const invalidDoctorLink = profParam !== null && profissionais.length > 1 && !profissionais.some(p => p.id === profParam);
  const stepIds: StepId[] = skipProfessional ? ["horario", "pagamento"] : ["profissional", "horario", "pagamento"];
  const stepId = stepIds[Math.min(stepIdx, stepIds.length - 1)];
  const finished = phase === "done";
  const locked = phase !== "form";

  const price = sel.profissional?.valor_consulta ?? perfil?.valor_consulta ?? null;
  const faixa = sel.hora ? rangeOf(sel.hora, config.duracao_min) : "";
  const dayLabel = sel.data ? new Date(`${sel.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(".", "").replace(".", "") : "";

  function go(next: number) {
    if (next === stepIdx || leaving || next < 0 || next >= stepIds.length) return;
    setDir(next > stepIdx ? "forward" : "back");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setStepIdx(next); return; }
    setLeaving(true);
    timer.current = window.setTimeout(() => { setStepIdx(next); setLeaving(false); }, LEAVE_MS);
  }

  // Ao trocar de etapa, o foco vai para o título (leitores de tela e teclado).
  useEffect(() => {
    if (!loading) headingRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [stepIdx, finished, loading, phase]);

  function pickProfessional(p: ProfissionalPublic) {
    if (sel.profissional?.id !== p.id) {
      setSel({ profissional: p, data: "", hora: "" });
      setBusy(new Map());
      loadedMonths.current.clear();
    }
    go(stepIdx + 1);
  }

  function pickSlot(slot: Slot) {
    setServerError("");
    setSel(s => ({ ...s, hora: slot.startLabel }));
    go(stepIdx + 1);
  }

  /* ── Horários ocupados do mês exibido ───────────────────── */
  const loadMonth = useCallback(async (month: Date) => {
    if (!perfil) return;
    const profId = sel.profissional?.id ?? "";
    const key = `${profId}|${month.getFullYear()}-${month.getMonth()}`;
    if (loadedMonths.current.has(key)) return;
    loadedMonths.current.add(key);
    setBusyLoading(true);
    const { from, to } = monthWindow(month);
    const qs = new URLSearchParams({ perfil: perfil.id, from: from.toISOString(), to: to.toISOString() });
    if (profId) qs.set("profissional", profId);
    let rows: { data_hora: string; duracao_min: number }[] | null = null;
    try {
      const res = await fetch(`/api/horarios-ocupados?${qs}`, { cache: "no-store" });
      if (res.ok) rows = ((await res.json()) as { busy: { data_hora: string; duracao_min: number }[] }).busy;
    } catch { /* sem conexão: tenta de novo na próxima vez */ }
    if (!rows) loadedMonths.current.delete(key);
    else setBusy(prev => new Map([...prev, ...busyByDay(rows)]));
    setBusyLoading(false);
  }, [perfil, sel.profissional?.id]);

  /* ── Reservar o horário e seguir para o pagamento ───────── */
  async function reserve() {
    if (!perfil) return;
    setServerError("");
    setPhase("reserving");
    try {
      const res = await fetch("/api/criar-agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfilId: perfil.id,
          clienteNome: patient.nome.trim(),
          clienteTelefone: patient.telefone || undefined,
          clienteEmail: patient.email.trim() || undefined,
          data: sel.data,
          hora: sel.hora,
          duracaoMin: config.duracao_min,
          profissional: sel.profissional?.nome,
          profissionalId: sel.profissional?.id,
        }),
      });
      const body = await res.json().catch(() => ({})) as { id?: string; error?: string };
      if (res.status === 409 || res.status === 400 && /passou/.test(body.error ?? "")) {
        // Horário tomado por outra pessoa: volta para escolher outro, sem perder os dados digitados.
        setPhase("form");
        loadedMonths.current.clear();
        setBusy(new Map());
        setSel(s => ({ ...s, hora: "" }));
        setServerError(body.error ?? "Esse horário não está mais disponível.");
        go(stepIds.indexOf("horario"));
        return;
      }
      if (!res.ok || !body.id) { setPhase("form"); setServerError(body.error ?? "Não foi possível reservar agora. Tente novamente."); return; }
      setAgendamentoId(body.id);
      if (price != null && price > 0) setPhase("pix");
      else { setDoneKind("pending"); setPhase("done"); }
    } catch {
      setPhase("form");
      setServerError("Sem conexão. Confira a internet e tente novamente.");
    }
  }

  function paid() { setDoneKind("confirmed"); setPhase("done"); }

  const doneInfo: DoneInfo | null = perfil && finished
    ? { perfil, profissional: sel.profissional, data: sel.data, faixa, paciente: patient.nome.trim(), valor: price, kind: doneKind }
    : null;

  const stageClass = `${styles.step}${leaving ? ` ${styles.isLeaving}` : ""}`;

  /* ── Estados de carregamento e erro ─────────────────────── */
  if (loading) {
    return <main className={styles.page}><div className={styles.center}><div className={styles.skeletonCard} aria-busy="true" aria-label="Carregando" /></div></main>;
  }
  if (initError) {
    const wa = whatsappLink(perfil?.telefone ?? null, `Olá! Estou tentando agendar${perfil ? ` em ${perfil.nome}` : ""}, mas a página não carregou.`);
    return (
      <main className={styles.page}>
        <div className={styles.center}>
          <div className={styles.card}>
            <h1 className={styles.title}>Não foi possível carregar</h1>
            <p className={styles.hint}>Confira sua conexão e tente de novo.</p>
            <button type="button" className={styles.primaryBtn} onClick={() => void loadData()}>Tentar novamente</button>
            {wa && <a className={styles.secondaryBtn} href={wa} target="_blank" rel="noreferrer">Falar com a clínica</a>}
          </div>
        </div>
      </main>
    );
  }
  if (!perfil) {
    return <main className={styles.page}><div className={styles.center}><div className={styles.card}><h1 className={styles.title}>Clínica não encontrada</h1><p className={styles.hint}>Confira o link que você recebeu.</p></div></div></main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.center}>
        <div className={styles.wrap}>
          <header className={styles.clinic}>
            {skipProfessional && sel.profissional ? (
              <>
                <Avatar name={sel.profissional.nome} photo={sel.profissional.foto_url} size={46} />
                <span className={styles.clinicText}>
                  <span>{sel.profissional.nome}</span>
                  <small>{[sel.profissional.especialidade, perfil.nome].filter(Boolean).join(" · ")}</small>
                </span>
              </>
            ) : (
              <>
                <Avatar name={perfil.nome} photo={perfil.logo_url} size={40} />
                <span>{perfil.nome}</span>
              </>
            )}
          </header>

          {!finished && <StepProgress labels={stepIds.map(id => STEP_LABEL[id])} current={Math.min(stepIdx, stepIds.length - 1)} locked={locked || leaving} onGo={go} />}

          <section className={styles.card}>
            {!finished && stepIdx > 0 && !locked && (
              <button type="button" className={styles.backBtn} onClick={() => go(stepIdx - 1)}><ChevronLeft size={16} aria-hidden="true" /> Voltar</button>
            )}
            <div ref={headingRef} aria-live="polite" key={finished ? "done" : `${stepId}:${phase}`} className={stageClass} data-dir={dir}>
              {finished && doneInfo ? (
                <BookingDone info={doneInfo} />
              ) : stepId === "profissional" ? (
                <ProfessionalStep notice={invalidDoctorLink ? "O profissional deste link não está disponível agora. Escolha outro." : undefined} profissionais={profissionais} selectedId={sel.profissional?.id ?? ""} defaultPrice={perfil.valor_consulta} onPick={pickProfessional} />
              ) : stepId === "horario" ? (
                <>
                  {serverError && <p className={styles.errorBox} role="alert">{serverError}</p>}
                  <ScheduleStep
                    config={config}
                    profId={sel.profissional?.id ?? null}
                    busy={busy}
                    loading={busyLoading}
                    data={sel.data}
                    hora={sel.hora}
                    onMonthChange={m => void loadMonth(m)}
                    onPickDate={iso => setSel(s => ({ ...s, data: iso, hora: "" }))}
                    onPickSlot={pickSlot}
                  />
                </>
              ) : phase === "pix" ? (
                <>
                  <h2 className={styles.title} tabIndex={-1}>Pague com Pix</h2>
                  <p className={styles.summaryLine}>{sel.profissional ? `${sel.profissional.nome} · ` : ""}{capitalize(dayLabel)} · {faixa}</p>
                  <BookingPix agendamentoId={agendamentoId} nome={patient.nome.trim()} cpf={patient.cpf} email={patient.email.trim()} valor={price ?? 0} onPaid={paid} />
                </>
              ) : (
                <PaymentStep
                  profissional={sel.profissional}
                  dayLabel={capitalize(dayLabel)}
                  faixa={faixa}
                  valor={price}
                  patient={patient}
                  onChange={setPatient}
                  submitting={phase === "reserving"}
                  serverError={serverError}
                  onSubmit={() => void reserve()}
                />
              )}
            </div>
          </section>

          <footer className={styles.foot}><ShieldCheck size={15} aria-hidden="true" /> Agendamento seguro · Reserve Clinic</footer>
        </div>
      </div>
    </main>
  );
}
