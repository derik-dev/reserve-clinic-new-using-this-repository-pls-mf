"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LandingDashboardShowcase() {
  const sectionRef  = useRef<HTMLElement>(null);
  const stageRef    = useRef<HTMLDivElement>(null);   // callout CSS vars
  const scrollWrap  = useRef<HTMLDivElement>(null);   // GSAP scroll tilt
  const dashInner   = useRef<HTMLDivElement>(null);   // GSAP pointer tilt
  const rotXQ       = useRef<gsap.core.Tween | null>(null);
  const rotYQ       = useRef<gsap.core.Tween | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  /* ── intersection: trigger CSS entry animations ── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  /* ── GSAP scroll + pointer ── */
  useEffect(() => {
    const wrap = scrollWrap.current;
    const inner = dashInner.current;
    const section = sectionRef.current;
    if (!wrap || !section) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile  = window.matchMedia("(max-width: 768px)").matches;

    /* static fallback for reduced-motion */
    if (reduced) {
      gsap.set(wrap, { transformPerspective: 1200, rotateX: 0, scale: 1 });
      return;
    }

    const startRotX  = mobile ? 8  : 18;
    const startScale = mobile ? 0.96 : 0.93;

    /* scroll-driven perspective unfold */
    const st = gsap.fromTo(
      wrap,
      { transformPerspective: 1200, transformOrigin: "50% 28%", rotateX: startRotX, scale: startScale },
      {
        rotateX: 0,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          end: "center 42%",
          scrub: 1.4,
        },
      }
    );

    /* pointer tilt via quickTo — only desktop */
    if (inner && !mobile) {
      rotXQ.current = gsap.quickTo(inner, "rotateX", { duration: 0.7, ease: "power2.out" }) as unknown as gsap.core.Tween;
      rotYQ.current = gsap.quickTo(inner, "rotateY", { duration: 0.7, ease: "power2.out" }) as unknown as gsap.core.Tween;
    }

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach(s => s.kill());
    };
  }, []);

  /* ── pointer move: callout parallax + pointer tilt ── */
  function handlePointerMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;

    /* callout parallax via CSS vars */
    stage.style.setProperty("--pix-x",    `${(x * -10).toFixed(2)}px`);
    stage.style.setProperty("--pix-y",    `${(y * -7).toFixed(2)}px`);
    stage.style.setProperty("--agenda-x", `${(x *  8).toFixed(2)}px`);
    stage.style.setProperty("--agenda-y", `${(y * -6).toFixed(2)}px`);
    stage.style.setProperty("--ocup-x",   `${(x * -6).toFixed(2)}px`);
    stage.style.setProperty("--ocup-y",   `${(y *  7).toFixed(2)}px`);
    stage.style.setProperty("--whats-x",  `${(x *  7).toFixed(2)}px`);
    stage.style.setProperty("--whats-y",  `${(y *  6).toFixed(2)}px`);

    /* pointer tilt on dashboard inner */
    (rotXQ.current as unknown as (v: number) => void)?.(y * -3);
    (rotYQ.current as unknown as (v: number) => void)?.(x *  4);
  }

  function handlePointerLeave() {
    const stage = stageRef.current;
    if (stage) {
      ["--pix-x","--pix-y","--agenda-x","--agenda-y","--ocup-x","--ocup-y","--whats-x","--whats-y"]
        .forEach(v => stage.style.setProperty(v, "0px"));
    }
    (rotXQ.current as unknown as (v: number) => void)?.(0);
    (rotYQ.current as unknown as (v: number) => void)?.(0);
  }

  return (
    <section
      ref={sectionRef}
      className={`dsShowcase${isVisible ? " dsVisible" : ""}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="dsGrid" aria-hidden="true" />
      <div className="dsGlow" aria-hidden="true" />

      {/* header */}
      <div className="dsHeader">
        <span className="dsEyebrow">VISÃO DA CLÍNICA</span>
        <h2 className="dsHeadline">Uma operação inteira,<br />em uma tela só</h2>
      </div>

      {/* stage: callouts positioned here, relative to this */}
      <div ref={stageRef} className="dsStage">

        {/* scroll wrap: GSAP anima perspectiva/rotação/escala aqui */}
        <div ref={scrollWrap} className="dsScrollWrap">
          {/* dashboard inner: pointer tilt aqui */}
          <div ref={dashInner} className="dsDashboardWrap">
            <img
              src="/dashboard.svg"
              className="dsDashboardImg"
              alt="Dashboard Reserve Clinic"
              width={1140}
              height={720}
            />
          </div>
        </div>

      </div>

    </section>
  );
}
