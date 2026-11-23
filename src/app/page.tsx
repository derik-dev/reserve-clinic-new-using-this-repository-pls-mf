import Image from "next/image";
import { ArrowRight, BellRing, CalendarDays, CalendarPlus, Check, Link2, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { LandingSteps } from "@/components/LandingSteps";
import { LandingDashboardShowcase } from "@/components/LandingDashboardShowcase";
import { LandingComparison } from "@/components/LandingComparison";

const features = [
  {
    eyebrow: "LINK DE AGENDAMENTO",
    title: "O paciente marca e paga sozinho",
    text: "Gere um link exclusivo do seu consultório. O paciente escolhe o dia e o horário, preenche os dados e paga o sinal via Pix.",
    color: "#1d4ed8",
    bullets: ["Link único e personalizável para seu consultório", "Cadastro do paciente em apenas 1 minuto", "Cobrança do sinal via Pix com QR code instantâneo"],
    visual: "phone",
  },
  {
    eyebrow: "LEMBRETES",
    title: "Menos faltas, mais agenda cheia",
    text: "Lembretes automáticos por WhatsApp e SMS antes de cada consulta. O paciente confirma com um toque e você entra na semana com a agenda travada.",
    color: "#1d4ed8",
    bullets: ["Lembrete automático 24h e 2h antes", "Confirmação por um clique do paciente", "Reagendamento fácil e sem ligações"],
    visual: "chat",
  },
  {
    eyebrow: "AGENDA CENTRALIZADA",
    title: "Todo o consultório, numa agenda só",
    text: "Cada profissional, sala e horário visível em uma única tela. Chega de planilha, WhatsApp e caderno de recados para saber quem atende quando.",
    color: "#1d4ed8",
    bullets: ["Visão semanal de todos os profissionais e salas", "Bloqueio automático de conflitos de horário", "Filtro por profissional, especialidade ou status"],
    visual: "default",
  },
];

const comparison = [
  { before: "30 minutos por dia confirmando consulta por telefone", after: "Confirmação automática por WhatsApp, sem a recepção precisar ligar" },
  { before: "Paciente esquece o horário e simplesmente não aparece", after: "Sinal cobrado via Pix na marcação — quem paga, comparece" },
  { before: "Agenda em planilha, WhatsApp e caderno da recepção", after: "Todo o consultório em uma tela só, atualizado em tempo real" },
  { before: "Cadeira vazia é faturamento perdido no fim do mês", after: "Cada horário reservado entra no caixa antes do atendimento" },
];

const faqs = [
  { q: "Preciso saber mexer em tecnologia?", a: "Não. A configuração é assistida e o painel foi feito pensando em quem nunca usou um sistema de gestão. Se você usa WhatsApp, sabe usar o Reserve Clinic." },
  { q: "E se o paciente não souber pagar via Pix?", a: "Pix é hoje o meio de pagamento mais usado no Brasil e funciona em qualquer app de banco. O paciente recebe o QR code e a chave copia-e-cola — em segundos o pagamento cai." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem fidelidade, sem burocracia. Você paga só pelos meses que usar." },
  { q: "Meus dados e os dos pacientes ficam seguros?", a: "Sim. A base é criptografada em trânsito e em repouso, com controle de acesso por perfil e em conformidade com a LGPD." },
  { q: "Quanto tempo leva para configurar?", a: "Uma tarde. A gente ajuda a cadastrar profissionais, horários e serviços, ativar o link de agendamento e testar a cobrança de sinal — tudo em uma sessão guiada." },
];

const planFeatures = [
  "Profissionais e serviços ilimitados",
  "Agenda centralizada do consultório",
  "Link de agendamento personalizado",
  "Cobrança de sinal via Pix",
  "Lembretes automáticos por WhatsApp",
  "Painel da recepção",
  "Ficha completa do paciente",
  "Suporte prioritário e conformidade com a LGPD",
];

const steps = [
  { num: "01", title: "Cadastre o consultório", desc: "Em minutos configure seus horários de atendimento e o valor da consulta." },
  { num: "02", title: "Ative o link", desc: "Receba um link exclusivo e personalizável para compartilhar com seus pacientes." },
  { num: "03", title: "Pacientes agendam", desc: "O paciente escolhe o horário e paga o sinal via Pix — tudo pelo celular, sem ligar." },
  { num: "04", title: "Agenda cheia", desc: "Lembretes automáticos garantem comparecimento e sua agenda opera no máximo." },
];

function Logo() {
  return (
    <div className="logo">
      <Image src="/logo.svg" alt="Reserve Clinic" width={156} height={28} className="logoImage" />
    </div>
  );
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "phone") {
    return (
      <div className="featureVisualShell" data-visual="phone">
        <img
          src="/checkout.svg"
          alt="Checkout"
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 18, boxShadow: "0 24px 60px rgba(15,23,42,.12), 0 0 0 1px #e2e8f0" }}
        />
      </div>
    );
  }
  if (type === "chat") {
    return (
      <div className="featureVisualShell" data-visual="chat">
        <div className="visualCaption"><BellRing size={16} /> Lembretes que trabalham pela recepção</div>
        <div className="chat">
        <div>
          <small>Reserve Clinic · ontem 18:00</small>
          Olá Maria! Lembrando da sua consulta amanhã às 14h com a Dra. Ana Silva.
        </div>
        <div className="reply">
          <small>Maria Oliveira</small>
          Confirmado, obrigada! 👍
        </div>
        <div>
          <small>Reserve Clinic · hoje 08:00</small>
          Sua consulta é hoje às 14h. Toque para confirmar presença.
        </div>
        </div>
      </div>
    );
  }
  return (
    <div className="featureVisualShell" data-visual="agenda">
      <img
        src="/agenda.svg"
        alt="Agenda"
        style={{ display: "block", width: "100%", height: "auto", borderRadius: 18, boxShadow: "0 24px 60px rgba(15,23,42,.12), 0 0 0 1px #e2e8f0" }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="site">
      {/* NAV */}
      <nav>
        <Logo />
        <div className="navLinks">
          <a href="#produto">Produto</a>
          <a href="#recursos">Recursos</a>
          <a href="#precos">Preços</a>
        </div>
        <div className="navActions">
          <a href="/login">Entrar</a>
          <a className="button primary" href="/registro">
            Começar grátis <ArrowRight size={15} />
          </a>
        </div>
      </nav>

      {/* HERO V2 */}
      <section className="hero heroV2" id="produto">
        <div className="heroV2Mesh" aria-hidden="true" />
        <div className="heroV2Glow" aria-hidden="true" />

        <div className="heroV2Content">
          <div className="pill">
            <Sparkles size={13} />
            Feito para consultórios de psicologia de todos os portes
          </div>

          <h1 className="heroV2Headline">
            Paciente que paga antes,<br />
            <span>não falta depois.</span>
          </h1>

          <p className="heroV2Sub">
            Receba o sinal via Pix, confirme automaticamente e mantenha<br className="heroV2Break" />
            sua agenda previsível — sem depender de cobranças manuais.
          </p>

          <div className="heroV2Actions">
            <a className="button primary" href="/registro">
              Começar teste grátis <ArrowRight size={15} />
            </a>
            <a className="button ghost" href="#recursos">
              Ver como funciona
            </a>
          </div>
          <small className="ctaAssurance">Sem cartão de crédito · Cancele quando quiser</small>
        </div>

        {/* Mockup Stage */}
        <div className="heroV2Stage">
          <div className="heroV2FloatCard heroV2FloatPix">
            <span className="heroV2FloatDot" />
            <div>
              <strong>Pix recebido</strong>
              <small>R$ 150,00 · Sinal confirmado</small>
            </div>
          </div>

          <div className="heroV2FloatCard heroV2FloatAgenda">
            <CalendarDays size={14} className="heroV2FloatIcon" />
            <div>
              <strong>Agendamento confirmado</strong>
              <small>Ana Souza · hoje às 14h</small>
            </div>
          </div>

          <div className="heroV2FloatCard heroV2FloatLembrete">
            <BellRing size={14} className="heroV2FloatIcon" />
            <div>
              <strong>Lembrete enviado</strong>
              <small>24h antes da consulta</small>
            </div>
          </div>

          <div className="heroV2MockupWrap">
            <img
              src="/dashboard.svg"
              alt="Dashboard Reserve Clinic"
              className="heroV2MockupImg"
              width={1140}
              height={720}
            />
          </div>
        </div>

        {/* Bottom strip */}
        <div className="heroV2Strip">
          <div className="heroV2StripItem">
            <CalendarDays size={16} />
            <span><strong>Sinal antes</strong> — menos faltas no dia</span>
          </div>
          <div className="heroV2StripDiv" aria-hidden="true" />
          <div className="heroV2StripItem">
            <BellRing size={16} />
            <span><strong>Lembretes automáticos</strong> — confirmação sem ligações</span>
          </div>
          <div className="heroV2StripDiv" aria-hidden="true" />
          <div className="heroV2StripItem">
            <ShieldCheck size={16} />
            <span><strong>Agenda em uma tela</strong> — equipe sempre alinhada</span>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <LandingSteps />
      <section className="steps landingStepsLegacy">
        <div className="sectionTitle">
          <small>COMO FUNCIONA</small>
          <h2>Agendamento simples do jeito certo</h2>
        </div>
        <div className="stepsGrid">
          {steps.map((s, i) => (
            <div className="stepCard" key={s.num}>
              <div className="stepTopline">
                <span className="stepNum">{s.num}</span>
                {i === 0 && <CalendarPlus size={21} />}
                {i === 1 && <Link2 size={21} />}
                {i === 2 && <UserRoundCheck size={21} />}
                {i === 3 && <ShieldCheck size={21} />}
              </div>
              <strong>{s.title}</strong>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD VISUAL */}
      <LandingDashboardShowcase />

      {/* COMPARISON */}
      <LandingComparison />

      {/* FEATURES */}
      <div id="recursos">
        {features.map((f, i) => (
          <section className={`feature feature-${i + 1} ${i % 2 ? "reverse" : ""}`} key={f.title}>
            <div className="featureCopy">
              <small style={{ color: f.color }}>{f.eyebrow}</small>
              <h2>{f.title}</h2>
              <p>{f.text}</p>
              {f.bullets.map((b) => (
                <div className="check" key={b}>
                  <i style={{ color: f.color, background: `${f.color}20` }}>✓</i>
                  {b}
                </div>
              ))}
            </div>
            <FeatureVisual type={f.visual} />
          </section>
        ))}
      </div>

      {/* PRICING */}
      <section className="pricing" id="precos">
        <div className="sectionTitle">
          <small>PREÇOS</small>
          <h2>Um único plano, tudo incluso</h2>
          <p className="launchNote">Condição de lançamento — preço atual válido para os primeiros clientes.</p>
        </div>
        <div className="plans singlePlan">
          <div className="plan popular">
            <small>RESERVE CLINIC</small>
            <div>
              <strong>R$ 127</strong>
              <span>/mês</span>
            </div>
            <p>Um plano só, sem pegadinha de upgrade. Todo o consultório com agenda centralizada, cobrança de sinal via Pix e lembretes automáticos.</p>
            <a className="button primary" href="/registro">
              Começar teste grátis →
            </a>
            {planFeatures.map((feat) => (
              <span className="planFeature" key={feat}>✓ {feat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="duvidas">
        <div className="sectionTitle">
          <small>DÚVIDAS FREQUENTES</small>
          <h2>O que os profissionais perguntam antes de assinar</h2>
        </div>
        <div className="faqList">
          {faqs.map((f, i) => (
            <details className="faqItem" key={f.q} open={i === 0}>
              <summary><strong>{f.q}</strong><span className="faqChevron">+</span></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="finalCta" id="cta">
        <h2>Sua agenda organizada em uma tarde</h2>
        <p>Configuração guiada, sem custo de implantação. Comece hoje mesmo.</p>
        <div>
          <a className="button primary" href="/registro">
            Começar teste grátis →
          </a>
          <a className="button ghost" href="#">
            Falar com um especialista
          </a>
        </div>
        <small className="ctaAssurance" style={{ marginTop: 18 }}>
          Sem cartão de crédito · Cancele quando quiser
        </small>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footerGrid">
          <div>
            <Logo />
            <p>Agendamento, confirmação e cobrança de sinal via Pix para consultórios de psicologia.</p>
          </div>
          {[
            ["Produto", "Agenda", "Link de agendamento", "Pagamentos via Pix", "Lembretes automáticos"],
            ["Empresa", "Sobre", "Carreiras", "Blog"],
            ["Suporte", "Central de ajuda", "Fale conosco", "Status", "Segurança"],
          ].map(([title, ...links]) => (
            <div key={title}>
              <b>{title}</b>
              {links.map((l) => (
                <a href="#" key={l}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="copyright">© 2026 Reserve Clinic. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}
