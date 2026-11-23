"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type Tab = "sem" | "com";

const SEM_ROWS = [
  {
    problem: { icon: "calendar", text: "Confirmar consultas manualmente" },
    cause:   { icon: "phone",    text: "Ligações e mensagens sem fim" },
    result:  { icon: "bell",     text: "Lembrete automático" },
  },
  {
    problem: { icon: "grid",     text: "Agenda espalhada em vários lugares" },
    cause:   { icon: "device",   text: "Planilha, WhatsApp e caderno" },
    result:  { icon: "calcheck", text: "Agenda centralizada" },
  },
  {
    problem: { icon: "user",     text: "Paciente esquece e não comparece" },
    cause:   { icon: "chair",    text: "Cadeira vazia" },
    result:  { icon: "card",     text: "Pix na marcação" },
  },
  {
    problem: { icon: "clock",    text: "Recepção perde tempo cobrando" },
    cause:   { icon: "money",    text: "Cobrança depois do atendimento" },
    result:  { icon: "team",     text: "Equipe com visão em tempo real" },
  },
];

const COM_ROWS = [
  {
    from: { icon: "card",     text: "Paciente paga o sinal na marcação" },
    to:   { icon: "check",    text: "Compromisso confirmado antes da consulta" },
  },
  {
    from: { icon: "bell",     text: "Lembrete automático 24h antes" },
    to:   { icon: "user",     text: "Paciente confirma com um toque" },
  },
  {
    from: { icon: "calcheck", text: "Agenda centralizada em uma tela" },
    to:   { icon: "team",     text: "Equipe sempre alinhada, sem ruído" },
  },
];

function Icon({ name, blue }: { name: string; blue?: boolean }) {
  const s = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    calendar: <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    phone:    <svg viewBox="0 0 24 24" {...s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.72 2.81a2 2 0 0 1-.45 2.11L9.1 10.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.91.36 1.85.6 2.81.72A2 2 0 0 1 22 16.92z"/></svg>,
    bell:     <svg viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    grid:     <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
    device:   <svg viewBox="0 0 24 24" {...s}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    calcheck: <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
    user:     <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
    chair:    <svg viewBox="0 0 24 24" {...s}><path d="M6 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2"/><path d="M4 10h16v2H4z"/><line x1="8" y1="22" x2="8" y2="12"/><line x1="16" y1="22" x2="16" y2="12"/></svg>,
    card:     <svg viewBox="0 0 24 24" {...s}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    clock:    <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    money:    <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4H15"/></svg>,
    team:     <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    check:    <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return (
    <span className={`cmpIcon${blue ? " cmpIconBlue" : ""}`}>
      {icons[name]}
    </span>
  );
}

function Mockup() {
  return (
    <div className="cmpMockupCard">
      <div className="cmpMockupCardHeader">
        <Icon name="team" blue />
        <div>
          <strong>Rotina previsível</strong>
          <small>Um consultório mais organizado,<br />lucrativo e com menos faltas.</small>
        </div>
      </div>
      <div className="cmpMockupUI">
        <div className="cmpMockupUIBar">
          <span className="cmpMockupUILogo">Reserve Clinic</span>
          <div className="cmpMockupUIRight">
            <span>Consultas de hoje</span>
            <span className="cmpMockupUIDate">Hoje, 14 de março ↓</span>
          </div>
        </div>
        <div className="cmpMockupUICols">
          <div className="cmpMockupUISidebar">
            {["Agenda","Pacientes","Financeiro","Relatórios","Configurações"].map(l => (
              <div key={l} className="cmpMockupUISideItem">{l}</div>
            ))}
          </div>
          <div className="cmpMockupUIList">
            {[
              { time:"08:00", name:"Ana Souza",    status:"Confirmado",  green:true  },
              { time:"09:00", name:"Carlos Lima",   status:"Confirmado",  green:true  },
              { time:"10:00", name:"Marina Costa",  status:"Pago (Pix)",  green:false },
              { time:"11:00", name:"João Pereira",  status:"Confirmado",  green:true  },
            ].map(r => (
              <div key={r.time} className="cmpMockupUIRow">
                <span className="cmpMockupUITime">{r.time}</span>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <span className="cmpMockupUIName">{r.name}</span>
                <span className={`cmpMockupUIStatus${r.green ? " green" : " pix"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="cmpMockupUIFooter">
          <div className="cmpMockupUIFooterItem">
            <span className="cmpMockupUIFooterIcon cmpMockupUIFooterIconGreen">↓</span>
            <span>Menos faltas</span>
          </div>
          <div className="cmpMockupUIFooterItem">
            <span className="cmpMockupUIFooterIcon cmpMockupUIFooterIconBlue">↑</span>
            <span>Mais controle</span>
          </div>
          <div className="cmpMockupUIFooterItem">
            <span className="cmpMockupUIFooterIcon cmpMockupUIFooterIconTeal">$</span>
            <span>Receita organizada</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingComparison() {
  const [tab, setTab] = useState<Tab>("sem");

  return (
    <section className="cmpSection" id="resultado">
      {/* header */}
      <div className="cmpHeader">
        <span className="cmpEyebrow">ROTINA DA CLÍNICA</span>
        <h2 className="cmpHeadline">O que muda quando o sinal<br />é cobrado antes</h2>
        <p className="cmpSubtitle">Compare a rotina do consultório antes e depois de cobrar o sinal na marcação.</p>

        {/* toggle */}
        <div className="cmpToggle" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "sem"}
            className={`cmpToggleBtn${tab === "sem" ? " active" : ""}`}
            onClick={() => setTab("sem")}
          >
            Sem o Reserve Clinic
          </button>
          <button
            role="tab"
            aria-selected={tab === "com"}
            className={`cmpToggleBtn${tab === "com" ? " active" : ""}`}
            onClick={() => setTab("com")}
          >
            Com o Reserve Clinic
          </button>
        </div>
      </div>

      {/* conteúdo SEM */}
      {tab === "sem" && (
        <div className="cmpBody cmpBodySem">
          <div className="cmpFlowArea">
            {SEM_ROWS.map((row, i) => (
              <div className="cmpFlowRow" key={i}>
                <div className="cmpFlowCard">
                  <Icon name={row.problem.icon} />
                  <span>{row.problem.text}</span>
                </div>
                <ArrowRight size={16} className="cmpFlowArrow" />
                <div className="cmpFlowCard">
                  <Icon name={row.cause.icon} />
                  <span>{row.cause.text}</span>
                </div>
                <ArrowRight size={16} className="cmpFlowArrow" />
                <div className="cmpFlowCard cmpFlowCardBlue">
                  <Icon name={row.result.icon} blue />
                  <span>{row.result.text}</span>
                </div>
                <ArrowRight size={16} className="cmpFlowArrowRight" />
              </div>
            ))}
          </div>
          <Mockup />
        </div>
      )}

      {/* conteúdo COM */}
      {tab === "com" && (
        <div className="cmpBody cmpBodyCom">
          <div className="cmpFlowArea cmpFlowAreaCom">
            {COM_ROWS.map((row, i) => (
              <div className="cmpFlowRow cmpFlowRowCom" key={i}>
                <div className="cmpFlowCard cmpFlowCardBlue">
                  <Icon name={row.from.icon} blue />
                  <span>{row.from.text}</span>
                </div>
                <ArrowRight size={16} className="cmpFlowArrow" />
                <div className="cmpFlowCard cmpFlowCardResult">
                  <span className="cmpFlowCheck"><Check size={13} /></span>
                  <span>{row.to.text}</span>
                </div>
              </div>
            ))}
          </div>
          <Mockup />
        </div>
      )}
    </section>
  );
}
