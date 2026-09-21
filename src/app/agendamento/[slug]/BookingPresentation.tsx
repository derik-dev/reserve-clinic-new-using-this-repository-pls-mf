import { CalendarDays, Check, Clock3, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import styles from "./booking.module.css";

export type BookingAppearance = "clean" | "premium";

export function BookingAvatar({ name, photo }: { name: string; photo: string | null }) {
  return <span className={styles.avatar} aria-hidden="true">
    {photo ? <img src={photo} alt="" /> : name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}
  </span>;
}

export function BookingSteps({ current }: { current: number }) {
  return <ol className={styles.steps} aria-label="Etapas do agendamento">
    {["Data e horário", "Seus dados", "Confirmação"].map((label, index) => <li key={label} data-state={index === current ? "active" : index < current ? "done" : "upcoming"} aria-current={index === current ? "step" : undefined}>
      <span className={styles.stepNumber}>{index < current ? <Check size={18} aria-label="Concluída" /> : index + 1}</span>
      <strong>{label}</strong>
    </li>)}
  </ol>;
}

export function BookingClinicSummary({ name, photo, address, price, professional, date, time, duration }: {
  name: string; photo: string | null; address: string; price: number | null;
  professional: { nome: string; especialidade: string | null; foto_url: string | null } | null;
  date: string; time: string; duration: number;
}) {
  return <aside className={styles.clinicSummary} aria-label="Clínica e resumo do agendamento">
    <div className={styles.clinicIdentity}>
      <div className={styles.clinicLogo}>{photo ? <img src={photo} alt="" /> : <Stethoscope size={30} />}</div>
      <div className={styles.clinicName}><span className={styles.eyebrow}>Agendamento online</span><h1>{name}</h1>
        {address && <p className={styles.address}><MapPin size={18} aria-hidden="true" /><span>{address}</span></p>}
      </div>
      {price != null && <div className={styles.price}><span>Valor da consulta</span><strong>{price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>}
    </div>
    <div className={styles.summaryDetails}>
      <h2>Seu agendamento</h2>
      {professional && <div className={styles.summaryProfessional}><BookingAvatar name={professional.nome} photo={professional.foto_url} /><div><strong>{professional.nome}</strong>{professional.especialidade && <span>{professional.especialidade}</span>}</div></div>}
      <dl>
        <div><dt><CalendarDays size={18} /> Data</dt><dd>{date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" }) : "A escolher"}</dd></div>
        <div><dt><Clock3 size={18} /> Horário</dt><dd>{time || "A escolher"}</dd></div>
        <div><dt>Duração</dt><dd>{duration} minutos</dd></div>
      </dl>
      <p className={styles.summarySafety}><ShieldCheck size={20} /><span>Agende com tranquilidade.<br />Seus dados estão protegidos.</span></p>
    </div>
  </aside>;
}

export function BookingComparison({ appearance, onChange }: { appearance: BookingAppearance; onChange: (value: BookingAppearance) => void }) {
  return <div className={styles.comparison} role="group" aria-label="Comparar propostas de agendamento">
    <span>Propostas visuais</span>
    <div>{([ ["clean", "1. Clean"], ["premium", "2. Premium"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={appearance === value} onClick={() => onChange(value)}>{label}</button>)}</div>
  </div>;
}
