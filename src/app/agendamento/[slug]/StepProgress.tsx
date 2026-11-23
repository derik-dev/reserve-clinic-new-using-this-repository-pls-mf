import { Check } from "lucide-react";
import styles from "./booking.module.css";

type Props = {
  labels: string[];
  current: number;
  /** Quando true, os passos já feitos não podem ser reabertos (ex.: depois de gerar o Pix). */
  locked: boolean;
  onGo: (index: number) => void;
};

export function StepProgress({ labels, current, locked, onGo }: Props) {
  return (
    <ol className={styles.progress} aria-label="Etapas do agendamento">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !locked;
        return (
          <li key={label} className={`${styles.progressItem}${done ? ` ${styles.isDone}` : ""}${active ? ` ${styles.isActive}` : ""}`} aria-current={active ? "step" : undefined}>
            <button type="button" className={styles.progressDot} disabled={!clickable} onClick={() => onGo(i)} aria-label={`${label}${done ? " (concluído)" : ""}`}>
              {done ? <Check size={14} aria-hidden="true" /> : i + 1}
            </button>
            <span className={styles.progressLabel}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
