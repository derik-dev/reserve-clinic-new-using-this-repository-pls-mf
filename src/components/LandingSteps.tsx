"use client";

import { CalendarPlus, Check, Link2, ShieldCheck, UserRoundCheck, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const steps = [
  { num: "01", title: "Cadastre a clínica", desc: "Em minutos configure seus profissionais, especialidades e horários de atendimento.", icon: CalendarPlus },
  { num: "02", title: "Ative o link", desc: "Receba um link exclusivo e personalizável para compartilhar com seus pacientes.", icon: Link2, featured: true },
  { num: "03", title: "Pacientes agendam", desc: "O paciente escolhe o horário e paga o sinal via Pix — tudo pelo celular, sem ligar.", icon: UserRoundCheck },
  { num: "04", title: "Agenda cheia", desc: "Lembretes automáticos garantem comparecimento e sua agenda opera no máximo.", icon: ShieldCheck, featured: true },
];

export function LandingSteps() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.22 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`landingJourney${isVisible ? " isVisible" : ""}`} aria-labelledby="journey-title">
      <div className="journeyHeader">
        <span className="journeyEyebrow">COMO FUNCIONA</span>
        <h2 id="journey-title">Agendamento simples do jeito certo</h2>
        <p>Da configuração à agenda cheia, tudo em poucos passos.<br className="journeyDesktopBreak" /> Mais tempo para cuidar do que realmente importa.</p>
      </div>

      <div className="journeyCanvas">
        <svg className="journeyPath journeyPathDesktop" viewBox="0 0 1200 230" aria-hidden="true" preserveAspectRatio="none">
          <path className="journeyPathBase" d="M20 122 C145 32 225 32 350 120 S555 208 665 120 S865 34 975 118 S1090 174 1180 94" />
          <path className="journeyPathGlow" d="M20 122 C145 32 225 32 350 120 S555 208 665 120 S865 34 975 118 S1090 174 1180 94" />
        </svg>
        <svg className="journeyPath journeyPathMobile" viewBox="0 0 40 1000" aria-hidden="true" preserveAspectRatio="none">
          <path className="journeyPathBase" d="M20 10 C5 105 35 150 20 250 S5 390 20 500 S35 650 20 760 S8 900 20 990" />
          <path className="journeyPathGlow" d="M20 10 C5 105 35 150 20 250 S5 390 20 500 S35 650 20 760 S8 900 20 990" />
        </svg>

        <div className="journeyCards">
          {steps.map(({ num, title, desc, icon: Icon, featured }, index) => (
            <article className={`journeyCard${featured ? " isFeatured" : ""}`} style={{ "--step-delay": `${index * 0.22}s` } as CSSProperties} key={num}>
              <div className="journeyCardTop">
                <span className="journeyNumber">{num}</span>
                <span className="journeyIcon"><Icon size={21} /></span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="journeyProgress" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>

      <div className="journeyNotes" aria-label="Benefícios">
        <div><Zap size={18} /><span><strong>Implementação rápida</strong><small>Comece em minutos</small></span></div>
        <div><ShieldCheck size={18} /><span><strong>Seguro e confiável</strong><small>Mais tranquilidade na rotina</small></span></div>
        <div><Check size={18} /><span><strong>Mais tempo para você</strong><small>Menos tarefas manuais</small></span></div>
      </div>
    </section>
  );
}
