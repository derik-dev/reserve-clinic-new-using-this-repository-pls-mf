"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Settings, Users, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { initials, STATUS_CLASS, STATUS_LABEL, type Consulta, type ConsultaStatus } from "@/lib/db";

type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DayConfig = { aberto: boolean; inicio: string; fim: string };
type ProfissionalJson = { id: string; nome: string; dias: DayKey[] };
type ProfissionalSql = { id: string; nome: string; especialidade: string | null };
type ProfDisponibilidade = { dias: Record<DayKey, DayConfig>; feriados: string[] };
type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  profissionais: ProfissionalJson[];
  duracao_min: number;
  disponibilidade: Record<string, ProfDisponibilidade>;
};

const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DAY_LABEL_FULL: Record<DayKey, string> = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };

const DEFAULT_CONFIG: AgendaConfig = {
  dias: {
    seg: { aberto: true, inicio: "08:00", fim: "18:00" },
    ter: { aberto: true, inicio: "08:00", fim: "18:00" },
    qua: { aberto: true, inicio: "08:00", fim: "18:00" },
    qui: { aberto: true, inicio: "08:00", fim: "18:00" },
    sex: { aberto: true, inicio: "08:00", fim: "18:00" },
    sab: { aberto: false, inicio: "08:00", fim: "13:00" },
    dom: { aberto: false, inicio: "08:00", fim: "13:00" },
  },
  feriados: [],
  profissionais: [],
  duracao_min: 60,
  disponibilidade: {},
};

const STATUS_TO_COLOR: Record<ConsultaStatus, string> = {
  confirmada: "blue",
  aguardando: "amber",
  concluida: "mint",
  cancelada: "gray",
};

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function toIsoDate(d: Date) { return d.toISOString().slice(0, 10); }
function jsDayToKey(d: Date): DayKey { return DAY_ORDER[(d.getDay() + 6) % 7]; }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToLabel(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }

function mergeConfig(raw: unknown): AgendaConfig {
  const r = (raw ?? {}) as Partial<AgendaConfig>;
  return {
    dias: { ...DEFAULT_CONFIG.dias, ...(r.dias ?? {}) },
    feriados: Array.isArray(r.feriados) ? r.feriados : [],
    profissionais: Array.isArray(r.profissionais) ? r.profissionais : [],
    duracao_min: typeof r.duracao_min === "number" && r.duracao_min > 0 ? r.duracao_min : DEFAULT_CONFIG.duracao_min,
    disponibilidade: (r.disponibilidade && typeof r.disponibilidade === "object") ? r.disponibilidade as Record<string, ProfDisponibilidade> : {},
  };
}

function getProfDisp(config: AgendaConfig, profId: string | null): { dias: Record<DayKey, DayConfig>; feriados: string[] } {
  if (!profId || !config.disponibilidade[profId]) return { dias: config.dias, feriados: [] };
  return { dias: { ...config.dias, ...config.disponibilidade[profId].dias }, feriados: config.disponibilidade[profId].feriados };
}

function isFeriado(config: AgendaConfig, profId: string | null, isoDate: string): boolean {
  return config.feriados.includes(isoDate) || (profId ? (config.disponibilidade[profId]?.feriados ?? []).includes(isoDate) : false);
}

function slotsLivresDia(config: AgendaConfig, profDisp: { dias: Record<DayKey, DayConfig> }, diaKey: DayKey, consultasDoDia: Consulta[]): string[] {
  const dc = profDisp.dias[diaKey];
  if (!dc.aberto) return [];
  const dur = config.duracao_min;
  const inicio = timeToMin(dc.inicio);
  const fim = timeToMin(dc.fim);
  const ocupados = new Set(consultasDoDia.map(c => { const dt = new Date(c.data_hora); return dt.getHours() * 60 + dt.getMinutes(); }));
  const livres: string[] = [];
  for (let m = inicio; m + dur <= fim; m += dur) {
    if (!ocupados.has(m)) livres.push(minToLabel(m));
  }
  return livres;
}

export default function AgendaPage() {
  const router = useRouter();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [selectedDay, setSelectedDay] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [sqlProfissionais, setSqlProfissionais] = useState<ProfissionalSql[]>([]);
  const [profFiltro, setProfFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [fetchMonth, setFetchMonth] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;
      const [cfgRes, prRes] = await Promise.all([
        supabase.from("configuracoes").select("agenda_config").eq("perfil_id", session.user.id).maybeSingle(),
        supabase.from("profissionais").select("id, nome, especialidade").eq("ativo", true).order("nome"),
      ]);
      setConfig(mergeConfig(cfgRes.data?.agenda_config));
      setSqlProfissionais((prRes.data as ProfissionalSql[] | null) ?? []);
    })();
  }, []);

  useEffect(() => {
    const sm = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1);
    if (sm.getTime() !== fetchMonth.getTime()) setFetchMonth(sm);
  }, [selectedDay, fetchMonth]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const from = fetchMonth;
    const to = new Date(fetchMonth.getFullYear(), fetchMonth.getMonth() + 1, 0, 23, 59, 59);
    supabase.from("consultas").select("*")
      .gte("data_hora", from.toISOString())
      .lte("data_hora", to.toISOString())
      .order("data_hora")
      .then(({ data }) => {
        if (cancelled) return;
        setConsultas((data as Consulta[] | null) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchMonth]);

  const profAtivo = profFiltro !== "todos" && profFiltro !== "sem" ? profFiltro : null;
  const profDisp = useMemo(() => getProfDisp(config, profAtivo), [config, profAtivo]);

  const consultasFiltradas = useMemo(() => {
    if (profFiltro === "todos") return consultas;
    if (profFiltro === "sem") return consultas.filter(c => !c.profissional_id);
    return consultas.filter(c => c.profissional_id === profFiltro);
  }, [consultas, profFiltro]);

  const consultasDoDia = useMemo(() =>
    consultasFiltradas
      .filter(c => isSameDay(new Date(c.data_hora), selectedDay))
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()),
    [consultasFiltradas, selectedDay]
  );

  const consultasPorDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of consultasFiltradas) {
      const iso = toIsoDate(new Date(c.data_hora));
      m.set(iso, (m.get(iso) ?? 0) + 1);
    }
    return m;
  }, [consultasFiltradas]);

  const diaKey = jsDayToKey(selectedDay);
  const isFeriadoDia = isFeriado(config, profAtivo, toIsoDate(selectedDay));
  const diaCfg = profDisp.dias[diaKey];
  const diaFechado = !diaCfg.aberto || isFeriadoDia;
  const livres = useMemo(() => diaFechado ? [] : slotsLivresDia(config, profDisp, diaKey, consultasDoDia), [diaFechado, config, profDisp, diaKey, consultasDoDia]);
  const isToday = isSameDay(selectedDay, today);

  const calCells = useMemo(() => {
    const first = new Date(calMonth);
    const startPad = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(1 - startPad);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [calMonth]);

  function goDay(n: number) {
    const d = addDays(selectedDay, n);
    setSelectedDay(d);
    const m = new Date(d.getFullYear(), d.getMonth(), 1);
    if (m.getTime() !== calMonth.getTime()) setCalMonth(m);
  }

  const dateLabel = selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const dateLabelCapital = dateLabel[0].toUpperCase() + dateLabel.slice(1);

  return <>
    <PageHeader
      title="Agenda"
      description={dateLabelCapital}
      actions={<>
        <button className="secondaryButton" onClick={() => setConfigOpen(true)}><Settings size={16} /> Ajustes</button>
        <button className="primaryButton" onClick={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}`)}><Plus size={17} /> Nova consulta</button>
      </>}
    />

    {sqlProfissionais.length > 0 && (
      <div className="profFiltroBar">
        <button className={`profFiltroBtn${profFiltro === "todos" ? " active" : ""}`} onClick={() => setProfFiltro("todos")}><Users size={14} /> Todos</button>
        {sqlProfissionais.map(p => (
          <button key={p.id} className={`profFiltroBtn${profFiltro === p.id ? " active" : ""}`} onClick={() => setProfFiltro(p.id)}>{p.nome}</button>
        ))}
      </div>
    )}

    <div className="agendaV2">
      <aside className="agendaV2Side">
        <MiniCalendar
          month={calMonth}
          cells={calCells}
          today={today}
          selectedDay={selectedDay}
          consultasPorDia={consultasPorDia}
          onPrev={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); }}
          onNext={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); }}
          onPick={(d) => setSelectedDay(d)}
        />

        {livres.length > 0 && (
          <section className="agendaLivresPanel">
            <header>
              <strong>Horários livres</strong>
              <span>{livres.length} disponíveis</span>
            </header>
            <div className="agendaLivresGrid">
              {livres.map(h => (
                <button key={h} className="agendaLivreSlot" onClick={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}&hora=${h}`)}>
                  {h}
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>

      <div className="agendaV2Main">
        <div className="agendaDayNav">
          <button className="iconButton" onClick={() => goDay(-1)} aria-label="Dia anterior"><ChevronLeft size={18} /></button>
          <div className="agendaDayNavTitle">
            <strong>{dateLabelCapital}</strong>
            {isToday && <span className="agendaTodayBadge">Hoje</span>}
            {isFeriadoDia && <span className="agendaFeriadoBadge">Feriado</span>}
          </div>
          <button className="iconButton" onClick={() => goDay(1)} aria-label="Próximo dia"><ChevronRight size={18} /></button>
          {!isToday && (
            <button className="todayButton" onClick={() => { setSelectedDay(today); setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Hoje</button>
          )}
          {consultasDoDia.length > 0 && (
            <span className="agendaDayStat">{consultasDoDia.length} consulta{consultasDoDia.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <div className="agendaDayLoading"><span /></div>
        ) : diaFechado && consultasDoDia.length === 0 ? (
          <div className="agendaDayEmpty">
            <strong>{isFeriadoDia ? "Feriado" : "Sem atendimento"}</strong>
            <small>{isFeriadoDia ? "Este dia está bloqueado na agenda." : "Este dia não está configurado como dia de atendimento."}</small>
            <button className="linkButton" onClick={() => setConfigOpen(true)}>Ajustar horários</button>
          </div>
        ) : consultasDoDia.length === 0 ? (
          <div className="agendaDayEmpty">
            <strong>Nenhuma consulta agendada</strong>
            <small>O dia está vazio. Adicione a primeira consulta ou aguarde novos agendamentos pelo link público.</small>
            <button className="primaryButton" style={{ marginTop: 4 }} onClick={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}`)}><Plus size={15} /> Nova consulta</button>
          </div>
        ) : (
          <ul className="agendaDayList">
            {consultasDoDia.map(c => {
              const dt = new Date(c.data_hora);
              const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const cor = STATUS_TO_COLOR[c.status] ?? "blue";
              return (
                <li key={c.id} className={`agendaDayCard cor-${cor}`} onClick={() => setSelectedConsulta(c)}>
                  <div className="agendaDayCardTime">
                    <strong>{hora}</strong>
                    <small>{c.duracao_min} min</small>
                  </div>
                  <div className="agendaDayCardAvatar">{initials(c.paciente_nome)}</div>
                  <div className="agendaDayCardBody">
                    <strong>{c.paciente_nome}</strong>
                    <small>{c.servico ?? "Consulta"}{c.profissional ? ` · ${c.profissional}` : ""}</small>
                  </div>
                  <span className={`statusBadge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  <ChevronRight size={16} className="agendaDayCardArrow" />
                </li>
              );
            })}
          </ul>
        )}

        {consultasDoDia.length > 0 && !loading && (
          <button className="agendaDayAddBtn" onClick={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}`)}>
            <Plus size={15} /> Nova consulta neste dia
          </button>
        )}
      </div>
    </div>

    {configOpen && (
      <AjustesModal
        config={config}
        sqlProfissionais={sqlProfissionais}
        onClose={() => setConfigOpen(false)}
        onSaved={(c) => { setConfig(c); setConfigOpen(false); }}
      />
    )}
    {selectedConsulta && (
      <ConsultaPopup
        consulta={selectedConsulta}
        onClose={() => setSelectedConsulta(null)}
        onEdit={() => router.push(`/consultas?editar=${selectedConsulta.id}`)}
      />
    )}
  </>;
}

function MiniCalendar({ month, cells, today, selectedDay, consultasPorDia, onPrev, onNext, onPick }: {
  month: Date; cells: Date[]; today: Date; selectedDay: Date;
  consultasPorDia: Map<string, number>;
  onPrev: () => void; onNext: () => void; onPick: (d: Date) => void;
}) {
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return (
    <section className="sidePanel miniCalPanel">
      <header className="miniCalHeader">
        <button className="iconButton" aria-label="Mês anterior" onClick={onPrev}><ChevronLeft size={14} /></button>
        <b>{monthLabel[0].toUpperCase() + monthLabel.slice(1)}</b>
        <button className="iconButton" aria-label="Próximo mês" onClick={onNext}><ChevronRight size={14} /></button>
      </header>
      <div className="miniCalWeekdays">{["S", "T", "Q", "Q", "S", "S", "D"].map((w, i) => <span key={i}>{w}</span>)}</div>
      <div className="miniCalGrid">
        {cells.map((d) => {
          const iso = toIsoDate(d);
          const outside = d.getMonth() !== month.getMonth();
          const ehHoje = isSameDay(d, today);
          const selecionado = isSameDay(d, selectedDay);
          const count = consultasPorDia.get(iso) ?? 0;
          return (
            <button
              key={d.toISOString()}
              className={`miniCalCell ${outside ? "outside" : ""} ${ehHoje ? "today" : ""} ${selecionado ? "selected" : ""}`}
              onClick={() => onPick(d)}
            >
              {d.getDate()}
              {count > 0 && !outside && <span className="miniCalBadge">{count}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConsultaPopup({ consulta, onClose, onEdit }: { consulta: Consulta; onClose: () => void; onEdit: () => void }) {
  const dt = new Date(consulta.data_hora);
  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="dashUpcomingAvatar" style={{ width: 38, height: 38, fontSize: 12 }}>{initials(consulta.paciente_nome)}</div>
            <div>
              <h2 style={{ margin: 0 }}>{consulta.paciente_nome}</h2>
              <div style={{ marginTop: 6 }}>
                <span className={`statusBadge ${STATUS_CLASS[consulta.status]}`}>{STATUS_LABEL[consulta.status]}</span>
              </div>
            </div>
          </div>
          <button className="iconButton" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </header>
        <div className="modalBody">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <PopupField label="Data" value={data[0].toUpperCase() + data.slice(1)} />
            <PopupField label="Horário" value={`${hora} · ${consulta.duracao_min} min`} />
            {consulta.profissional && <PopupField label="Profissional" value={consulta.profissional} />}
            {consulta.servico && <PopupField label="Serviço" value={consulta.servico} />}
            {consulta.valor != null && (
              <PopupField label="Valor" value={`R$ ${Number(consulta.valor).toFixed(2).replace(".", ",")}`} />
            )}
          </div>
        </div>
        <footer className="modalFooter">
          <button className="secondaryButton" onClick={onClose}>Fechar</button>
          <button className="primaryButton" onClick={onEdit}>Editar consulta →</button>
        </footer>
      </div>
    </div>
  );
}

function PopupField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, letterSpacing: "-.005em" }}>{value}</span>
    </div>
  );
}

function AjustesModal({ config, sqlProfissionais, onClose, onSaved }: {
  config: AgendaConfig;
  sqlProfissionais: ProfissionalSql[];
  onClose: () => void;
  onSaved: (c: AgendaConfig) => void;
}) {
  const [local, setLocal] = useState<AgendaConfig>(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"horarios" | "feriados" | "profissionais">("horarios");
  const [novoFeriado, setNovoFeriado] = useState("");
  const [profSelecionado, setProfSelecionado] = useState<string | null>(sqlProfissionais[0]?.id ?? null);
  const [novoFeriadoProf, setNovoFeriadoProf] = useState("");

  function updateDia(key: DayKey, patch: Partial<DayConfig>) {
    setLocal({ ...local, dias: { ...local.dias, [key]: { ...local.dias[key], ...patch } } });
  }
  function addFeriado() {
    if (!novoFeriado || local.feriados.includes(novoFeriado)) return;
    setLocal({ ...local, feriados: [...local.feriados, novoFeriado].sort() });
    setNovoFeriado("");
  }
  function removeFeriado(f: string) {
    setLocal({ ...local, feriados: local.feriados.filter(x => x !== f) });
  }
  function getProfLocal(profId: string): ProfDisponibilidade {
    return local.disponibilidade[profId] ?? { dias: { ...local.dias }, feriados: [] };
  }
  function updateProfDia(profId: string, key: DayKey, patch: Partial<DayConfig>) {
    const prev = getProfLocal(profId);
    setLocal({ ...local, disponibilidade: { ...local.disponibilidade, [profId]: { ...prev, dias: { ...prev.dias, [key]: { ...prev.dias[key], ...patch } } } } });
  }
  function addFeriadoProf(profId: string) {
    if (!novoFeriadoProf) return;
    const prev = getProfLocal(profId);
    if (prev.feriados.includes(novoFeriadoProf)) return;
    setLocal({ ...local, disponibilidade: { ...local.disponibilidade, [profId]: { ...prev, feriados: [...prev.feriados, novoFeriadoProf].sort() } } });
    setNovoFeriadoProf("");
  }
  function removeFeriadoProf(profId: string, f: string) {
    const prev = getProfLocal(profId);
    setLocal({ ...local, disponibilidade: { ...local.disponibilidade, [profId]: { ...prev, feriados: prev.feriados.filter(x => x !== f) } } });
  }
  function resetProfDisp(profId: string) {
    const { [profId]: _, ...rest } = local.disponibilidade;
    setLocal({ ...local, disponibilidade: rest });
  }
  async function handleSave() {
    setError(null);
    setSaving(true);
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setSaving(false); return; }
    const { error: err } = await supabase.from("configuracoes").upsert({ perfil_id: session.user.id, agenda_config: local }, { onConflict: "perfil_id" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(local);
  }
  const profAtual = profSelecionado ? getProfLocal(profSelecionado) : null;
  const temCustom = profSelecionado ? !!local.disponibilidade[profSelecionado] : false;

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard modalLg" onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <h2>Ajustes da agenda</h2>
          <button className="iconButton" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </header>
        <div className="tabsRow">
          <button className={tab === "horarios" ? "active" : ""} onClick={() => setTab("horarios")}>Horários da clínica</button>
          <button className={tab === "feriados" ? "active" : ""} onClick={() => setTab("feriados")}>Feriados</button>
          <button className={tab === "profissionais" ? "active" : ""} onClick={() => setTab("profissionais")}>Por profissional</button>
        </div>
        <div className="modalBody">
          {tab === "horarios" && (
            <>
              <div className="ajustesDuracao">
                <div>
                  <strong>Duração de cada consulta</strong>
                  <small>Usada para gerar os horários no link público de agendamento.</small>
                </div>
                <div className="ajustesDuracaoInput">
                  <input type="number" min={5} step={5} value={local.duracao_min} onChange={(e) => setLocal({ ...local, duracao_min: Math.max(5, Number(e.target.value) || 60) })} />
                  <span>min</span>
                </div>
              </div>
              <p className="ajustesHint">Horários padrão da clínica — usados para profissionais sem configuração própria.</p>
              <div className="ajustesDias">
                {DAY_ORDER.map(k => {
                  const d = local.dias[k];
                  return (
                    <div className={`ajustesDia ${d.aberto ? "isOpen" : ""}`} key={k}>
                      <label className="ajustesSwitch">
                        <input type="checkbox" checked={d.aberto} onChange={(e) => updateDia(k, { aberto: e.target.checked })} />
                        <span>{DAY_LABEL_FULL[k]}</span>
                      </label>
                      <div className="ajustesHoras">
                        <input type="time" value={d.inicio} disabled={!d.aberto} onChange={(e) => updateDia(k, { inicio: e.target.value })} />
                        <em>até</em>
                        <input type="time" value={d.fim} disabled={!d.aberto} onChange={(e) => updateDia(k, { fim: e.target.value })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tab === "feriados" && (
            <>
              <p className="ajustesHint">Dias em que a clínica não atende (bloqueia todos os profissionais).</p>
              <div className="ajustesAddRow">
                <input type="date" value={novoFeriado} onChange={(e) => setNovoFeriado(e.target.value)} />
                <button className="secondaryButton" onClick={addFeriado} disabled={!novoFeriado}><Plus size={15} /> Adicionar</button>
              </div>
              {local.feriados.length === 0 ? (
                <p className="ajustesEmpty">Nenhum feriado cadastrado.</p>
              ) : (
                <ul className="ajustesLista">
                  {local.feriados.map(f => (
                    <li key={f}>
                      <span>{new Date(f + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                      <button className="iconButton" onClick={() => removeFeriado(f)} aria-label="Remover"><Trash2 size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {tab === "profissionais" && (
            sqlProfissionais.length === 0 ? (
              <p className="ajustesEmpty">Nenhum profissional ativo. Cadastre em <strong>Profissionais</strong>.</p>
            ) : (
              <>
                <p className="ajustesHint">Configure horários e folgas individuais.</p>
                <div className="ajustesProfSelect">
                  {sqlProfissionais.map(p => (
                    <button key={p.id} type="button" className={`ajustesProfTab${profSelecionado === p.id ? " active" : ""}${local.disponibilidade[p.id] ? " hasCustom" : ""}`} onClick={() => setProfSelecionado(p.id)}>
                      {p.nome}
                    </button>
                  ))}
                </div>
                {profSelecionado && profAtual && (
                  <div className="ajustesProfBody">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <small style={{ color: "var(--text-muted)" }}>
                        {temCustom ? "Horário personalizado ativo" : "Usando horários da clínica (padrão)"}
                      </small>
                      {temCustom && (
                        <button className="secondaryButton" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => resetProfDisp(profSelecionado)}>
                          Restaurar padrão
                        </button>
                      )}
                    </div>
                    <div className="ajustesDias">
                      {DAY_ORDER.map(k => {
                        const d = profAtual.dias[k];
                        return (
                          <div className={`ajustesDia ${d.aberto ? "isOpen" : ""}`} key={k}>
                            <label className="ajustesSwitch">
                              <input type="checkbox" checked={d.aberto} onChange={(e) => updateProfDia(profSelecionado, k, { aberto: e.target.checked })} />
                              <span>{DAY_LABEL_FULL[k]}</span>
                            </label>
                            <div className="ajustesHoras">
                              <input type="time" value={d.inicio} disabled={!d.aberto} onChange={(e) => updateProfDia(profSelecionado, k, { inicio: e.target.value })} />
                              <em>até</em>
                              <input type="time" value={d.fim} disabled={!d.aberto} onChange={(e) => updateProfDia(profSelecionado, k, { fim: e.target.value })} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="ajustesHint" style={{ marginTop: 16 }}>Folgas exclusivas deste profissional.</p>
                    <div className="ajustesAddRow">
                      <input type="date" value={novoFeriadoProf} onChange={(e) => setNovoFeriadoProf(e.target.value)} />
                      <button className="secondaryButton" onClick={() => addFeriadoProf(profSelecionado)} disabled={!novoFeriadoProf}><Plus size={15} /> Adicionar</button>
                    </div>
                    {profAtual.feriados.length === 0 ? (
                      <p className="ajustesEmpty">Nenhuma folga individual.</p>
                    ) : (
                      <ul className="ajustesLista">
                        {profAtual.feriados.map(f => (
                          <li key={f}>
                            <span>{new Date(f + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                            <button className="iconButton" onClick={() => removeFeriadoProf(profSelecionado, f)} aria-label="Remover"><Trash2 size={15} /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )
          )}
          {error && <div className="onboardingError">{error}</div>}
        </div>
        <footer className="modalFooter">
          <button className="secondaryButton" onClick={onClose}>Cancelar</button>
          <button className="primaryButton" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar ajustes"}</button>
        </footer>
      </div>
    </div>
  );
}
