/**
 * Instante de um agendamento a partir da data (YYYY-MM-DD) e da hora ("17:00") escolhidas.
 *
 * O paciente escolhe o horário no relógio de Brasília. Interpretar essa string no fuso do servidor
 * (UTC na Vercel) deslocaria a consulta em 3h no painel da clínica, então o fuso é explícito.
 * O Brasil não tem horário de verão desde 2019, logo o deslocamento é sempre -03:00.
 */
export function bookingInstant(data: string, hora: string) {
  return new Date(`${data}T${hora.slice(0, 5)}:00-03:00`);
}
