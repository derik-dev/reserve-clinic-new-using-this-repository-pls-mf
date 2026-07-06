"use client";

import { ChevronLeft, ChevronRight, Plus, Settings, X, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { initials, type Consulta } from "@/lib/db";

type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DayConfig = { aberto: boolean; inicio: string; fim: string };
type Profissional = { id: string; nome: string; dias: DayKey[] };
type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  profissionais: Profissional[];
  duracao_min: number;
};

const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DAY_LABEL: Record<DayKey, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };
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
};

const EVENT_COLORS = ["blue", "mint", "purple", "amber"] as const;

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
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
  };
}

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [profFiltro, setProfFiltro] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;
      const { data } = await supabase.from("configuracoes").select("agenda_config").eq("perfil_id", session.user.id).maybeSingle();
      setConfig(mergeConfig(data?.agenda_config));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = new Date(weekStart);
      const to = addDays(weekStart, 7);
      const { data } = await supabase.from("consultas").select("*").gte("data_hora", from.toISOString()).lt("data_hora", to.toISOString()).order("data_hora");
      setConsultas((data as Consulta[] | null) ?? []);
      setLoading(false);
    })();
  }, [weekStart]);

  const diasVisiveis = useMemo(() => {
    const semana = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(d => ({ date: d, key: jsDayToKey(d) }));
    const diasComConsulta = new Set(consultas.map(c => toIsoDate(new Date(c.data_hora))));
    return semana.map(d => ({ ...d, aberto: config.dias[d.key].aberto, feriado: config.feriados.includes(toIsoDate(d.date)) })).filter(d => d.aberto || diasComConsulta.has(toIsoDate(d.date)));
  }, [weekStart, config, consultas]);
  const diasAbertos = useMemo(() => diasVisiveis.filter(d => d.aberto), [diasVisiveis]);

  const [minAbertura, maxFechamento] = useMemo(() => {
    if (diasAbertos.length === 0) return [8 * 60, 18 * 60];
    const inicios = diasAbertos.map(d => timeToMin(config.dias[d.key].inicio));
    const fins = diasAbertos.map(d => timeToMin(config.dias[d.key].fim));
    return [Math.min(...inicios), Math.max(...fins)];
  }, [diasAbertos, config]);

  const linhasHora = useMemo(() => {
    const arr: number[] = [];
    for (let m = Math.floor(minAbertura / 60) * 60; m < maxFechamento; m += 60) arr.push(m);
    return arr;
  }, [minAbertura, maxFechamento]);

  const consultasFiltradas = useMemo(() => {
    if (profFiltro === "todos") return consultas;
    if (profFiltro === "sem") return consultas.filter(c => !c.profissional);
    return consultas.filter(c => c.profissional === profFiltro);
  }, [consultas, profFiltro]);

  const rotuloSemana = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt(weekStart)} — ${fmt(addDays(weekStart, 6))}`;
  }, [weekStart]);

  const HOUR_PX = 62;
  const gridColumns = `88px repeat(${diasVisiveis.length}, minmax(120px, 1fr))`;

  return <>
    <PageHeader title="Agenda" description="Sua semana em um só lugar." actions={<>
      {config.profissionais.length > 0 && (
        <div className="agendaFilter">
          <label>Profissional</label>
          <select value={profFiltro} onChange={(e) => setProfFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            {config.profissionais.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
            <option value="sem">Sem profissional</option>
          </select>
        </div>
      )}
      <button className="secondaryButton" onClick={() => setConfigOpen(true)}><Settings size={16} /> Ajustes</button>
      <button className="primaryButton" onClick={() => (window.location.href = "/consultas")}><Plus size={17} /> Nova consulta</button>
    </>} />

    <div className="agendaToolbar">
      <button className="iconButton" aria-label="Semana anterior" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={17} /></button>
      <button className="iconButton" aria-label="Próxima semana" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={17} /></button>
      <button className="todayButton" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button>
      <strong>{rotuloSemana}</strong>
    </div>

    {diasVisiveis.length === 0 ? (
      <div className="agendaEmpty">Nenhum dia de funcionamento configurado. <button className="linkButton" onClick={() => setConfigOpen(true)}>Ajustar horários</button></div>
    ) : (
      <section className="panel agendaGridPanel">
        <div className="agendaGridScroll">
          <div className="agendaGridHeader" style={{ gridTemplateColumns: gridColumns }}>
            <span />
            {diasVisiveis.map(({ date, key, aberto, feriado }) => {
              const ehHoje = isSameDay(date, today);
              return (
                <div key={key + date.toISOString()} className={`agendaDayHead ${ehHoje ? "isToday" : ""} ${feriado ? "isHoliday" : ""} ${!aberto ? "isClosed" : ""}`}>
                  <span>{DAY_LABEL[key]}</span>
                  <strong>{String(date.getDate()).padStart(2, "0")}</strong>
                  {feriado ? <em>Feriado</em> : !aberto ? <em className="closedTag">Fechado</em> : null}
                </div>
              );
            })}
          </div>
          <div className="agendaGridBody" style={{ gridTemplateColumns: gridColumns, height: linhasHora.length * HOUR_PX }}>
            <div className="agendaHourCol">
              {linhasHora.map(m => <span key={m} style={{ height: HOUR_PX }}>{minToLabel(m)}</span>)}
            </div>
            {diasVisiveis.map(({ date, key, aberto, feriado }) => {
              const dayConfig = config.dias[key];
              const inicioMin = aberto ? timeToMin(dayConfig.inicio) : 0;
              const fimMin = aberto ? timeToMin(dayConfig.fim) : 0;
              const baseMin = Math.floor(minAbertura / 60) * 60;
              const offsetTopFechado = aberto ? ((inicioMin - baseMin) / 60) * HOUR_PX : 0;
              const bottomFechado = aberto ? ((baseMin + linhasHora.length * 60 - fimMin) / 60) * HOUR_PX : 0;
              const eventos = consultasFiltradas.filter(c => isSameDay(new Date(c.data_hora), date));
              return (
                <div key={key + date.toISOString()} className={`agendaDayCol ${feriado ? "isHoliday" : ""} ${!aberto ? "isClosedDay" : ""}`}>
                  {!aberto && <div className="agendaClosed" style={{ top: 0, bottom: 0 }} />}
                  {aberto && offsetTopFechado > 0 && <div className="agendaClosed" style={{ top: 0, height: offsetTopFechado }} />}
                  {aberto && bottomFechado > 0 && <div className="agendaClosed" style={{ bottom: 0, height: bottomFechado }} />}
                  {eventos.map((c, idx) => {
                    const dt = new Date(c.data_hora);
                    const minutosDoDia = dt.getHours() * 60 + dt.getMinutes();
                    const top = ((minutosDoDia - Math.floor(minAbertura / 60) * 60) / 60) * HOUR_PX;
                    const height = Math.max(30, (c.duracao_min / 60) * HOUR_PX - 4);
                    const cor = EVENT_COLORS[idx % EVENT_COLORS.length];
                    return (
                      <div key={c.id} className={`agendaEvent ${cor}`} style={{ top, height }} title={`${c.paciente_nome}${c.servico ? " · " + c.servico : ""}`}>
                        <div className="agendaEventAvatar">{initials(c.paciente_nome)}</div>
                        <div>
                          <strong>{c.paciente_nome}</strong>
                          <span>{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{c.servico ? ` · ${c.servico}` : ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {loading && <p className="agendaLoading">Carregando…</p>}
      </section>
    )}

    {configOpen && <AjustesModal config={config} onClose={() => setConfigOpen(false)} onSaved={(c) => { setConfig(c); setConfigOpen(false); }} />}
  </>;
}

function AjustesModal({ config, onClose, onSaved }: { config: AgendaConfig; onClose: () => void; onSaved: (c: AgendaConfig) => void }) {
  const [local, setLocal] = useState<AgendaConfig>(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"horarios" | "feriados" | "profissionais">("horarios");
  const [novoFeriado, setNovoFeriado] = useState("");
  const [novoProfNome, setNovoProfNome] = useState("");

  function updateDia(key: DayKey, patch: Partial<DayConfig>) {
    setLocal({ ...local, dias: { ...local.dias, [key]: { ...local.dias[key], ...patch } } });
  }
  function addFeriado() {
    if (!novoFeriado) return;
    if (local.feriados.includes(novoFeriado)) return;
    setLocal({ ...local, feriados: [...local.feriados, novoFeriado].sort() });
    setNovoFeriado("");
  }
  function removeFeriado(f: string) {
    setLocal({ ...local, feriados: local.feriados.filter(x => x !== f) });
  }
  function addProfissional() {
    if (!novoProfNome.trim()) return;
    const novo: Profissional = { id: crypto.randomUUID(), nome: novoProfNome.trim(), dias: (Object.keys(local.dias) as DayKey[]).filter(k => local.dias[k].aberto) };
    setLocal({ ...local, profissionais: [...local.profissionais, novo] });
    setNovoProfNome("");
  }
  function removeProfissional(id: string) {
    setLocal({ ...local, profissionais: local.profissionais.filter(p => p.id !== id) });
  }
  function toggleProfDia(id: string, dia: DayKey) {
    setLocal({
      ...local,
      profissionais: local.profissionais.map(p => p.id !== id ? p : { ...p, dias: p.dias.includes(dia) ? p.dias.filter(d => d !== dia) : [...p.dias, dia] }),
    });
  }
  function updateProfNome(id: string, nome: string) {
    setLocal({ ...local, profissionais: local.profissionais.map(p => p.id !== id ? p : { ...p, nome }) });
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

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard modalLg" onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <h2>Ajustes da agenda</h2>
          <button className="iconButton" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </header>
        <div className="tabsRow">
          <button className={tab === "horarios" ? "active" : ""} onClick={() => setTab("horarios")}>Horários</button>
          <button className={tab === "feriados" ? "active" : ""} onClick={() => setTab("feriados")}>Feriados</button>
          <button className={tab === "profissionais" ? "active" : ""} onClick={() => setTab("profissionais")}>Profissionais</button>
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
              <p className="ajustesHint">Marque os dias em que a clínica atende e defina os horários.</p>
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
              <p className="ajustesHint">Dias em que a clínica não atende (mesmo caindo em dia útil).</p>
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
            <>
              <p className="ajustesHint">Cadastre profissionais e marque em quais dias cada um atende.</p>
              <div className="ajustesAddRow">
                <input value={novoProfNome} onChange={(e) => setNovoProfNome(e.target.value)} placeholder="Nome do profissional" onKeyDown={(e) => { if (e.key === "Enter") addProfissional(); }} />
                <button className="secondaryButton" onClick={addProfissional} disabled={!novoProfNome.trim()}><Plus size={15} /> Adicionar</button>
              </div>
              {local.profissionais.length === 0 ? (
                <p className="ajustesEmpty">Nenhum profissional cadastrado.</p>
              ) : (
                <ul className="ajustesLista">
                  {local.profissionais.map(p => (
                    <li key={p.id} className="ajustesProf">
                      <input value={p.nome} onChange={(e) => updateProfNome(p.id, e.target.value)} />
                      <div className="ajustesProfDias">
                        {DAY_ORDER.filter(k => local.dias[k].aberto).map(k => (
                          <button key={k} type="button" className={p.dias.includes(k) ? "active" : ""} onClick={() => toggleProfDia(p.id, k)}>{DAY_LABEL[k]}</button>
                        ))}
                      </div>
                      <button className="iconButton" onClick={() => removeProfissional(p.id)} aria-label="Remover"><Trash2 size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </>
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
