"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { DAY_LABEL_FULL, DAY_ORDER, type AgendaConfig, type DayConfig, type DayKey, type ProfDisponibilidade, type ProfissionalSql } from "@/lib/agenda";

export function AgendaSettingsModal({ config, sqlProfissionais, onClose, onSaved }: {
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
    const rest = { ...local.disponibilidade };
    delete rest[profId];
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
