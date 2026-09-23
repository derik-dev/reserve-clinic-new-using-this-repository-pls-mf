"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

export function LandingDashboardShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.18 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  function animateTilt() {
    if (frameRef.current) return;
    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * 0.11;
      current.y += (target.y - current.y) * 0.11;
      const stage = stageRef.current;
      if (stage) {
        stage.style.setProperty("--tilt-x", `${current.x.toFixed(3)}deg`);
        stage.style.setProperty("--tilt-y", `${current.y.toFixed(3)}deg`);
      }
      if (Math.abs(target.x - current.x) > 0.01 || Math.abs(target.y - current.y) > 0.01) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    targetRef.current = { x: y * -5.5, y: x * 7 };
    stage.style.setProperty("--pix-x", `${(x * -12).toFixed(2)}px`);
    stage.style.setProperty("--pix-y", `${(y * -9).toFixed(2)}px`);
    stage.style.setProperty("--whatsapp-x", `${(x * 8).toFixed(2)}px`);
    stage.style.setProperty("--whatsapp-y", `${(y * 6).toFixed(2)}px`);
    stage.style.setProperty("--spot-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    stage.style.setProperty("--spot-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    animateTilt();
  }

  function handlePointerLeave() {
    targetRef.current = { x: 0, y: 0 };
    const stage = stageRef.current;
    stage?.style.setProperty("--spot-x", "50%");
    stage?.style.setProperty("--spot-y", "50%");
    stage?.style.setProperty("--pix-x", "0px");
    stage?.style.setProperty("--pix-y", "0px");
    stage?.style.setProperty("--whatsapp-x", "0px");
    stage?.style.setProperty("--whatsapp-y", "0px");
    animateTilt();
  }

  return (
    <section ref={sectionRef} className={`dashboardShowcase landingDashboard${isVisible ? " isVisible" : ""}`}>
      <div className="sectionTitle dashboardTitle">
        <small>VISÃO DA CLÍNICA</small>
        <h2>Uma operação inteira, em uma tela só</h2>
        <p>Do primeiro agendamento ao pagamento confirmado, sua equipe enxerga o que importa.</p>
      </div>
      <div ref={stageRef} className="heroVisual dashboardInteractive" id="dashboard" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        <div className="dashboardSpotlight" aria-hidden="true" />
        <div className="floatCard pix">
          <small>PIX RECEBIDO</small>
          <strong>R$ 60,00</strong>
          <span>Maria Oliveira</span>
        </div>
        <img src="/dashboard.svg" className="browser" alt="Dashboard Reserve Clinic" />
        <div className="floatCard whatsapp">
          <small>WhatsApp · agora</small>
          <span>Sua consulta amanhã às 14h foi confirmada</span>
        </div>
      </div>
    </section>
  );
}
