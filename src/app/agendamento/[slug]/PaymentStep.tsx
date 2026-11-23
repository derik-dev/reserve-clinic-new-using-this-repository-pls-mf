"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { isValidCpf, isValidEmail, maskCpf, maskPhone, digits } from "@/lib/booking";
import type { Patient, ProfissionalPublic } from "./types";
import styles from "./booking.module.css";

type Props = {
  profissional: ProfissionalPublic | null;
  /** "qui., 12 de nov" */
  dayLabel: string;
  faixa: string;
  /** Valor da consulta; sem valor, não há cobrança online. */
  valor: number | null;
  patient: Patient;
  onChange: (patient: Patient) => void;
  submitting: boolean;
  /** Erro vindo do servidor ao reservar o horário. */
  serverError: string;
  onSubmit: () => void;
};

type Errors = Partial<Record<keyof Patient, string>>;

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PaymentStep({ profissional, dayLabel, faixa, valor, patient, onChange, submitting, serverError, onSubmit }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const pay = valor != null && valor > 0;

  function validate(): Errors {
    const e: Errors = {};
    if (patient.nome.trim().split(/\s+/).filter(Boolean).length < 2) e.nome = "Digite seu nome completo.";
    if (pay) {
      if (!isValidEmail(patient.email)) e.email = "Digite um e-mail válido.";
      if (!isValidCpf(patient.cpf)) e.cpf = "CPF inválido. Confira os números.";
    } else if (patient.email.trim() && !isValidEmail(patient.email)) e.email = "Digite um e-mail válido.";
    if (patient.telefone.trim() && digits(patient.telefone).length < 10) e.telefone = "Inclua o DDD.";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onSubmit();
  }

  const set = (k: keyof Patient, v: string) => { onChange({ ...patient, [k]: v }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };

  return (
    <form onSubmit={submit} noValidate>
      <h2 className={styles.title}>{pay ? "Seus dados e pagamento" : "Seus dados"}</h2>

      <div className={styles.summary}>
        <CalendarDays size={18} aria-hidden="true" />
        <span>{profissional ? `${profissional.nome} · ` : ""}{dayLabel} · {faixa}</span>
        {pay && <strong>{money(valor)}</strong>}
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Nome completo</span>
          <input value={patient.nome} onChange={e => set("nome", e.target.value)} autoComplete="name" aria-invalid={!!errors.nome} aria-describedby={errors.nome ? "err-nome" : undefined} />
          {errors.nome && <small id="err-nome" className={styles.fieldError} role="alert">{errors.nome}</small>}
        </label>

        <label className={styles.field}>
          <span>E-mail{!pay && " (opcional)"}</span>
          <input type="email" inputMode="email" value={patient.email} onChange={e => set("email", e.target.value)} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "err-email" : undefined} />
          {errors.email && <small id="err-email" className={styles.fieldError} role="alert">{errors.email}</small>}
        </label>

        <div className={styles.fieldRow}>
          {pay && (
            <label className={styles.field}>
              <span>CPF</span>
              <input value={patient.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" autoComplete="off" aria-invalid={!!errors.cpf} aria-describedby={errors.cpf ? "err-cpf" : undefined} />
              {errors.cpf && <small id="err-cpf" className={styles.fieldError} role="alert">{errors.cpf}</small>}
            </label>
          )}
          <label className={styles.field}>
            <span>WhatsApp{pay ? " (opcional)" : ""}</span>
            <input type="tel" value={patient.telefone} onChange={e => set("telefone", maskPhone(e.target.value))} inputMode="tel" placeholder="(00) 00000-0000" autoComplete="tel" aria-invalid={!!errors.telefone} aria-describedby={errors.telefone ? "err-tel" : undefined} />
            {errors.telefone && <small id="err-tel" className={styles.fieldError} role="alert">{errors.telefone}</small>}
          </label>
        </div>
      </div>

      {serverError && <p className={styles.errorBox} role="alert">{serverError}</p>}

      <button type="submit" className={styles.primaryBtn} disabled={submitting}>
        {submitting ? "Reservando seu horário…" : pay ? `Pagar ${money(valor)} com Pix` : "Confirmar agendamento"}
      </button>
    </form>
  );
}
