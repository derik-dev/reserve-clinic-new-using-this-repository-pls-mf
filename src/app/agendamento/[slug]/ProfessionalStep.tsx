import { ChevronRight } from "lucide-react";
import { Avatar } from "./Avatar";
import type { ProfissionalPublic } from "./types";
import styles from "./booking.module.css";

type Props = {
  profissionais: ProfissionalPublic[];
  selectedId: string;
  /** Preço padrão da clínica, usado quando o profissional não tem valor próprio. */
  defaultPrice: number | null;
  onPick: (p: ProfissionalPublic) => void;
  /** Aviso opcional acima da lista (ex.: o profissional do link não está disponível). */
  notice?: string;
};

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProfessionalStep({ profissionais, selectedId, defaultPrice, onPick, notice }: Props) {
  return (
    <>
      <h2 className={styles.title}>Com quem você quer se consultar?</h2>
      {notice && <p className={styles.noticeBox} role="status">{notice}</p>}
      <ul className={styles.profList}>
        {profissionais.map(p => {
          const price = p.valor_consulta ?? defaultPrice;
          const active = selectedId === p.id;
          return (
            <li key={p.id}>
              <button type="button" className={`${styles.profCard}${active ? ` ${styles.isSelected}` : ""}`} aria-pressed={active} onClick={() => onPick(p)}>
                <Avatar name={p.nome} photo={p.foto_url} size={52} />
                <span className={styles.profText}>
                  <span className={styles.profName}>{p.nome}</span>
                  {p.especialidade && <span className={styles.profSub}>{p.especialidade}</span>}
                </span>
                {price != null && price > 0 && <span className={styles.profPrice}>{money(price)}</span>}
                <ChevronRight size={18} className={styles.profArrow} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
