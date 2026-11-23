export type PerfilPublic = {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  telefone: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  valor_consulta: number | null;
};

export type ProfissionalPublic = {
  id: string;
  nome: string;
  especialidade: string | null;
  foto_url: string | null;
  valor_consulta: number | null;
};

/** O que o paciente já escolheu até o momento. */
export type Selection = {
  profissional: ProfissionalPublic | null;
  /** YYYY-MM-DD */
  data: string;
  /** "17:00": início do horário escolhido. */
  hora: string;
};

export type Patient = { nome: string; email: string; cpf: string; telefone: string };
