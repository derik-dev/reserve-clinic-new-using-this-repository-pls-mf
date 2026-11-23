import { useState } from "react";
import { PROF_COLORS, type ProfissionalSql } from "@/lib/agenda";

type Props = {
  profissionais: ProfissionalSql[];
  /** "todos", "sem" (consultas sem profissional) ou o id de um profissional. */
  value: string;
  onChange: (value: string) => void;
};

/** A busca só aparece quando a lista é longa o bastante para precisar dela. */
const SEARCH_THRESHOLD = 8;

export function ProfessionalFilters({ profissionais, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  if (profissionais.length === 0) return null;

  const filtered = profissionais
    .map((p, index) => ({ p, color: PROF_COLORS[index % PROF_COLORS.length] }))
    .filter(({ p }) => p.nome.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="agxFilters" aria-label="Filtrar por profissional">
      <h2 className="agxSideTitle">Profissionais</h2>
      {profissionais.length > SEARCH_THRESHOLD && (
        <input className="agxFilterSearch" type="search" placeholder="Buscar profissional" aria-label="Buscar profissional" value={query} onChange={e => setQuery(e.target.value)} />
      )}
      <ul className="agxFilterList">
        <li>
          <button className={`agxFilter${value === "todos" ? " isActive" : ""}`} aria-pressed={value === "todos"} onClick={() => onChange("todos")}>
            <span className="agxDot isAll" aria-hidden="true" />
            Todos
          </button>
        </li>
        {filtered.map(({ p, color }) => (
          <li key={p.id}>
            <button className={`agxFilter${value === p.id ? " isActive" : ""}`} aria-pressed={value === p.id} onClick={() => onChange(value === p.id ? "todos" : p.id)}>
              <span className="agxDot" style={{ background: color }} aria-hidden="true" />
              <span className="agxFilterName">{p.nome}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="agxFilterEmpty">Nenhum profissional encontrado.</li>}
      </ul>
    </section>
  );
}
