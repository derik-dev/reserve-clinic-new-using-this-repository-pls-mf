"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import gsap from "gsap";
import {
  AlertTriangle,
  BellRing,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Database,
  FileCode2,
  Globe2,
  HeartPulse,
  KeyRound,
  MessageCircle,
  Network,
  Radio,
  Rocket,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import styles from "./page.module.css";

type SectionItem = {
  id: string;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
};

type Field = {
  name: string;
  type: string;
  note: string;
};

type SchemaCard = {
  name: string;
  badge?: string;
  purpose: string;
  fields: Field[];
  note?: string;
};

type EnvVar = {
  name: string;
  scope: "client" | "server";
  required: string;
  description: string;
};

const sections: SectionItem[] = [
  { id: "visao-geral", label: "Visão Geral", eyebrow: "Produto", icon: HeartPulse },
  { id: "stack-tecnica", label: "Stack Técnica", eyebrow: "Arquitetura", icon: Boxes },
  { id: "schema", label: "Schema do Banco", eyebrow: "Dados", icon: Database },
  { id: "cadastro-profissional", label: "Cadastro de profissional", eyebrow: "Operação", icon: UserRoundCheck },
  { id: "fluxo", label: "Fluxo de Agendamento", eyebrow: "Operação", icon: CalendarClock },
  { id: "integracoes", label: "Integrações Externas", eyebrow: "APIs", icon: Network },
  { id: "ambiente", label: "Variáveis de Ambiente", eyebrow: "Config", icon: KeyRound },
  { id: "status", label: "Status do Projeto", eyebrow: "Roadmap", icon: CheckCircle2 },
];

const stackItems = [
  {
    title: "Next.js 16",
    icon: Code2,
    text: "App Router para landing, app interno, booking público e APIs server-side.",
  },
  {
    title: "Supabase",
    icon: Database,
    text: "Auth, Postgres, RLS, Storage de logos e Realtime no status do Pix.",
  },
  {
    title: "Asaas",
    icon: CircleDollarSign,
    text: "Clientes, cobranças PIX, QR Code dinâmico, subcontas e webhook de confirmação.",
  },
  {
    title: "Z-API",
    icon: MessageCircle,
    text: "Envio de WhatsApp ao paciente quando o pagamento e confirmado.",
  },
  {
    title: "Discord",
    icon: BellRing,
    text: "Alertas de erro crítico, healthcheck Supabase e logs vindos do cliente.",
  },
  {
    title: "Vercel",
    icon: Rocket,
    text: "Hospedagem do app e URL pública usada pelos webhooks em produção.",
  },
] as const;

const schemaCards: SchemaCard[] = [
  {
    name: "perfis",
    badge: "tenant",
    purpose: "Registro da clínica/profissional. O campo `slug` alimenta o link público `/agendamento/[slug]`.",
    fields: [
      { name: "id", type: "uuid", note: "PK vinculada a `auth.users(id)`" },
      { name: "tipo", type: "text", note: "`clinica` ou `autonomo` no onboarding" },
      { name: "nome, slug", type: "text", note: "Nome exibido e URL pública única" },
      { name: "telefone, email_contato", type: "text", note: "Contato e WhatsApp da pagina publica" },
      { name: "logo_url, cor_primaria, cor_secundaria", type: "text", note: "Identidade visual do tenant" },
      { name: "endereco_*", type: "text", note: "CEP, rua, numero, bairro, cidade e UF" },
      { name: "pix_chave, valor_consulta", type: "text / numeric", note: "Pix manual legado e valor usado no checkout Asaas" },
      { name: "cpf_cnpj, asaas_conta_id, asaas_api_key, asaas_wallet_id", type: "text", note: "Dados de subconta Asaas salvos no perfil" },
    ],
  },
  {
    name: "configuracoes",
    badge: "agenda",
    purpose: "Configuração por perfil. A agenda pública e interna leem `agenda_config`.",
    fields: [
      { name: "id", type: "uuid", note: "PK gerada automaticamente" },
      { name: "perfil_id", type: "uuid", note: "Único por perfil" },
      { name: "agenda_config", type: "jsonb", note: "`dias`, `feriados`, `profissionais`, `duracao_min`" },
      { name: "created_at", type: "timestamptz", note: "Auditoria básica" },
    ],
  },
  {
    name: "disponibilidade_semanal",
    badge: "modelado em json",
    purpose: "Não existe como tabela física no schema atual; a disponibilidade fica em `configuracoes.agenda_config.dias`.",
    fields: [
      { name: "seg...dom", type: "jsonb keys", note: "Cada dia tem `aberto`, `inicio` e `fim`" },
      { name: "duracao_min", type: "number", note: "Intervalo usado para gerar slots" },
      { name: "profissionais[].dias", type: "array", note: "Dias em que cada profissional atende" },
    ],
    note: "Se virar tabela no futuro, ela deve nascer ligada a `perfil_id` e com RLS por tenant.",
  },
  {
    name: "excecoes",
    badge: "modelado em json",
    purpose: "Não há tabela dedicada para exceções; feriados/bloqueios simples ficam em `agenda_config.feriados`.",
    fields: [
      { name: "feriados[]", type: "date string", note: "Datas ISO sem atendimento" },
      { name: "bloqueios parciais", type: "pendente", note: "Não há modelagem para horários parciais/exceções por profissional" },
    ],
  },
  {
    name: "agendamentos",
    badge: "pix",
    purpose: "Registro usado pelo checkout Asaas e pelo webhook de confirmação de pagamento.",
    fields: [
      { name: "id", type: "uuid", note: "Tambem enviado como `externalReference` para Asaas" },
      { name: "perfil_id", type: "uuid", note: "Tenant da clinica" },
      { name: "cliente_nome, cliente_telefone, cliente_email", type: "text", note: "Dados do paciente no fluxo publico" },
      { name: "data, hora", type: "date / text", note: "Slot escolhido no calendario" },
      { name: "status", type: "text", note: "`aguardando_pagamento`, `confirmado`, `cancelado`" },
      { name: "pix_id", type: "text", note: "ID da cobrança Asaas" },
      { name: "observacoes, created_at", type: "text / timestamptz", note: "Complementos do atendimento" },
    ],
  },
  {
    name: "consultas",
    badge: "agenda interna",
    purpose: "Tabela operacional da agenda. O booking público também cria uma consulta para bloquear o horário.",
    fields: [
      { name: "id, perfil_id, paciente_id", type: "uuid", note: "Identificacao e vinculo opcional ao paciente" },
      { name: "paciente_nome, paciente_telefone, paciente_email", type: "text", note: "Dados exibidos no painel" },
      { name: "data_hora, duracao_min", type: "timestamptz / integer", note: "Base para ocupação da agenda" },
      { name: "servico, profissional, valor", type: "text / numeric", note: "Contexto comercial da consulta" },
      { name: "status, origem", type: "text", note: "`aguardando`, `confirmada`, `concluida`, `cancelada`; origem `painel` ou `publico`" },
    ],
    note: "Hoje o webhook Asaas confirma `agendamentos`, mas não sincroniza `consultas.status`.",
  },
  {
    name: "profissionais",
    badge: "equipe",
    purpose: "Cadastro de profissionais exibidos no painel e lidos no booking público quando ativos.",
    fields: [
      { name: "id, perfil_id", type: "uuid", note: "PK e tenant" },
      { name: "nome, especialidade, whatsapp", type: "text", note: "Dados de exibicao e contato" },
      { name: "cpf, anos_experiencia, foto_url", type: "text / integer", note: "Cadastro complementar" },
      { name: "ativo, created_at", type: "boolean / timestamptz", note: "Filtro do booking publico" },
    ],
  },
];

const policies = [
  {
    title: "perfis",
    text: "`select` público para resolver slug e carregar a página de agendamento; `insert` e `update` por dono autenticado.",
  },
  {
    title: "configuracoes",
    text: "Dono autenticado pode ler/criar/atualizar; `select` anônimo foi adicionado para o booking consultar `agenda_config`.",
  },
  {
    title: "agendamentos",
    text: "Insert público para o fluxo aberto; leitura e update pelo dono. As APIs usam service role para inserir e confirmar.",
  },
  {
    title: "consultas",
    text: "Owner CRUD e insert público. A página pública também depende de `select` anônimo para buscar horários ocupados; isso aparece em migration inicial e precisa ser validado contra o schema aplicado.",
  },
  {
    title: "profissionais",
    text: "A migration atual cria policy apenas para o dono. Como o booking lê profissionais ativos no client, falta validar/adicionar leitura pública filtrada.",
  },
];

const bookingSteps = [
  {
    title: "Calendário público",
    text: "`/agendamento/[slug]` busca `perfis`, `configuracoes.agenda_config` e profissionais ativos para montar a experiência.",
  },
  {
    title: "Seleção de horário",
    text: "Slots saem de `dias`, `feriados`, `duracao_min` e das consultas existentes no mesmo dia/profissional.",
  },
  {
    title: "Formulario do cliente",
    text: "Nome, data e hora são obrigatórios; e-mail e CPF entram como obrigatórios quando `valor_consulta` existe.",
  },
  {
    title: "Reserva no banco",
    text: "`/api/criar-agendamento` insere em `agendamentos` e tambem cria uma `consulta` com status `aguardando`.",
  },
  {
    title: "Pix Asaas",
    text: "`PixCheckout` chama `/api/criar-pagamento`, cria cliente/cobrança PIX, busca QR Code e grava `pix_id`.",
  },
  {
    title: "Confirmação automática",
    text: "`/api/webhook-asaas` confirma `agendamentos`; a tela escuta Realtime e usa polling como fallback.",
  },
  {
    title: "Notificação",
    text: "Na primeira confirmação, se houver telefone, o webhook envia WhatsApp pela Z-API e reporta falhas críticas ao Discord.",
  },
];

const professionalSteps = [
  {
    title: "Abra Profissionais",
    text: "No menu interno, acesse `/profissionais` e clique em `Novo profissional` para abrir o formulário de cadastro.",
  },
  {
    title: "Preencha os dados",
    text: "Informe o nome, que é obrigatório. Especialidade, WhatsApp, CPF e anos de experiência são campos opcionais do formulário.",
  },
  {
    title: "Adicione uma foto (opcional)",
    text: "Selecione uma imagem no campo de foto. O client envia o arquivo para `/api/upload-logo` no bucket `profissional-fotos` e usa a URL pública retornada no cadastro.",
  },
  {
    title: "Clique em Cadastrar",
    text: "A tela obtém o usuário autenticado e grava o registro em `profissionais` com `perfil_id` igual ao usuário da clínica, além dos dados preenchidos e da foto, quando enviada.",
  },
  {
    title: "Configure os dias de atendimento",
    text: "Para que o nome participe da geração de horários, abra `Agenda`, entre em `Ajustes > Profissionais`, adicione o nome e marque os dias em que ele atende. Salve os ajustes.",
  },
  {
    title: "Confira no agendamento público",
    text: "Profissionais ativos são consultados pelo link `/agendamento/[slug]` e exibidos para o paciente quando a leitura pública estiver liberada pelas policies de RLS aplicadas.",
  },
];

const integrations = [
  {
    title: "Asaas",
    icon: CircleDollarSign,
    endpoint: "`POST /customers`, `POST /payments`, `GET /payments/{id}/pixQrCode`, `POST /accounts`, `POST /webhooks`, `POST /transfers`, `GET /transfers`, `GET /finance/balance`",
    env: ["ASAAS_API_KEY", "ASAAS_BASE_URL", "ASAAS_WEBHOOK_TOKEN", "ASAAS_TRANSFER_PIX_KEY", "ASAAS_TRANSFER_PIX_KEY_TYPE"],
    notes: [
      "O código usa `ASAAS_BASE_URL ?? https://api.asaas.com/v3`; em desenvolvimento, defina sandbox explicitamente.",
      "O QR Code pode demorar; a rota tenta buscar 6 vezes com intervalo de 3 segundos.",
      "A rota de pagamento atual usa a chave global `ASAAS_API_KEY`, mesmo existindo subconta salva no perfil.",
      "Saques usam `POST /api/sacar`, com destino Pix exclusivamente configurado no servidor; o browser nunca recebe a chave Asaas.",
      "O mecanismo de validação de saque via webhook ainda deve ser ativado e testado separadamente na conta Asaas; transferências do tipo `TRANSFER` são recusadas pelo webhook enquanto não houver registro local da operação.",
    ],
  },
  {
    title: "Webhook Asaas",
    icon: Radio,
    endpoint: "`POST /api/webhook-asaas`",
    env: ["ASAAS_WEBHOOK_TOKEN", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    notes: [
      "Valida o header `asaas-access-token` quando o token esta configurado.",
      "Aceita `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` como eventos de confirmação.",
      "Atualiza apenas `agendamentos.status`; `consultas.status` ainda fica como ponto de sincronização.",
    ],
  },
  {
    title: "Z-API",
    icon: MessageCircle,
    endpoint: "`https://api.z-api.io/instances/{instanceId}/token/{token}/send-text`",
    env: ["ZAPI_INSTANCE_ID", "ZAPI_TOKEN", "ZAPI_CLIENT_TOKEN"],
    notes: [
      "Normaliza telefones brasileiros adicionando DDI 55 quando necessário.",
      "`Client-Token` é enviado quando `ZAPI_CLIENT_TOKEN` existe.",
      "Erros de envio no webhook são capturados e enviados para o Discord crítico.",
    ],
  },
  {
    title: "Discord",
    icon: BellRing,
    endpoint: "Webhooks do Discord via `fetch` server-side",
    env: ["DISCORD_WEBHOOK_GERAL", "DISCORD_WEBHOOK_CRITICO"],
    notes: [
      "Erros críticos usam `@everyone`; alertas gerais não mencionam todos.",
      "`/api/log-erro-cliente` recebe falhas do browser com deduplicação em `sessionStorage`.",
      "`/api/health-supabase` dispara alerta quando a checagem do banco falha.",
    ],
  },
];

const envVars: EnvVar[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", scope: "client", required: "Sim", description: "URL do projeto Supabase usada no browser e nas rotas server." },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", scope: "client", required: "Sim", description: "Chave anônima do Supabase para Auth e queries públicas permitidas por RLS." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", scope: "server", required: "Sim", description: "Chave administrativa usada por APIs internas. Nunca deve ir para o client." },
  { name: "ASAAS_API_KEY", scope: "server", required: "Pix", description: "Chave para criar clientes, cobranças e subcontas Asaas." },
  { name: "ASAAS_BASE_URL", scope: "server", required: "Opcional", description: "Base da API Asaas. Defina explicitamente sandbox/produção." },
  { name: "ASAAS_WEBHOOK_TOKEN", scope: "server", required: "Recomendado", description: "Token comparado com `asaas-access-token` no webhook." },
  { name: "ASAAS_TRANSFER_PIX_KEY", scope: "server", required: "Saque", description: "Chave Pix de destino autorizada para os saques automatizados. Nunca mostrar no frontend." },
  { name: "ASAAS_TRANSFER_PIX_KEY_TYPE", scope: "server", required: "Saque", description: "Tipo da chave Pix de destino: CPF, CNPJ, EMAIL, PHONE ou EVP." },
  { name: "ZAPI_INSTANCE_ID", scope: "server", required: "WhatsApp", description: "Identificador da instância Z-API." },
  { name: "ZAPI_TOKEN", scope: "server", required: "WhatsApp", description: "Token da instância Z-API." },
  { name: "ZAPI_CLIENT_TOKEN", scope: "server", required: "Opcional", description: "Header adicional `Client-Token` para algumas contas Z-API." },
  { name: "DISCORD_WEBHOOK_GERAL", scope: "server", required: "Opcional", description: "Canal de alertas gerais." },
  { name: "DISCORD_WEBHOOK_CRITICO", scope: "server", required: "Recomendado", description: "Canal para erros críticos e healthcheck." },
  { name: "MP_WEBHOOK_SECRET", scope: "server", required: "Legado", description: "Secret de validação da rota Mercado Pago antiga `/api/webhook-mp`." },
  { name: "MP_ACCESS_TOKEN", scope: "server", required: "Legado", description: "Token para consultar pagamentos no Mercado Pago legado." },
];

const workingItems = [
  "Calendário público por slug com configuração de horários, feriados e duração.",
  "Criação de agendamento e bloqueio do horário na agenda interna.",
  "Checkout Pix Asaas com QR Code, copia e cola, Realtime e polling.",
  "Webhook Asaas confirmando pagamento em `agendamentos`.",
  "WhatsApp via Z-API apos confirmacao e alertas Discord para falhas.",
  "Consulta de saldo, historico e solicitacao de saque via API Asaas disponiveis no dashboard; nenhum saque real foi testado automaticamente.",
  "Onboarding, login, dashboard, consultas, pacientes, profissionais e configuracoes.",
];

const pendingItems = [
  "Validar o mecanismo de saque via webhook da Asaas e registrar cada transferencia antes de responder APPROVED; enquanto isso, o webhook recusa validacoes de transferencia por seguranca.",
  "RLS precisa de teste de ponta a ponta no banco aplicado, principalmente leitura pública de `profissionais` e `consultas`.",
  "Sincronizar `consultas.status` quando o Pix confirmar em `agendamentos`.",
  "Como `/docs` agora é público, revisar periodicamente o conteúdo para não publicar detalhes operacionais sensíveis.",
  "Validar concorrência de slots, reagendamento, cancelamento, reembolso e agendamento duplicado.",
  "Configurar ambiente Asaas sandbox/producao de forma explicita e validar regras comerciais da conta.",
  "Z-API em trial e monitoramento externo ainda precisam de hardening operacional.",
  "Dashboard admin/SaaS multi-tenant de plataforma ainda nao existe como painel separado.",
];

export function DocsPageClient() {
  const [activeId, setActiveId] = useState(sections[0].id);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const sectionNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-doc-section]"));
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-30% 0px -58% 0px", threshold: [0.08, 0.18, 0.32, 0.5] }
    );
    sectionNodes.forEach((node) => spy.observe(node));

    const animatedNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-doc-animate]"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(animatedNodes, { opacity: 1, y: 0 });
      return () => spy.disconnect();
    }

    gsap.set(animatedNodes, { opacity: 0, y: 24 });
    const motion = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          gsap.to(entry.target, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );
    animatedNodes.forEach((node) => motion.observe(node));

    return () => {
      spy.disconnect();
      motion.disconnect();
    };
  }, []);

  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeId) ?? sections[0],
    [activeId]
  );

  return (
    <main className={styles.docsPage}>
      <div className={styles.backgroundGlow} aria-hidden />
      <div className={styles.mobileNav}>
        <button
          type="button"
          className={styles.mobileNavButton}
          onClick={() => setNavOpen((value) => !value)}
          aria-expanded={navOpen}
          aria-controls="docs-mobile-nav"
        >
          <span>
            <currentSection.icon size={16} />
            {currentSection.label}
          </span>
          <ChevronDown size={17} className={navOpen ? styles.chevronOpen : ""} />
        </button>
        {navOpen && (
          <nav id="docs-mobile-nav" className={styles.mobileNavPanel} aria-label="Navegação da documentação">
            {sections.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className={activeId === id ? styles.activeMobileLink : ""}
                onClick={() => setNavOpen(false)}
              >
                <Icon size={15} />
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div className={styles.docsShell}>
        <aside className={styles.sidebar}>
          <Link href="/" className={styles.brand}>
            <span><Stethoscope size={17} /></span>
            Reserve Clinic
          </Link>
          <nav className={styles.sideNav} aria-label="Seções da documentação">
            {sections.map(({ id, label, eyebrow, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className={activeId === id ? styles.activeLink : ""}
                aria-current={activeId === id ? "true" : undefined}
              >
                <Icon size={16} />
                <span>
                  <small>{eyebrow}</small>
                  {label}
                </span>
              </a>
            ))}
          </nav>
          <div className={styles.sidebarNote}>
            <ShieldCheck size={16} />
            <p>Sem valores reais de variáveis, tokens ou chaves. Apenas nomes e finalidade operacional.</p>
          </div>
        </aside>

        <div className={styles.content}>
          <section className={styles.hero} id="visao-geral" data-doc-section data-doc-animate>
            <div className={styles.heroCopy}>
              <span className={styles.kicker}>Documentação técnica</span>
              <h1>
                Reserve Clinic, do MVP <em>vidanova</em> ao SaaS multi-tenant.
              </h1>
              <p>
                Sistema de agendamento com pagamento Pix para profissionais de saude. O piloto roda para o
                Centro Auditivo Macaé e a base já foi desenhada em torno de `perfis`, `slug` público e dados por tenant.
              </p>
              <div className={styles.heroActions}>
                <a href="#fluxo">Ver fluxo</a>
                <a href="#ambiente">Conferir env vars</a>
              </div>
            </div>
            <div className={styles.heroPanel} aria-label="Resumo do produto">
              <div className={styles.panelTopline}>
                <span />
                MVP piloto
              </div>
              <div className={styles.productSignal}>
                <Globe2 size={24} />
                <strong>/agendamento/[slug]</strong>
                <small>Link público por clínica</small>
              </div>
              <div className={styles.signalGrid}>
                <span>Pix Asaas</span>
                <span>Webhook</span>
                <span>WhatsApp</span>
                <span>Discord</span>
              </div>
            </div>
          </section>

          <DocSection id="stack-tecnica" title="Stack Técnica" eyebrow="Arquitetura" icon={Boxes}>
            <div className={styles.stackGrid}>
              {stackItems.map(({ title, text, icon: Icon }) => (
                <article className={styles.stackCard} key={title} data-doc-animate>
                  <div><Icon size={21} /></div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="schema" title="Schema do Banco" eyebrow="Supabase/Postgres" icon={Database}>
            <div className={styles.schemaGrid}>
              {schemaCards.map((table) => (
                <article className={styles.tableCard} key={table.name} data-doc-animate>
                  <header>
                    <div>
                <span>Tabela</span>
                      <h3>{table.name}</h3>
                    </div>
                    {table.badge && <em>{table.badge}</em>}
                  </header>
                  <p>{table.purpose}</p>
                  <div className={styles.fields}>
                    {table.fields.map((field) => (
                      <div className={styles.fieldRow} key={`${table.name}-${field.name}`}>
                        <code>{field.name}</code>
                        <span>{field.type}</span>
                        <small>{field.note}</small>
                      </div>
                    ))}
                  </div>
                  {table.note && <div className={styles.tableNote}>{table.note}</div>}
                </article>
              ))}
            </div>

            <div className={styles.policyBlock} data-doc-animate>
              <div className={styles.sectionLead}>
                <span>RLS</span>
                <h3>Policies documentadas no repositório</h3>
                <p>O schema mistura migrations incrementais e um `supabase/schema.sql`; por isso, a validação em banco real ainda é uma pendência do projeto.</p>
              </div>
              <div className={styles.policyGrid}>
                {policies.map((policy) => (
                  <article key={policy.title}>
                    <strong>{policy.title}</strong>
                    <p>{policy.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </DocSection>

          <DocSection id="cadastro-profissional" title="Cadastro de profissional" eyebrow="Operação" icon={UserRoundCheck}>
            <div className={styles.sectionLead}>
              <p>
                O cadastro completo acontece em `/profissionais`. A configuração dos dias de atendimento é feita separadamente em `Agenda`, porque ela pertence ao `agenda_config` do tenant.
              </p>
            </div>
            <div className={styles.stepper}>
              {professionalSteps.map((step, index) => (
                <article className={styles.stepCard} key={step.title} data-doc-animate>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="fluxo" title="Fluxo de Agendamento" eyebrow="Ponta a ponta" icon={CalendarClock}>
            <div className={styles.stepper}>
              {bookingSteps.map((step, index) => (
                <article className={styles.stepCard} key={step.title} data-doc-animate>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="integracoes" title="Integrações Externas" eyebrow="Asaas, Z-API, Discord" icon={Network}>
            <div className={styles.integrationsGrid}>
              {integrations.map(({ title, endpoint, env, notes, icon: Icon }) => (
                <article className={styles.integrationCard} key={title} data-doc-animate>
                  <header>
                    <div><Icon size={22} /></div>
                    <h3>{title}</h3>
                  </header>
                  <dl>
                    <div>
                      <dt>Endpoint</dt>
                      <dd>{endpoint}</dd>
                    </div>
                    <div>
                      <dt>Variáveis</dt>
                      <dd>{env.map((name) => <code key={name}>{name}</code>)}</dd>
                    </div>
                  </dl>
                  <div className={styles.attentionList}>
                    {notes.map((note) => (
                      <p key={note}><AlertTriangle size={14} /> {note}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="ambiente" title="Variáveis de Ambiente" eyebrow="Sem valores reais" icon={KeyRound}>
            <div className={styles.envTableWrap} data-doc-animate>
              <table className={styles.envTable}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Escopo</th>
                    <th>Uso</th>
                    <th>Descricao</th>
                  </tr>
                </thead>
                <tbody>
                  {envVars.map((item) => (
                    <tr key={item.name}>
                      <td><code>{item.name}</code></td>
                      <td><span className={item.scope === "client" ? styles.clientBadge : styles.serverBadge}>{item.scope === "client" ? "Client" : "Server"}</span></td>
                      <td>{item.required}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          <DocSection id="status" title="Status do Projeto" eyebrow="Piloto e pendencias" icon={CheckCircle2}>
            <div className={styles.statusGrid}>
              <article className={styles.statusCard} data-doc-animate>
                <header>
                  <CheckCircle2 size={22} />
                  <h3>O que já funciona</h3>
                </header>
                <ul>
                  {workingItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className={styles.statusCard} data-doc-animate>
                <header>
                  <AlertTriangle size={22} />
                  <h3>Pendências conhecidas</h3>
                </header>
                <ul>
                  {pendingItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            </div>

            <div className={styles.securityCallout} data-doc-animate>
              <Globe2 size={19} />
              <div>
                <strong>Rota pública</strong>
                <p>
                  `/docs` está aberto sem login, conforme decisão do projeto. O conteúdo evita valores reais de chaves,
                  tokens e variáveis, mas deve continuar sendo revisado antes de cada publicação.
                </p>
              </div>
            </div>
          </DocSection>

          <footer className={styles.docsFooter}>
            <FileCode2 size={15} />
            Conteúdo baseado nas rotas, libs, migrations e schema presentes neste repositório.
          </footer>
        </div>
      </div>
    </main>
  );
}

function DocSection({
  id,
  title,
  eyebrow,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={styles.docSection} data-doc-section>
      <div className={styles.sectionHeader} data-doc-animate>
        <span><Icon size={16} /> {eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
