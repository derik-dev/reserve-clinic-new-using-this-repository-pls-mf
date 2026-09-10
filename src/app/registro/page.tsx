"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Stethoscope, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { reportarErroCliente } from "@/lib/reportarErroCliente";

export default function RegistroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await Promise.race([
        supabase.auth.signUp({ email, password, options: { data: { nome } } }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout 10s")), 10000)),
      ]);
      setLoading(false);
      if (error) {
        const status = (error as { status?: number } | null)?.status ?? 0;
        if (status >= 500) {
          void reportarErroCliente("registro", `[${status}] ${error.message}`);
        }
        setError(error.message === "User already registered" ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta. Tente novamente.");
        return;
      }
      if (data.session) {
        router.push("/onboarding");
      } else {
        setCheckEmail(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      void reportarErroCliente("registro", `throw: ${msg}`);
      setLoading(false);
      setError("Não foi possível criar a conta agora. Tenta novamente em instantes.");
    }
  }

  return <main className="loginPage"><section className="loginVisual"><Link className="loginBrand" href="/"><span><Stethoscope size={21} /></span>Reserve Clinic</Link><div className="loginMessage"><span className="loginTag">COMECE EM MINUTOS</span><h1>Sua clínica começa aqui.<br/><em>Sem burocracia.</em></h1><p>Crie sua conta e configure a agenda, pacientes e pagamentos em poucos passos.</p><ul><li><CheckCircle2 size={18} /> Teste gratuito, sem cartão</li><li><CheckCircle2 size={18} /> Suporte para migrar seus dados</li><li><CheckCircle2 size={18} /> Cancele quando quiser</li></ul></div><small>© 2026 Reserve Clinic</small></section><section className="loginFormArea">{checkEmail ? <div className="loginCard"><div className="mobileLoginBrand"><span><Stethoscope size={18} /></span>Reserve Clinic</div><span className="welcomeBadge">QUASE LÁ</span><h2>Confirme seu e-mail</h2><p>Enviamos um link de confirmação para <strong>{email}</strong>. Abra sua caixa de entrada para ativar a conta.</p><Link className="loginSubmit" href="/login" style={{ marginTop: 12 }}>Voltar para o login <ArrowRight size={18} /></Link></div> : <form className="loginCard" onSubmit={handleSubmit}><div className="mobileLoginBrand"><span><Stethoscope size={18} /></span>Reserve Clinic</div><span className="welcomeBadge">CRIE SUA CONTA</span><h2>Comece gratuitamente</h2><p>Preencha seus dados para configurar sua clínica.</p><label>Nome<div><User size={18} /><input type="text" placeholder="Como podemos te chamar" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" /></div></label><label>E-mail<div><Mail size={18} /><input type="email" placeholder="voce@clinica.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div></label><label>Senha<div><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(v => !v)} style={{ background: "none", border: 0, cursor: "pointer", color: "#959dad", padding: "0 2px", display: "flex", alignItems: "center" }} aria-label={showPassword ? "Ocultar senha" : "Ver senha"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error && <p style={{ color: "#e5484d", fontSize: 11, margin: "0 0 12px" }}>{error}</p>}<button type="submit" className="loginSubmit" disabled={loading} style={{ border: 0, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, width: "100%" }}>{loading ? "Criando conta..." : <>Criar minha conta <ArrowRight size={18} /></>}</button><p className="signupPrompt">Já tem uma conta? <Link href="/login">Entrar</Link></p></form>}</section></main>;
}
