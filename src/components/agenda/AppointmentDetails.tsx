"use client";

import { useEffect, useRef } from "react";
import { Clock, Banknote, Stethoscope, User, X } from "lucide-react";
import { STATUS_CLASS, STATUS_LABEL, type Consulta } from "@/lib/db";
import { capitalize, consultaDuration, formatTime } from "@/lib/agenda";

type Props = {
  consulta: Consulta;
  onClose: () => void;
  onEdit: () => void;
};

/**
 * Detalhes da consulta. Mantém o fluxo existente (visualizar e editar): a edição
 * continua na página de consultas.
 */
export function AppointmentDetails({ consulta, onClose, onEdit }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dt = new Date(consulta.data_hora);
  const end = new Date(dt.getTime() + consultaDuration(consulta) * 60000);

  useEffect(() => { closeRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="agxDetails" role="dialog" aria-modal="true" aria-labelledby="agx-details-title" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2 id="agx-details-title">{consulta.paciente_nome}</h2>
            <p>{capitalize(dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</p>
          </div>
          <button ref={closeRef} className="agxIconBtn" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>
        <dl>
          <div><dt><Clock size={16} /> Horário</dt><dd>{formatTime(dt)} – {formatTime(end)} <span className="agxMuted">({consultaDuration(consulta)} min)</span></dd></div>
          <div><dt><span className="agxStatusDot" /> Status</dt><dd><span className={`statusBadge ${STATUS_CLASS[consulta.status]}`}>{STATUS_LABEL[consulta.status]}</span></dd></div>
          {consulta.profissional && <div><dt><User size={16} /> Profissional</dt><dd>{consulta.profissional}</dd></div>}
          {consulta.servico && <div><dt><Stethoscope size={16} /> Serviço</dt><dd>{consulta.servico}</dd></div>}
          {consulta.valor != null && <div><dt><Banknote size={16} /> Valor</dt><dd>{`R$ ${Number(consulta.valor).toFixed(2).replace(".", ",")}`}</dd></div>}
        </dl>
        <footer>
          <button className="secondaryButton" onClick={onClose}>Fechar</button>
          <button className="primaryButton" onClick={onEdit}>Editar consulta</button>
        </footer>
      </div>
    </div>
  );
}
