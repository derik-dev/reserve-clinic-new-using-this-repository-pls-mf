// Regras da chave Pix de saque. Sem dependências de servidor: usado na tela e nas rotas da API.

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";

export const PIX_KEY_TYPES: { value: PixKeyType; label: string }[] = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "EVP", label: "Chave aleatória" },
];

/** Carência: a chave nova só recebe saque depois disso. */
export const PIX_GRACE_HOURS = 24;

export const onlyDigits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

export function isPixKeyType(value: unknown): value is PixKeyType {
  return typeof value === "string" && PIX_KEY_TYPES.some((t) => t.value === value);
}

export function isValidCpf(raw: string) {
  const d = onlyDigits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(d[i]) * (size + 1 - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(d[size])) return false;
  }
  return true;
}

export function isValidCnpj(raw: string) {
  const d = onlyDigits(raw);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  for (const size of [12, 13]) {
    const weights = size === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(d[i]) * weights[i];
    const rest = sum % 11;
    if ((rest < 2 ? 0 : 11 - rest) !== Number(d[size])) return false;
  }
  return true;
}

/** Devolve a chave no formato que o Asaas espera, ou null quando o formato é inválido. */
export function normalizePixKey(type: PixKeyType, raw: string): string | null {
  const value = raw.trim();
  if (type === "CPF") return isValidCpf(value) ? onlyDigits(value) : null;
  if (type === "CNPJ") return isValidCnpj(value) ? onlyDigits(value) : null;
  if (type === "EMAIL") {
    const email = value.toLowerCase();
    return email.length <= 77 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
  }
  if (type === "PHONE") {
    let d = onlyDigits(value);
    if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
    if (d.length !== 10 && d.length !== 11) return null;
    if (Number(d.slice(0, 2)) < 11) return null;
    if (d.length === 11 && d[2] !== "9") return null;
    return d;
  }
  const evp = value.toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(evp) ? evp : null;
}

const FORMAT_HINT: Record<PixKeyType, string> = {
  CPF: "CPF inválido. Confira os 11 dígitos.",
  CNPJ: "CNPJ inválido. Confira os 14 dígitos.",
  EMAIL: "E-mail inválido.",
  PHONE: "Telefone inválido. Use DDD + número, por exemplo (47) 99651-5839.",
  EVP: "Chave aleatória inválida. Ela tem o formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.",
};

export function pixKeyFormatError(type: PixKeyType, raw: string): string | null {
  return normalizePixKey(type, raw) ? null : FORMAT_HINT[type];
}

/**
 * Confere o titular devolvido pelo Asaas (documento mascarado, ex.: "***.202.745-**") com o
 * CPF/CNPJ do perfil, só nos dígitos visíveis. true = bate; false = diverge; null = não deu para
 * conferir (máscara desconhecida ou poucos dígitos visíveis).
 */
export function titularConfere(masked: string | null | undefined, perfilDoc: string | null | undefined): boolean | null {
  const doc = onlyDigits(perfilDoc);
  const clean = (masked ?? "").replace(/[^\d*•xX]/g, "");
  if (!doc || clean.length !== doc.length) return null;
  let visiveis = 0;
  for (let i = 0; i < clean.length; i++) {
    if (/\d/.test(clean[i])) {
      visiveis++;
      if (clean[i] !== doc[i]) return false;
    }
  }
  return visiveis >= 4 ? true : null;
}

/** Quando a chave passa a poder receber saque (null = sem data de carência). */
export function liberadaEm(alteradaEm: string | null | undefined): Date | null {
  if (!alteradaEm) return null;
  const t = new Date(alteradaEm).getTime();
  return Number.isNaN(t) ? null : new Date(t + PIX_GRACE_HOURS * 3600_000);
}

export function emCarencia(alteradaEm: string | null | undefined, now = Date.now()) {
  const libera = liberadaEm(alteradaEm);
  return libera !== null && libera.getTime() > now;
}

/** "25/11 às 14:30", no horário de Brasília. */
export function formatLiberacao(date: Date) {
  const opts = { timeZone: "America/Sao_Paulo" } as const;
  const dia = date.toLocaleDateString("pt-BR", { ...opts, day: "2-digit", month: "2-digit" });
  const hora = date.toLocaleTimeString("pt-BR", { ...opts, hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}

/** Máscara só para exibição. */
export function maskPixKeyValue(type: PixKeyType | string | null | undefined, key: string | null | undefined) {
  if (!key) return "";
  if (type === "CPF") return key.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "***.$2.$3-**");
  if (type === "CNPJ") return key.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "**.***.$3/$4-**");
  if (type === "PHONE") return key.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) *****-$3");
  if (type === "EMAIL") {
    const [user, domain] = key.split("@");
    return domain ? `${user.slice(0, 2)}***@${domain}` : key;
  }
  return `${key.slice(0, 8)}…`;
}
