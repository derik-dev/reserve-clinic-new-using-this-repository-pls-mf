"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Stethoscope } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setError("E-mail ou senha inválidos.");
      return;
    }
    const { data: perfil } = await supabase.from("perfis").select("onboarding_concluido").eq("id", data.user.id).maybeSingle();
    router.push(perfil?.onboarding_concluido ? "/dashboard" : "/onboarding");
  }

  return <main className="loginPage"><section className="loginVisual"><Link className="loginBrand" href="/"><span><Stethoscope size={21} /></span>Reserve Clinic</Link><div className="loginMessage"><span className="loginTag">GESTÃO MAIS LEVE</span><h1>Sua clínica organizada.<br/><em>Seu tempo de volta.</em></h1><p>Agenda, pacientes, pagamentos e confirmações em um só lugar.</p><ul><li><CheckCircle2 size={18} /> Configuração rápida e guiada</li><li><CheckCircle2 size={18} /> Seus dados sempre protegidos</li><li><CheckCircle2 size={18} /> Suporte humano quando precisar</li></ul></div><small>© 2026 Reserve Clinic</small></section><section className="loginFormArea"><form className="loginCard" onSubmit={handleSubmit}><div className="mobileLoginBrand"><span><Stethoscope size={18} /></span>Reserve Clinic</div><span className="welcomeBadge">BEM-VINDO DE VOLTA</span><h2>Acesse sua conta</h2><p>Entre com seus dados para continuar.</p><label>E-mail<div><Mail size={18} /><input type="email" placeholder="voce@clinica.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div></label><label>Senha<div><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(v => !v)} style={{ background: "none", border: 0, cursor: "pointer", color: "#959dad", padding: "0 2px", display: "flex", alignItems: "center" }} aria-label={showPassword ? "Ocultar senha" : "Ver senha"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><div className="loginOptions"><label><input type="checkbox" /> Manter conectado</label><a href="#">Esqueci minha senha</a></div>{error && <p style={{ color: "#e5484d", fontSize: 11, margin: "0 0 12px" }}>{error}</p>}<button type="submit" className="loginSubmit" disabled={loading} style={{ border: 0, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, width: "100%" }}>{loading ? "Entrando..." : <>Entrar na plataforma <ArrowRight size={18} /></>}</button><p className="signupPrompt">Ainda não tem uma conta? <Link href="/registro">Comece gratuitamente</Link></p></form></section></main>;
}
