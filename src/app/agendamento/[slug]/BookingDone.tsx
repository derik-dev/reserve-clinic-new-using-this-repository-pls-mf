"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, CalendarDays, Check, Clock, MapPin, MessageCircle, Stethoscope, User, X } from "lucide-react";
import { capitalize } from "@/lib/agenda";
import { whatsappLink } from "@/lib/booking";
import { Avatar } from "./Avatar";
import type { PerfilPublic, ProfissionalPublic } from "./types";
import styles from "./booking.module.css";

export type DoneInfo = {
  perfil: PerfilPublic;
  profissional: ProfissionalPublic | null;
  data: string;
  /** "17:00 – 18:00" */
  faixa: string;
  paciente: string;
  valor: number | null;
  /** "confirmed": Pix pago. "pending": sem pagamento online, a clínica confirma. */
  kind: "confirmed" | "pending";
};

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function addressOf(p: PerfilPublic) {
  return [p.endereco_rua, p.endereco_numero, p.endereco_cidade, p.endereco_uf].filter(Boolean).join(", ");
}

/** Tela final: agendamento confirmado e botão para ver os detalhes. */
export function BookingDone({ info }: { info: DoneInfo }) {
  const [open, setOpen] = useState(false);
  const confirmed = info.kind === "confirmed";
  const day = new Date(`${info.data}T12:00:00`);

  return (
    <div className={styles.done}>
      <span className={styles.doneIcon} aria-hidden="true"><Check size={34} strokeWidth={2.4} /></span>
      <h2 className={styles.title} tabIndex={-1}>{confirmed ? "Agendamento confirmado" : "Solicitação enviada"}</h2>
      <p className={styles.doneLine}>
        {info.profissional ? `${info.profissional.nome} · ` : ""}{day.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(".", "")} · {info.faixa}
      </p>
      {!confirmed && <p className={styles.hint}>A clínica vai confirmar o seu horário em breve.</p>}
      <button type="button" className={styles.primaryBtn} onClick={() => setOpen(true)}>Ver detalhes do agendamento</button>
      {open && <DetailsModal info={info} onClose={() => setOpen(false)} />}
    </div>
  );
}

function DetailsModal({ info, onClose }: { info: DoneInfo; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const day = new Date(`${info.data}T12:00:00`);
  const confirmed = info.kind === "confirmed";
  const address = addressOf(info.perfil);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const whatsapp = whatsappLink(
    info.perfil.telefone,
    `Olá! Tenho uma dúvida sobre o meu agendamento${info.profissional ? ` com ${info.profissional.nome}` : ""} em ${day.toLocaleDateString("pt-BR")}, ${info.faixa}. (${info.paciente})`,
  );

  const rows = [
    info.profissional && { icon: User, label: "Profissional", value: info.profissional.nome, sub: info.profissional.especialidade },
    { icon: CalendarDays, label: "Data", value: capitalize(day.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })) },
    { icon: Clock, label: "Horário", value: info.faixa },
    address && { icon: MapPin, label: "Local", value: info.perfil.nome, sub: address },
    info.valor != null && info.valor > 0 && { icon: Banknote, label: confirmed ? "Valor pago" : "Valor", value: money(info.valor) },
    { icon: Stethoscope, label: "Paciente", value: info.paciente },
  ].filter(Boolean) as { icon: typeof User; label: string; value: string; sub?: string | null }[];

  // Portal: a etapa tem animação (transform) e overflow, que prenderiam um elemento fixo dentro do cartão.
  return createPortal(
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="booking-details-title" onClick={e => e.stopPropagation()}>
        <button ref={closeRef} type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        <header className={styles.modalHead}>
          <Avatar name={info.perfil.nome} photo={info.perfil.logo_url} size={48} />
          <div>
            <span className={styles.modalBadge}><Check size={13} aria-hidden="true" /> {confirmed ? "Confirmado" : "Aguardando confirmação"}</span>
            <h2 id="booking-details-title">Detalhes do agendamento</h2>
          </div>
        </header>
        <dl className={styles.detailList}>
          {rows.map(r => (
            <div key={r.label}>
              <dt><r.icon size={17} aria-hidden="true" /> {r.label}</dt>
              <dd>{r.value}{r.sub && <small>{r.sub}</small>}</dd>
            </div>
          ))}
        </dl>
        {whatsapp && (
          <div className={styles.modalFoot}>
            <p>Alguma dúvida? Fale com a clínica.</p>
            <a className={styles.whatsBtn} href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> Chamar no WhatsApp</a>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
