"use client";

import Link from "next/link";
import { Check, ChevronRight, Copy, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_LABEL, type Consulta } from "@/lib/db";
import { addDays, isSameDay, startOfDay, toIsoDate } from "@/lib/agenda";
import styles from "./dashboard.module.css";

type Appointment = Pick<Consulta, "id" | "paciente_nome" | "data_hora" | "duracao_min" | "servico" | "profissional" | "status">;
type WeekAppointment = Pick<Consulta, "data_hora" | "status">;
type Overview = {
  now: Date;
  today: WeekAppointment[];
  upcoming: Appointment[];
  pending: Appointment[];
  pendingCount: number;
  pastPendingCount: number;
  week: WeekAppointment[];
};
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
    const { data, error } = await supabase.from("consultas").select("data_hora, status")
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
      const [upcomingResult, pendingResult, pastPending, week] = await Promise.all([
        supabase.from("consultas").select(APPOINTMENT_FIELDS)
          .in("status", ["aguardando", "confirmada"]).gte("data_hora", now.toISOString())
          .order("data_hora").order("id").limit(6).abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
        supabase.from("consultas").select(APPOINTMENT_FIELDS, { count: "exact" })
          .eq("status", "aguardando").order("data_hora").order("id").limit(5)
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
        supabase.from("consultas").select("id", { count: "exact", head: true })
          .eq("status", "aguardando").lt("data_hora", now.toISOString())
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
        loadWeek(today, addDays(today, 7)),
      ]);
      for (const result of [upcomingResult, pendingResult, pastPending]) if (result.error) throw result.error;
      if (sequence !== requestSequence.current) return;
      setOverview({
        now,
        today: week.filter(appointment => isSameDay(new Date(appointment.data_hora), now)),
        upcoming: (upcomingResult.data ?? []) as Appointment[],
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
        supabase.from("profissionais").select("id, valor_consulta").eq("ativo", true)
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT)),
      ]);
      if (profile.error || professionals.error || !profile.data) throw new Error("Configuração indisponível");
      const profileData = profile.data;
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
  const available = !!overview && !error;
  const activeToday = overview?.today.filter(appointment => appointment.status !== "cancelada") ?? [];
  const completedToday = activeToday.filter(appointment => appointment.status === "concluida").length;
  const pendingToday = activeToday.filter(appointment => appointment.status === "aguardando").length;
  const nextSeven = overview?.week.filter(appointment => new Date(appointment.data_hora) >= now && (appointment.status === "aguardando" || appointment.status === "confirmada")).length ?? 0;
  const days = Array.from({ length: 7 }, (_, i) => {
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

    <section className={styles.metrics} aria-label="Resumo operacional" aria-busy={loading}>
      <Link href={"/agenda?data=" + dayISO} className="dxKpi" data-metric="today">
        <span className="dxKpiLabel">Consultas hoje</span><strong className="dxKpiValue">{available ? activeToday.length : "—"}</strong>
        <span className="dxKpiHint">{available ? completedToday + (completedToday === 1 ? " concluída · " : " concluídas · ") + pendingToday + " a confirmar" : "Agenda do dia"}</span>
      </Link>
      <Link href="/consultas" className={"dxKpi" + (available && overview.pendingCount > 0 ? " isAlert" : "")} data-metric="pending">
        <span className="dxKpiLabel">Aguardando confirmação</span><strong className="dxKpiValue">{available ? overview.pendingCount : "—"}</strong>
        <span className="dxKpiHint">{available ? overview.pastPendingCount > 0 ? overview.pastPendingCount + " com horário já passado" : "Nenhum horário passado pendente" : "Pendências de todas as datas"}</span>
      </Link>
      <Link href={"/agenda?data=" + dayISO} className="dxKpi" data-metric="upcoming">
        <span className="dxKpiLabel">Próximos 7 dias</span><strong className="dxKpiValue">{available ? nextSeven : "—"}</strong>
        <span className="dxKpiHint">Por vir, de hoje a {addDays(today, 6).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}</span>
      </Link>
    </section>

    <div className={styles.mainGrid}>
      <section className="dxCard" aria-labelledby="dashboard-upcoming">
        <div className="dxCardHead"><h2 id="dashboard-upcoming">Próximos atendimentos</h2><Link href={"/agenda?data=" + dayISO} className="dxCardLink">Ver agenda</Link></div>
        {loading && !overview ? <LoadingRows /> : !available ? <div className="dxEmpty"><strong>Consultas indisponíveis</strong><p>Tente atualizar os dados acima.</p></div> : overview.upcoming.length === 0 ? <div className="dxEmpty"><strong>Nenhum atendimento por vir</strong><p>As próximas consultas aparecerão aqui.</p><Link href={newAppointmentHref} className="dxCardLink">Nova consulta</Link></div> : <ul className={styles.appointments}>{overview.upcoming.map(appointment => <AppointmentRow key={appointment.id} appointment={appointment} now={now} />)}</ul>}
      </section>
      <section className={"dxCard " + styles.pendingSection} aria-labelledby="dashboard-pending">
        <div className="dxCardHead"><h2 id="dashboard-pending">Aguardando confirmação</h2><Link href="/consultas" className="dxCardLink">Ver todas</Link></div>
        {loading && !overview ? <LoadingRows /> : !available ? <div className="dxEmpty"><strong>Pendências indisponíveis</strong><p>Tente atualizar os dados acima.</p></div> : overview.pending.length === 0 ? <div className="dxEmpty"><strong>Nenhuma confirmação pendente</strong><p>Você está em dia com as confirmações.</p></div> : <ul className={styles.appointments}>{overview.pending.map(appointment => <AppointmentRow key={appointment.id} appointment={appointment} now={now} pending />)}</ul>}
      </section>
    </div>

    <section className={"dxCard " + styles.weekSection} aria-labelledby="dashboard-week">
      <div className="dxCardHead"><h2 id="dashboard-week">Agenda dos próximos dias</h2><Link href="/agenda" className="dxCardLink">Abrir agenda</Link></div>
      {loading && !overview ? <LoadingRows /> : !available ? <div className="dxEmpty"><strong>Agenda indisponível</strong><p>Tente atualizar os dados acima.</p></div> : <div className={styles.week}>
        {days.map(({ date, active, cancelled }, index) => <Link key={toIsoDate(date)} href={"/agenda?data=" + toIsoDate(date)} className={styles.weekDay} aria-label={date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) + ": " + active + " consultas, " + cancelled + " canceladas"}>
          <span className={styles.weekDate}>{index === 0 ? "Hoje" : date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}<span>{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span></span>
          <strong>{active}</strong><span className={styles.weekCount}>{active === 1 ? "consulta" : "consultas"}</span>
          {cancelled > 0 && <span className={styles.weekCancelled}>{cancelled} {cancelled === 1 ? "cancelada" : "canceladas"}</span>}
        </Link>)}
      </div>}
    </section>
  </div>;
}
