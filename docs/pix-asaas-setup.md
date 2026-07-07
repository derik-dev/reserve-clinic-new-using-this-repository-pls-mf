# Integração PIX Asaas — Guia de Configuração

Este guia cobre todos os passos necessários para colocar a integração de pagamento PIX em funcionamento, do banco de dados até o webhook da Asaas.

---

## 1. Criar a tabela `agendamentos` no Supabase

A integração usa uma tabela dedicada para agendamentos com PIX. Ela ainda não existe no banco — precisa ser criada manualmente.

**Passo a passo:**

1. Acesse [supabase.com](https://supabase.com) e abra o seu projeto
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New query**
4. Copie todo o conteúdo do arquivo `migrations/create_agendamentos.sql` (na raiz do projeto)
5. Cole no editor e clique em **Run** (ou `Ctrl + Enter`)
6. Verifique que a mensagem de sucesso aparece sem erros

A migration cria:
- A tabela `agendamentos` com todos os campos necessários
- RLS habilitado (qualquer pessoa pode criar; só o dono vê e edita)
- Índices em `perfil_id` e `pix_id` para buscas rápidas

---

## 2. Habilitar Supabase Realtime na tabela `agendamentos`

O componente `PixCheckout` escuta atualizações em tempo real para detectar quando o pagamento é confirmado. Para isso funcionar, o Realtime precisa estar ativo na tabela.

**Passo a passo:**

1. No painel do Supabase, clique em **Database** no menu lateral
2. Clique em **Replication**
3. Na seção **Supabase Realtime**, localize a tabela **`agendamentos`**
4. Ative o toggle ao lado dela (fica azul quando ativo)
5. Aguarde alguns segundos — a alteração é imediata

> Sem esse passo, o checkout ficará travado em "Aguardando confirmação" mesmo depois do pagamento ser recebido.

---

## 3. Adicionar variável de ambiente `ASAAS_WEBHOOK_TOKEN`

O webhook da Asaas valida um token de segurança para rejeitar chamadas não autorizadas. Você precisa criar esse token e configurá-lo em dois lugares: no seu projeto e no painel da Asaas.

**Passo a passo:**

1. Crie um token seguro — pode ser qualquer string aleatória longa. Sugestão: use um gerador como [randomkeygen.com](https://randomkeygen.com) e copie uma chave de 32+ caracteres

2. Abra o arquivo `.env.local` na raiz do projeto e adicione:
   ```
   ASAAS_WEBHOOK_TOKEN=cole_seu_token_aqui
   ```

3. Salve o arquivo e reinicie o servidor de desenvolvimento (`npm run dev`)

> Em produção, adicione essa variável também no painel do serviço de hospedagem (Vercel, Railway, etc.)

---

## 4. Registrar o Webhook no painel da Asaas

Após configurar o token localmente, você precisa informar à Asaas para onde enviar os eventos de pagamento.

**Passo a passo:**

1. Acesse [sandbox.asaas.com](https://sandbox.asaas.com) e faça login
2. No menu lateral, clique em **Integrações**
3. Clique em **Webhooks**
4. Clique em **Adicionar novo webhook**
5. Preencha os campos:
   - **URL:** `https://seudominio.com/api/webhook-asaas`
     - Em desenvolvimento local, use um túnel como [ngrok](https://ngrok.com): `ngrok http 3000` e use a URL gerada
   - **Token de segurança:** cole o mesmo token que você colocou em `ASAAS_WEBHOOK_TOKEN`
   - **Eventos:** selecione pelo menos `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`
6. Clique em **Salvar**

**Testando o webhook localmente com ngrok:**

```bash
# Terminal 1 — servidor Next.js
npm run dev

# Terminal 2 — túnel ngrok
ngrok http 3000
```

Copie a URL gerada pelo ngrok (ex: `https://abc123.ngrok.io`) e use como base no campo URL do webhook: `https://abc123.ngrok.io/api/webhook-asaas`

---

## 5. Usando o componente `PixCheckout`

O componente está pronto em `src/components/PixCheckout.tsx`. Ele gerencia todo o fluxo: geração do QR Code, cópia do código, e confirmação em tempo real.

**Importação:**

```tsx
import { PixCheckout } from "@/components/PixCheckout";
```

**Uso básico:**

```tsx
<PixCheckout
  agendamentoId="uuid-do-agendamento"
  clienteNome="Maria da Silva"
  clienteEmail="maria@email.com"   // opcional
  clienteCpf="123.456.789-00"      // opcional
  valor={150.00}
/>
```

**Props disponíveis:**

| Prop             | Tipo     | Obrigatório | Descrição                                      |
|------------------|----------|-------------|------------------------------------------------|
| `agendamentoId`  | `string` | Sim         | UUID do registro na tabela `agendamentos`      |
| `clienteNome`    | `string` | Sim         | Nome completo do paciente                      |
| `valor`          | `number` | Sim         | Valor em reais (ex: `150.00`)                  |
| `clienteEmail`   | `string` | Não         | E-mail do paciente (melhora rastreio na Asaas) |
| `clienteCpf`     | `string` | Não         | CPF com ou sem máscara                         |

**Fluxo que o componente executa automaticamente:**

1. Ao montar, chama `POST /api/criar-pagamento` com os dados fornecidos
2. Exibe o QR Code e o botão de copiar copia-e-cola
3. Escuta atualizações na tabela `agendamentos` via Supabase Realtime
4. Quando o status mudar para `confirmado`, exibe a tela de sucesso com animação

---

## 6. Variáveis de ambiente — resumo completo

Todas as variáveis necessárias para a integração funcionar:

```env
# Supabase (já configuradas)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Asaas
ASAAS_API_KEY=$aact_...
ASAAS_WALLET_ID=uuid-da-carteira
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3   # trocar para api.asaas.com em produção

# Webhook (adicionar manualmente)
ASAAS_WEBHOOK_TOKEN=seu_token_secreto_aqui
```

> `ASAAS_BASE_URL` é opcional — se não definida, usa o sandbox por padrão. Em produção, defina como `https://api.asaas.com/api/v3`.

---

## 7. Checklist antes de ir para produção

- [ ] Rodar `migrations/create_agendamentos.sql` no banco de produção
- [ ] Habilitar Realtime na tabela `agendamentos` no projeto de produção
- [ ] Trocar `ASAAS_BASE_URL` para `https://api.asaas.com/api/v3`
- [ ] Atualizar a URL do webhook no painel da Asaas para o domínio real
- [ ] Confirmar que `ASAAS_WEBHOOK_TOKEN` está configurado no ambiente de produção
- [ ] Testar um pagamento completo em sandbox antes de trocar para produção
