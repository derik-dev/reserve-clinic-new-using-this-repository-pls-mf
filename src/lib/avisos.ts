// Ponto único para avisar a psicóloga sobre eventos de segurança da conta.
//
// Hoje o aviso aparece só dentro do sistema (Configurações e tela de saque, com a data e a hora
// em que a chave nova é liberada). Para avisar por fora (WhatsApp via Z-API, e-mail...), basta
// implementar o envio aqui dentro: quem chama não muda. Falha de envio nunca bloqueia a operação.

export type AvisoTrocaChavePix = {
  perfilId: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  /** Quando a chave nova poderá receber saques. */
  liberadaEm: Date;
  /** true na primeira chave cadastrada, false quando é uma troca. */
  primeiraChave: boolean;
};

export async function avisarTrocaChavePix(aviso: AvisoTrocaChavePix): Promise<void> {
  try {
    // Aqui entra o envio externo no futuro. Por enquanto, só registro (sem a chave nem dados pessoais).
    console.log(
      `[avisos] chave Pix ${aviso.primeiraChave ? "cadastrada" : "trocada"} (perfil ${aviso.perfilId}); liberada para saque em ${aviso.liberadaEm.toISOString()}`,
    );
  } catch (e) {
    console.error("[avisos] falha ao avisar troca de chave Pix:", e instanceof Error ? e.message : e);
  }
}
