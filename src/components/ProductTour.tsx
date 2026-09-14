"use client";

import { ArrowRight, Check, ChevronLeft, ExternalLink, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type TourMode = "hidden" | "welcome" | "tour" | "done" | "dismissed";
type Rect = { top: number; left: number; width: number; height: number };
type TourStep = { path: string; selector: string; title: string; text: string; mood: string; action?: string };
type TourRecord = { status: "active" | "completed" | "dismissed"; step: number; agendaStage: boolean };

const STORAGE_KEY = "reserveclinic_product_tour_v1";
const steps: TourStep[] = [
  { path: "/dashboard", selector: ".dashHero", title: "Sua clínica em um só lugar", text: "Aqui você acompanha rapidamente consultas, pacientes e tudo o que está acontecendo na sua clínica.", mood: "default" },
  { path: "/agenda", selector: ".appNavigation a[href='/agenda']", title: "Essa é sua agenda", text: "Aqui você organiza horários, consultas e profissionais ao longo da semana.", mood: "point-left" },
  { path: "/profissionais", selector: ".pageHeader", title: "Cadastre sua equipe", text: "Adicione os profissionais que realizam atendimentos na sua clínica.", action: "Adicionar profissional", mood: "point-right" },
  { path: "/configuracoes", selector: ".settingsGrid", title: "Defina sua disponibilidade", text: "Configure os horários gerais da clínica ou personalize os horários de cada profissional.", mood: "thinking" },
  { path: "/pacientes", selector: ".pageHeader", title: "Todos os seus pacientes organizados", text: "Consulte os dados dos seus pacientes e acompanhe quem já passou pela sua clínica.", mood: "default" },
  { path: "/consultas", selector: ".pageHeader", title: "Controle cada atendimento", text: "Acompanhe consultas aguardando confirmação, confirmadas, concluídas ou canceladas.", mood: "default" },
  { path: "/dashboard", selector: ".dashLinkCard", title: "Deixe seus pacientes agendarem sozinhos", text: "Sua clínica possui uma página pública de agendamento que você pode compartilhar com seus pacientes.", action: "Ver minha página", mood: "wave" },
] as const;

function tourStorageKey(userId: string) { return `${STORAGE_KEY}:${userId}`; }
function readTourState(userId: string): TourRecord | null { try { const value = localStorage.getItem(tourStorageKey(userId)); if (!value) return null; const record = JSON.parse(value) as Partial<TourRecord>; if (record.status === "completed" || record.status === "dismissed" || record.status === "active") return { status: record.status, step: Math.max(0, Math.min(steps.length - 1, record.step ?? 0)), agendaStage: Boolean(record.agendaStage) }; } catch { /* storage unavailable */ } return null; }
function writeTourState(userId: string, status: TourRecord["status"], step = 0, agendaStage = false) { try { localStorage.setItem(tourStorageKey(userId), JSON.stringify({ status, step, agendaStage } satisfies TourRecord)); } catch { /* storage unavailable */ } }

function Mascot({ mood = "default", className = "" }: { mood?: string; className?: string }) {
  const moodAssets: Record<string, string> = { default: "dashboard", wave: "dashboard", "point-left": "agenda", "point-right": "profissionais", thinking: "agenda", pacientes: "pacientes", consultas: "consultas" };
  const fallback = "/navi-svgs/dashboard.svg";
  const [asset, setAsset] = useState(`/navi-svgs/${moodAssets[mood] ?? "dashboard"}.svg`);
  return <div className={`tourMascot tourMascot-${mood} ${className}`}><img src={asset} alt="Navi" onError={() => { if (asset !== fallback) setAsset(fallback); }} /></div>;
}

function targetRect(selector: string): Rect | null { const element = document.querySelector(selector); if (!element) return null; const rect = element.getBoundingClientRect(); return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }; }

export function ProductTour({ slug, userId, accountCreatedAt }: { slug?: string; userId: string; accountCreatedAt: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<TourMode>("hidden");
  const [step, setStep] = useState(0);
  const [agendaStage, setAgendaStage] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const isNewAccount = Boolean(accountCreatedAt && Date.now() - new Date(accountCreatedAt).getTime() < 30 * 24 * 60 * 60 * 1000);
  useEffect(() => { const record = readTourState(userId); if (record) { setStep(record.step); setAgendaStage(record.agendaStage); setMode(record.status === "completed" ? "done" : record.status === "dismissed" ? "dismissed" : "tour"); } else { setMode(isNewAccount ? "welcome" : "hidden"); } }, [userId, isNewAccount]);
  useEffect(() => { if (mode === "tour") writeTourState(userId, "active", step, agendaStage); }, [mode, step, agendaStage, userId]);
  const current = { ...steps[step], mood: step === 4 ? "pacientes" : step === 5 ? "consultas" : steps[step].mood };
  const selector = step === 1 && pathname === "/dashboard" && !agendaStage ? ".appNavigation a[href='/agenda']" : step === 1 ? ".pageHeader" : current.selector;
  const measure = useCallback(() => { if (mode === "tour") setRect(targetRect(selector)); }, [mode, selector]);
  useEffect(() => { if (mode !== "tour") return; const timer = window.setTimeout(measure, 90); window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true); return () => { window.clearTimeout(timer); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); }; }, [measure, pathname, mode]);
  const cardStyle = useMemo(() => { if (!rect || typeof window === "undefined") return { opacity: 1 }; const cardWidth = 390; const left = Math.min(Math.max(18, rect.left + rect.width + 24), window.innerWidth - cardWidth - 18); const top = Math.min(Math.max(18, rect.top), window.innerHeight - 350); const below = rect.left + rect.width + cardWidth + 42 > window.innerWidth; return { left: below ? Math.min(Math.max(18, rect.left), window.innerWidth - cardWidth - 18) : left, top: below ? Math.min(rect.top + rect.height + 22, window.innerHeight - 350) : top }; }, [rect]);
  function start() { setMode("tour"); setStep(0); setAgendaStage(false); writeTourState(userId, "active", 0, false); }
  function dismiss() { setMode("dismissed"); writeTourState(userId, "dismissed", step, agendaStage); }
  function finish() { setMode("done"); writeTourState(userId, "completed", steps.length - 1, false); }
  function next() { if (step === 1 && pathname === "/dashboard" && !agendaStage) { setAgendaStage(true); router.push("/agenda"); return; } if (step === steps.length - 1) { finish(); return; } const nextStep = step + 1; setStep(nextStep); setAgendaStage(false); if (pathname !== steps[nextStep].path) router.push(steps[nextStep].path); }
  function previous() { if (step === 0) return; if (step === 1 && agendaStage) { setAgendaStage(false); router.push("/dashboard"); return; } const previousStep = step - 1; setStep(previousStep); if (pathname !== steps[previousStep].path) router.push(steps[previousStep].path); }

  if (mode === "welcome") return <div className="tourWelcomeLayer"><section className="tourWelcomeCard" role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title"><button className="tourCloseButton" onClick={dismiss} aria-label="Fechar apresentação"><X size={18} /></button><Mascot mood="wave" /><div className="tourWelcomeCopy"><span className="tourKicker">Reserve Clinic</span><h2 id="tour-welcome-title">Olá! Eu sou o Navi</h2><p>Vou te mostrar como usar a Reserve Clinic e deixar sua clínica pronta em poucos minutos.</p></div><div className="tourWelcomeActions"><button className="tourPrimaryButton" onClick={start}>Começar tour <ArrowRight size={17} /></button><button className="tourTextButton" onClick={dismiss}>Explorar sozinho</button></div></section></div>;
  return <>{mode === "tour" && <div className="tourLayer" aria-live="polite"><div className="tourSpotlight" style={rect ? { top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 } : undefined} /><section className="tourCard" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="tour-title"><div className="tourCardTop"><Mascot mood={current.mood} /><button className="tourCloseButton" onClick={dismiss} aria-label="Pular tutorial"><X size={16} /></button></div><span className="tourProgress">{step + 1} de {steps.length}</span><h2 id="tour-title">{current.title}</h2><p>{current.text}</p>{current.action && step === 2 && <button className="tourActionButton" onClick={() => router.push("/profissionais")}>{current.action} <ArrowRight size={15} /></button>}{current.action && step === 6 && slug && <a className="tourActionButton" href={`/agendamento/${slug}`} target="_blank" rel="noreferrer">{current.action} <ExternalLink size={14} /></a>}<div className="tourCardFooter"><button className="tourTextButton" onClick={previous} disabled={step === 0 && !agendaStage}><ChevronLeft size={15} /> Voltar</button><button className="tourPrimaryButton" onClick={next}>{step === steps.length - 1 ? "Concluir" : "Próximo"} <ArrowRight size={15} /></button></div><button className="tourSkipButton" onClick={dismiss}>Pular tutorial</button></section></div>}{(mode === "done" || mode === "dismissed") && <><button className="naviAssistantButton" onClick={() => setChatOpen(!chatOpen)} aria-label="Precisa de ajuda?" title="Precisa de ajuda?"><Mascot /></button>{chatOpen && <aside className="naviChatPanel" aria-label="Assistente Navi"><button className="tourCloseButton" onClick={() => setChatOpen(false)} aria-label="Fechar ajuda"><X size={16} /></button><Mascot mood="wave" /><strong>Oi! Precisa de ajuda?</strong><p>Posso te orientar na Reserve Clinic.</p><div className="naviSuggestions"><button>Como criar uma consulta?</button><button>Como cadastrar um profissional?</button><button>Como configurar meus horários?</button><button>Como compartilhar meu link?</button></div></aside>}</>}</>;
}

export function SetupChecklist() {
  const [visible, setVisible] = useState(true);
  const [items] = useState([true, false, false, false, false]);
  if (!visible || items.every(Boolean)) return null;
  const completed = items.filter(Boolean).length;
  return <aside className="setupChecklist"><header><div><span>Primeiros passos</span><strong>Configure sua clínica</strong></div><button onClick={() => setVisible(false)} aria-label="Minimizar checklist"><X size={15} /></button></header><div className="setupProgress"><span style={{ width: `${completed / items.length * 100}%` }} /></div><small>{completed} de {items.length} concluídos</small><ul>{["Criar conta", "Adicionar profissional", "Configurar horários", "Cadastrar primeiro paciente", "Criar primeira consulta"].map((label, index) => <li key={label} className={items[index] ? "isDone" : ""}><span>{items[index] && <Check size={12} />}</span>{label}</li>)}</ul></aside>;
}
