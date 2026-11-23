"use client";

import Link from "next/link";
import { CalendarCheck, CalendarRange, Check, ChevronRight, CircleAlert, CircleCheck, Copy, Hourglass, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordAvatar } from "@/components/AdminTable";
import { STATUS_LABEL, type Consulta } from "@/lib/db";
import { addDays, isSameDay, startOfDay, startOfMonth, toIsoDate } from "@/lib/agenda";
import { ASAAS_FEE, money, percentChange, summarize } from "@/lib/financeiro";
import { useFinanceiro } from "@/components/financeiro/useFinanceiro";
import styles from "./dashboard.module.css";

type Appointment = Pick<Consulta, "id" | "paciente_nome" | "data_hora" | "duracao_min" | "servico" | "profissional" | "status">;
type WeekAppointment = Appointment;
type Overview = {
  now: Date;
  today: Appointment[];
  pending: Appointment[];
  pendingCount: number;
  pastPendingCount: number;
  week: WeekAppointment[];
};
type ProfessionalItem = { id: string; nome: string; especialidade: string | null; foto_url: string | null };
type BookingSetup = { slug: string | null; ready: boolean; issue: string | null; href: string };

const APPOINTMENT_FIELDS = "id, paciente_nome, data_hora, duracao_min, servico, profissional, status";
const REQUEST_TIMEOUT = 10000;

function dayLabel(iso: string, now: Date) {
  const date = new Date(iso);
  if (isSameDay(date, now)) return "Hoje";
  if (isSameDay(date, addDays(now, 1))) return "Amanhã";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}) }).replace(".", "");
}

async function loadWeek(from: Date, to: Date): Promise<WeekAppointment[]> {
  const records: WeekAppointment[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("consultas").select(APPOINTMENT_FIELDS)
      .gte("data_hora", from.toISOString()).lt("data_hora", to.toISOString())
      .order("data_hora").order("id").range(offset, offset + 499)
      .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT));
    if (error) throw error;
    records.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) return records;
  }
}

function AppointmentRow({ appointment, now, pending = false }: { appointment: Appointment; now: Date; pending?: boolean }) {
  const date = new Date(appointment.data_hora);
  return <li>
    <Link className={styles.appointment} href={"/consultas?editar=" + appointment.id} aria-label={"Abrir consulta de " + appointment.paciente_nome + ", " + date.toLocaleString("pt-BR")}>
      <span className={styles.when}><strong>{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong><span>{dayLabel(appointment.data_hora, now)}</span></span>
      <span className={styles.identity}>
        <strong>{appointment.paciente_nome}</strong>
        <span>{[appointment.servico, appointment.profissional].filter(Boolean).join(" · ") || "Profissional e serviço não informados"}</span>
        {pending && date < now && <span className={styles.pastDue}>Horário já passou</span>}
      </span>
      {!pending && <span className={styles.appointmentStatus}><StatusBadge status={STATUS_LABEL[appointment.status]} /></span>}
      <ChevronRight className={styles.rowArrow} size={18} aria-hidden="true" />
    </Link>
  </li>;
}

function LoadingRows() {
  return <div className="dxSkeleton" role="status" aria-label="Carregando consultas"><span /><span /><span /></div>;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState<BookingSetup | null>(null);
  const [setupError, setSetupError] = useState(false);
  const [professionalList, setProfessionalList] = useState<ProfessionalItem[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [initialDay] = useState(() => startOfDay(new Date()));
  const requestSequence = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOverview = useCallback(async () => {
    const sequence = ++requestSequence.current;
    const now = new Date();
    const today = startOfDay(now);
    setLoading(true);
    setError("");
    try {
      const [pendingResult, pastPending, week] = await Promise.all([
        supabase.from("consultas").select(APPOINTMENT_FIELDS, { count: "exact" })
          .eq("status", "aguardando").order("data_hora").order("id").limit(5)
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
        supabase.from("consultas").select("id", { count: "exact", head: true })
          .eq("status", "aguardando").lt("data_hora", now.toISOString())
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
        loadWeek(today, addDays(today, 7)),
      ]);
      for (const result of [pendingResult, pastPending]) if (result.error) throw result.error;
      if (sequence !== requestSequence.current) return;
      setOverview({
        now,
        today: week.filter(appointment => isSameDay(new Date(appointment.data_hora), now)),
        pending: (pendingResult.data ?? []) as Appointment[],
        pendingCount: pendingResult.count ?? 0,
        pastPendingCount: pastPending.count ?? 0,
        week,
      });
    } catch {
      if (sequence === requestSequence.current) setError("Não foi possível atualizar as consultas. Tente novamente.");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);

  const loadSetup = useCallback(async () => {
    setSetupError(false);
    try {
      const { data: session, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !session.user) throw new Error("Sessão indisponível");
      const [profile, professionals] = await Promise.all([
        supabase.from("perfis").select("slug, valor_consulta").eq("id", session.user.id)
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)).maybeSingle(),
        supabase.from("profissionais").select("id, nome, especialidade, foto_url, valor_consulta").eq("ativo", true).order("nome")
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
      ]);
      if (profile.error || professionals.error || !profile.data) throw new Error("Configuração indisponível");
      const profileData = profile.data;
      setProfessionalList((professionals.data ?? []).map(({ id, nome, especialidade, foto_url }) => ({ id, nome, especialidade, foto_url })));
      const hasProfessionals = (professionals.data?.length ?? 0) > 0;
      const hasValue = (professionals.data ?? []).some(professional => Number(professional.valor_consulta ?? profileData.valor_consulta) > 0);
      setSetup({
        slug: profileData.slug,
        ready: hasProfessionals && hasValue && !!profileData.slug,
        issue: !hasProfessionals ? "Cadastre um profissional para liberar o link de agendamento." : !hasValue ? "Defina o valor da consulta para liberar o link de agendamento." : !profileData.slug ? "Conclua a configuração do link de agendamento." : null,
        href: hasProfessionals ? "/configuracoes" : "/profissionais",
      });
    } catch { setSetupError(true); }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadSetup();
    const refresh = () => { if (document.visibilityState === "visible") void loadOverview(); };
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadOverview, loadSetup]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  async function copyBookingLink() {
    if (!setup?.ready || !setup.slug) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + "/agendamento/" + setup.slug);
      setCopied(true);
      setNotice({ ok: true, message: "Link de agendamento copiado." });
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch { setNotice({ ok: false, message: "Não foi possível copiar o link. Tente novamente." }); }
  }

  const now = overview?.now ?? initialDay;
  const today = startOfDay(now);
  const dayISO = toIsoDate(today);
  const [financeMonth] = useState<Date>(() => startOfMonth(new Date()));
  const finance = useFinanceiro(financeMonth);
  const financeSummary = useMemo(() => summarize(finance.atual), [finance.atual]);
  const financePrevious = useMemo(() => summarize(finance.anterior), [finance.anterior]);
  const financeReady = !finance.revenueLoading && !finance.revenueFailed;
  const netChange = percentChange(financeSummary.liquido, financePrevious.liquido);
  const available = !!overview && !error;
  const activeToday = overview?.today.filter(appointment => appointment.status !== "cancelada") ?? [];
  const completedToday = activeToday.filter(appointment => appointment.status === "concluida").length;
  const pendingToday = activeToday.filter(appointment => appointment.status === "aguardando").length;
  const nextSeven = overview?.week.filter(appointment => new Date(appointment.data_hora) >= now && (appointment.status === "aguardando" || appointment.status === "confirmada")).length ?? 0;
  const miniAgendaDays = Array.from({ length: 3 }, (_, i) => {
    const date = addDays(today, i);
    const records = overview?.week.filter(appointment => isSameDay(new Date(appointment.data_hora), date)) ?? [];
    return { date, records, activeCount: records.filter(appointment => appointment.status !== "cancelada").length };
  });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    const records = overview?.week.filter(appointment => isSameDay(new Date(appointment.data_hora), date)) ?? [];
    return { date, active: records.filter(appointment => appointment.status !== "cancelada").length, cancelled: records.filter(appointment => appointment.status === "cancelada").length };
  });
  const headingDate = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const newAppointmentHref = "/consultas?nova=1&data=" + dayISO;

  return <div className={styles.page}>
    <header className={"dxHeader " + styles.header}>
      <div><h1>Visão geral</h1><p className="dxMeta">{headingDate}</p></div>
      <div className="dxActions">
        <button className="secondaryButton" onClick={copyBookingLink} disabled={!setup?.ready || setupError}>
          {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Link copiado" : "Copiar link de agendamento"}
        </button>
        <Link href={newAppointmentHref} className="primaryButton"><Plus size={17} /> Nova consulta</Link>
      </div>
    </header>

    {notice && <p className={styles.notice} role={notice.ok ? "status" : "alert"}>{notice.message}</p>}
    {setupError ? <div className={styles.setupHint} role="alert"><span>Não foi possível carregar o link de agendamento.</span><button className="dxCardLink" onClick={loadSetup}>Tentar novamente</button></div> : setup?.issue && <div className={styles.setupHint}><span>{setup.issue}</span><Link href={setup.href} className="dxCardLink">Concluir configuração</Link></div>}
    {error && <div className="dxError" role="alert"><span>{error}</span><button className="secondaryButton" onClick={loadOverview}>Tentar novamente</button></div>}

    <section className={styles.metrics} aria-label="Resumo financeiro do mês" aria-busy={finance.revenueLoading}>
      <Link href="/financeiro" className="dxKpi" data-metric="gross">
        <span className="dxKpiLabel">Valor bruto</span><strong className={"dxKpiValue " + styles.moneyKpi}>{financeReady ? money(financeSummary.bruto) : "—"}</strong>
        <span className="dxKpiHint">{financeReady ? financeSummary.transacoes + (financeSummary.transacoes === 1 ? " transação" : " transações") + " neste mês" : "Pago pelos pacientes"}</span>
      </Link>
      <Link href="/financeiro" className="dxKpi" data-metric="fee">
        <span className="dxKpiLabel">Taxa da Asaas</span><strong className={"dxKpiValue " + styles.moneyKpi}>{financeReady ? money(financeSummary.taxa) : "—"}</strong>
        <span className="dxKpiHint">{money(ASAAS_FEE)} em cada transação</span>
      </Link>
      <Link href="/financeiro" className="dxKpi" data-metric="net">
        <span className="dxKpiLabel">Valor líquido</span><strong className={"dxKpiValue " + styles.moneyKpi}>{financeReady ? money(financeSummary.liquido) : "—"}</strong>
        <span className="dxKpiHint">{financeReady && netChange !== null ? <><span className={netChange >= 0 ? styles.trendUp : styles.trendDown}>{netChange >= 0 ? <TrendingUp size={15} aria-hidden="true" /> : <TrendingDown size={15} aria-hidden="true" />}{Math.abs(Math.round(netChange))}%</span> em relação ao mês anterior</> : "O que fica para o consultório"}</span>
      </Link>
      <Link href="/financeiro" className="dxKpi" data-metric="available">
        <span className="dxKpiLabel">Disponível para sacar</span><strong className={"dxKpiValue " + styles.moneyKpi}>{!finance.walletLoading && finance.wallet.balance !== null ? money(finance.wallet.balance) : "—"}</strong>
        <span className="dxKpiHint">Já descontados os saques feitos</span>
      </Link>
    </section>

    <div className={styles.mainGrid}>
      <section className="dxCard" aria-labelledby="dashboard-upcoming">
        <div className="dxCardHead"><h2 id="dashboard-upcoming">Agenda · próximos três dias</h2><Link href={"/agenda?data=" + dayISO} className="dxCardLink">Ver agenda</Link></div>
        {loading && !overview ? <LoadingRows /> : !available ? <div className="dxEmpty"><strong>Agenda indisponível</strong><p>Tente atualizar os dados acima.</p></div> : <div className={styles.miniAgendaScroll} role="region" tabIndex={0} aria-label="Prévia da agenda dos próximos três dias. Role horizontalmente para ver todas as datas.">
          <div className={styles.miniAgenda}>
            {miniAgendaDays.map(({ date, records, activeCount }, index) => <section className={styles.miniAgendaDay} key={toIsoDate(date)} aria-label={date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}>
              <Link className={styles.miniAgendaDayHead} href={"/agenda?data=" + toIsoDate(date)}>
                <span>{index === 0 ? "Hoje" : date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                <strong>{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</strong>
                <small>{activeCount} {activeCount === 1 ? "consulta" : "consultas"}</small>
              </Link>
              <ul className={styles.miniAgendaEvents}>
                {records.length === 0 ? <li className={styles.miniAgendaEmpty}>Sem consultas</li> : records.slice(0, 3).map(appointment => <li key={appointment.id}>
                  <Link className={styles.miniAgendaEvent} href={"/consultas?editar=" + appointment.id}>
                    <time dateTime={appointment.data_hora}>{new Date(appointment.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
                    <strong>{appointment.paciente_nome}</strong>
                    <small>{[appointment.servico, appointment.profissional].filter(Boolean).join(" · ") || "Profissional e serviço não informados"}</small>
                    <StatusBadge status={STATUS_LABEL[appointment.status]} />
                  </Link>
                </li>)}
              </ul>
              {records.length > 3 && <Link className={styles.miniAgendaMore} href={"/agenda?data=" + toIsoDate(date)}>+{records.length - 3} mais</Link>}
            </section>)}
          </div>
        </div>}
      </section>
      <section className={"dxCard " + styles.professionalsCard} aria-labelledby="dashboard-professionals">
        <div className="dxCardHead"><h2 id="dashboard-professionals">Profissionais</h2>{professionalList && professionalList.length > 0 && <Link href="/profissionais" className="dxCardLink">Ver todos</Link>}</div>
        {professionalList === null ? (setupError ? <div className="dxEmpty"><strong>Profissionais indisponíveis</strong><p>Tente atualizar a página.</p></div> : <LoadingRows />) : professionalList.length === 0 ? (
          <div className={styles.professionalsEmpty}>
            <p>Você ainda não tem profissionais cadastrados.</p>
            <Link href="/profissionais" className="primaryButton"><Plus size={17} /> Adicionar profissional</Link>
          </div>
        ) : (
          <ul className={styles.professionals}>
            {professionalList.map(professional => <li key={professional.id}>
              <Link href="/profissionais" className={styles.professionalRow}>
                <RecordAvatar name={professional.nome} src={professional.foto_url} />
                <span className={styles.professionalName}><strong>{professional.nome}</strong><small>{professional.especialidade || "Especialidade não informada"}</small></span>
                <ChevronRight className={styles.rowArrow} size={18} aria-hidden="true" />
              </Link>
            </li>)}
          </ul>
        )}
      </section>
    </div>

    <section className={styles.statusBar} aria-label="Situação da clínica" aria-busy={loading}>
      <h2 className={styles.statusTitle}>Situação da clínica</h2>
      <div className={styles.statusItems}>
        <Link href={"/agenda?data=" + dayISO} className={styles.statusItem} data-tone="blue" data-metric="today">
          <span className={styles.statusIcon}><CalendarCheck size={20} aria-hidden="true" /></span>
          <span className={styles.statusText}>
            <small>Consultas hoje</small>
            <strong>{available ? activeToday.length + (activeToday.length === 1 ? " consulta" : " consultas") : "—"}</strong>
            <em>{available ? completedToday + (completedToday === 1 ? " concluída · " : " concluídas · ") + pendingToday + " a confirmar" : "Agenda do dia"}</em>
          </span>
        </Link>
        <Link href="/consultas" className={styles.statusItem} data-tone={available && overview.pendingCount > 0 ? "amber" : "green"} data-metric="pending">
          <span className={styles.statusIcon}>{available && overview.pendingCount > 0 ? <Hourglass size={20} aria-hidden="true" /> : <CircleCheck size={20} aria-hidden="true" />}</span>
          <span className={styles.statusText}>
            <small>Confirmações</small>
            <strong>{available ? overview.pendingCount > 0 ? overview.pendingCount + (overview.pendingCount === 1 ? " pendente" : " pendentes") : "Confirmações em dia" : "—"}</strong>
            <em>{available ? overview.pendingCount > 0 ? "Toque para revisar" : "Nada aguardando você" : "Pendências de todas as datas"}</em>
          </span>
        </Link>
        <Link href={"/agenda?data=" + dayISO} className={styles.statusItem} data-tone="blue" data-metric="upcoming">
          <span className={styles.statusIcon}><CalendarRange size={20} aria-hidden="true" /></span>
          <span className={styles.statusText}>
            <small>Próximos 7 dias</small>
            <strong>{available ? nextSeven + (nextSeven === 1 ? " consulta" : " consultas") : "—"}</strong>
            <em>Por vir, de hoje a {addDays(today, 6).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}</em>
          </span>
        </Link>
        <Link href="/consultas" className={styles.statusItem} data-tone={available && overview.pastPendingCount > 0 ? "red" : "green"} data-metric="past-due">
          <span className={styles.statusIcon}>{available && overview.pastPendingCount > 0 ? <CircleAlert size={20} aria-hidden="true" /> : <CircleCheck size={20} aria-hidden="true" />}</span>
          <span className={styles.statusText}>
            <small>Horários atrasados</small>
            <strong>{available ? overview.pastPendingCount > 0 ? overview.pastPendingCount + (overview.pastPendingCount === 1 ? " atrasado" : " atrasados") : "Sem pendências atrasadas" : "—"}</strong>
            <em>{available ? overview.pastPendingCount > 0 ? "Confirme ou cancele" : "Nenhum horário vencido" : "Pendências atrasadas"}</em>
          </span>
        </Link>
      </div>
    </section>
  </div>;
}
