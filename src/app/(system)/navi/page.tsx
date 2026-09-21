"use client";

import { FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, CalendarDays, Camera, Check, ChevronDown, ChevronUp, Copy, ChevronsUp, Download, FileText, Paperclip, PenLine, Plus, RefreshCw, Search, Sparkles, Trash2, UserRoundCheck, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ChatMessage = { role: "user" | "assistant"; content: string; ts?: string };
type PendingAction = { operation: "read" | "create" | "update" | "delete"; entity: "paciente" | "profissional" | "consulta" | "clinica" | "configuracao"; id: string | null; data: Record<string, unknown> };
type StoredSession = { id: string; createdAt: string; title: string; messages: ChatMessage[] };

type DbSession = { id: string; titulo: string; mensagens: ChatMessage[]; created_at: string; updated_at: string };

const suggestions = [
  "Como cadastrar um profissional?",
  "Como configurar meus horários?",
  "Como criar uma consulta?",
  "Como compartilhar meu link?",
];

function dbToSession(row: DbSession): StoredSession {
  return { id: row.id, createdAt: row.updated_at, title: row.titulo, messages: row.mensagens };
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return d.toLocaleDateString("pt-BR", { weekday: "long" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className={`naviCopyBtn${copied ? " naviCopyBtnDone" : ""}`} onClick={handleCopy} title="Copiar mensagem">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function parseTableLines(lines: string[]): ReactNode {
  const rows = lines.filter(l => !l.match(/^\|[-| :]+\|$/));
  const cells = (row: string) => row.split("|").slice(1, -1).map(c => c.trim());
  const [header, ...body] = rows;
  return (
    <div className="naviTableWrap" key={lines[0]}>
      <table className="naviTable">
        <thead><tr>{cells(header).map((c, i) => <th key={i}>{formatInline(c)}</th>)}</tr></thead>
        <tbody>{body.map((row, i) => <tr key={i}>{cells(row).map((c, j) => <td key={j}>{formatInline(c)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  if (!content) return <div className="naviTypingDots"><span /><span /><span /></div>;

  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let tableBuffer: string[] = [];
  let key = 0;

  const flushTable = () => {
    if (tableBuffer.length >= 2) nodes.push(parseTableLines(tableBuffer));
    tableBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|");

    if (isTableRow) {
      tableBuffer.push(trimmed);
      continue;
    }

    if (tableBuffer.length) { flushTable(); }

    if (!trimmed) { nodes.push(<div className="naviAssistantSpacer" key={key++} />); continue; }
    const heading = trimmed.match(/^#{1,3}\s+(.+)/);
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    const step = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (heading) { nodes.push(<h3 className="naviAssistantHeading" key={key++}>{formatInline(heading[1])}</h3>); continue; }
    if (bullet) { nodes.push(<div className="naviAssistantListItem" key={key++}><span>•</span><span>{formatInline(bullet[1])}</span></div>); continue; }
    if (step) { nodes.push(<div className="naviAssistantStep" key={key++}><b>{step[1]}</b><span>{formatInline(step[2])}</span></div>); continue; }
    nodes.push(<p className="naviAssistantParagraph" key={key++}>{formatInline(trimmed)}</p>);
  }

  if (tableBuffer.length) flushTable();

  return <div className="naviAssistantContent">{nodes}</div>;
}

export default function NaviPage() {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [dailyAlert, setDailyAlert] = useState<{ total: number; proxima: string | null } | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [inputExpanded, setInputExpanded] = useState(false);
  const maxInputHeight = inputExpanded ? 620 : 420;

  const [profFotoPreview, setProfFotoPreview] = useState<string | null>(null);
  const [profFotoUrl, setProfFotoUrl] = useState<string | null>(null);
  const [profFotoUploading, setProfFotoUploading] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgsAreaRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profFotoRef = useRef<HTMLInputElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load user + sessions on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);

      const [perfilRes, sessionsRes] = await Promise.all([
        supabase.from("perfis").select("nome").eq("id", data.user.id).maybeSingle(),
        supabase.from("navi_sessoes")
          .select("id, titulo, mensagens, created_at, updated_at")
          .eq("perfil_id", data.user.id)
          .order("updated_at", { ascending: false })
          .limit(40),
      ]);

      const nome = (perfilRes.data as { nome?: string } | null)?.nome ?? "";
      if (nome) setUserName(nome.split(" ")[0]);

      const rows = (sessionsRes.data ?? []) as DbSession[];
      setSessions(rows.map(dbToSession));
      setSessionsLoading(false);

      // Consultas de hoje para notificação proativa
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
      const { data: consultasHoje } = await supabase
        .from("consultas")
        .select("data_hora, paciente_nome, status")
        .eq("perfil_id", data.user.id)
        .gte("data_hora", todayStart.toISOString())
        .lte("data_hora", todayEnd.toISOString())
        .neq("status", "cancelada")
        .order("data_hora");
      if (consultasHoje && consultasHoje.length > 0) {
        const proxima = (consultasHoje as { data_hora: string; paciente_nome: string }[])
          .find(c => new Date(c.data_hora) >= now);
        setDailyAlert({
          total: consultasHoje.length,
          proxima: proxima
            ? `${new Date(proxima.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — ${proxima.paciente_nome}`
            : null,
        });
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const el = msgsAreaRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    msgsAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    document.querySelectorAll<HTMLTextAreaElement>(".naviPageForm textarea").forEach(el => {
      el.style.maxHeight = `${maxInputHeight}px`;
      el.style.height = "auto";
      el.style.height = input ? `${el.scrollHeight}px` : "";
      el.style.overflowY = el.scrollHeight > maxInputHeight ? "auto" : "hidden";
    });
  }, [input, maxInputHeight]);

  // Debounced save to Supabase after each assistant response
  const generateTitle = useCallback(async (msgs: ChatMessage[], sessionId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const res = await fetch("/api/navi-title", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session.access_token}` },
        body: JSON.stringify({ messages: msgs }),
      });
      if (!res.ok) return;
      const { title } = await res.json() as { title: string };
      if (!title) return;
      await supabase.from("navi_sessoes").update({ titulo: title }).eq("id", sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    } catch { /* silencioso */ }
  }, []);

  const saveSession = useCallback(async (msgs: ChatMessage[], sid: string | null, uid: string) => {
    const fallbackTitle = msgs.find(m => m.role === "user")?.content.slice(0, 80) ?? "Conversa";

    if (!sid) {
      // Nova sessão — insert com título provisório, depois gera o título real
      const { data, error } = await supabase.from("navi_sessoes")
        .insert({ perfil_id: uid, titulo: fallbackTitle, mensagens: msgs })
        .select("id, titulo, mensagens, created_at, updated_at")
        .single();
      if (error || !data) return;
      const row = data as DbSession;
      sessionIdRef.current = row.id;
      setSessions(prev => [dbToSession(row), ...prev.filter(s => s.id !== row.id)]);
      // Gera título inteligente em background
      void generateTitle(msgs, row.id);
    } else {
      // Sessão existente — só atualiza mensagens
      const { data, error } = await supabase.from("navi_sessoes")
        .update({ mensagens: msgs, updated_at: new Date().toISOString() })
        .eq("id", sid)
        .select("id, titulo, mensagens, created_at, updated_at")
        .single();
      if (error || !data) return;
      const row = data as DbSession;
      setSessions(prev => [dbToSession(row), ...prev.filter(s => s.id !== row.id)]);
    }
  }, [generateTitle]);

  useEffect(() => {
    if (messages.length < 2 || sending || !userId) return;
    if (messages[messages.length - 1].role !== "assistant") return;

    // Debounce to avoid saving on every keystroke during rapid exchanges
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveSession(messages, sessionIdRef.current, userId);
    }, 600);
  }, [messages, sending, userId, saveSession]);

  function exportConversation() {
    if (!messages.length) return;
    const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const lines: string[] = [`=== Conversa Navi IA — ${date} ===`, ""];
    messages.forEach(m => {
      lines.push(m.role === "user" ? `Você:` : `Navi:`);
      lines.push(m.content);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `navi-conversa-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startNewConversation() {
    setMessages([]);
    setInput("");
    setPendingAction(null);
    sessionIdRef.current = null;
  }

  function loadSession(session: StoredSession) {
    setMessages(session.messages);
    sessionIdRef.current = session.id;
    setPendingAction(null);
  }

  function startEditing(session: StoredSession, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  }

  async function saveTitle(id: string) {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    await supabase.from("navi_sessoes").update({ titulo: title }).eq("id", id);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    await supabase.from("navi_sessoes").delete().eq("id", id);
    if (sessionIdRef.current === id) startNewConversation();
  }

  async function executeAction(action: PendingAction, confirmed: boolean) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Sua sessão expirou. Entre novamente.");
    const response = await fetch("/api/navi-action", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ action, confirmed }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Não foi possível executar a ação.");
    return body as { message: string };
  }

  async function sendMessage(content = input, baseMessages?: ChatMessage[]) {
    const text = content.trim();
    if (!text || sending) return;
    const attachmentNote = attachmentNames.length ? `\n\nArquivos anexados: ${attachmentNames.join(", ")}.` : "";
    const now = new Date().toISOString();
    const nextMessages: ChatMessage[] = [...(baseMessages ?? messages), { role: "user", content: `${text}${attachmentNote}`, ts: now }];
    setMessages([...nextMessages, { role: "assistant", content: "", ts: now }]);
    setInput("");
    setAttachmentNames([]);
    setPlusOpen(false);
    setFollowUps([]);
    setSending(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sua sessão expirou. Entre novamente.");
      const response = await fetch("/api/navi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? "Não foi possível responder agora.");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let assistantContent = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break outer;

          let parsed: Record<string, unknown>;
          try { parsed = JSON.parse(raw); } catch { continue; }

          if (parsed.error) throw new Error(parsed.error as string);

          if (parsed.pendingAction) {
            const action = parsed.pendingAction as PendingAction;
            const msg = (parsed.message as string) ?? "";
            setMessages(c => [...c.slice(0, -1), { role: "assistant", content: msg }]);
            if (action.operation === "read") {
              const result = await executeAction(action, false);
              setMessages(c => [...c, { role: "assistant", content: result.message }]);
            } else {
              setPendingAction(action);
            }
            break outer;
          }

          if (typeof parsed.delta === "string") {
            assistantContent += parsed.delta;
            setMessages(c => [...c.slice(0, -1), { role: "assistant", content: assistantContent }]);
          }
        }
      }
      // Gera sugestões de follow-up em background
      if (assistantContent) {
        void (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) return;
            const res = await fetch("/api/navi-suggestions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session.access_token}` },
              body: JSON.stringify({ userMessage: text, assistantMessage: assistantContent }),
            });
            if (!res.ok) return;
            const { suggestions } = await res.json() as { suggestions: string[] };
            if (suggestions?.length) setFollowUps(suggestions);
          } catch { /* silencioso */ }
        })();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Não foi possível falar com o Navi agora.";
      setMessages(c => {
        const last = c[c.length - 1];
        return last?.role === "assistant" && !last.content
          ? [...c.slice(0, -1), { role: "assistant", content: msg }]
          : [...c, { role: "assistant", content: msg }];
      });
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setAttachmentNames(Array.from(files).map(f => f.name));
    setPlusOpen(false);
  }

  function preparePrompt(prompt: string) {
    setInput(prompt);
    setPlusOpen(false);
  }

  async function handleProfFoto(file: File | null) {
    if (!file || !userId) return;
    setProfFotoPreview(URL.createObjectURL(file));
    setProfFotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", userId);
      fd.append("bucket", "profissional-fotos");
      const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao enviar foto.");
      setProfFotoUrl(data.url ?? null);
    } catch {
      setProfFotoPreview(null);
      setProfFotoUrl(null);
    } finally {
      setProfFotoUploading(false);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction || actionBusy) return;
    setActionBusy(true);
    try {
      const actionWithFoto = profFotoUrl && pendingAction.entity === "profissional"
        ? { ...pendingAction, data: { ...pendingAction.data, foto_url: profFotoUrl } }
        : pendingAction;
      const result = await executeAction(actionWithFoto, true);
      setMessages(c => [...c, { role: "assistant", content: result.message }]);
      setPendingAction(null);
      setProfFotoPreview(null);
      setProfFotoUrl(null);
    } catch (error) {
      setMessages(c => [...c, { role: "assistant", content: error instanceof Error ? error.message : "Não foi possível executar a ação." }]);
      setPendingAction(null);
      setProfFotoPreview(null);
      setProfFotoUrl(null);
    } finally {
      setActionBusy(false);
    }
  }

  const MAX_INPUT = 2000;

  async function regenerate() {
    if (sending) return;
    // Remove última mensagem do assistente → [... user2]
    const withoutAssistant = messages[messages.length - 1]?.role === "assistant"
      ? messages.slice(0, -1)
      : messages;
    const lastUser = [...withoutAssistant].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    // baseMessages = tudo antes do último user (sendMessage vai adicioná-lo de volta)
    const base = withoutAssistant.slice(0, withoutAssistant.lastIndexOf(lastUser));
    await sendMessage(lastUser.content, base);
  }

  const hasConversation = messages.length > 0;
  const activeId = sessionIdRef.current;
  const filteredSessions = searchQuery.trim()
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions;

  const PlusMenu = () => (
    <div className="naviPlusMenu" role="menu">
      <label className="naviPlusAction"><Paperclip size={18} /><span><strong>Adicionar fotos e arquivos</strong><small>Enviar do computador</small></span><input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv" onChange={e => handleFiles(e.target.files)} /></label>
      <button className="naviPlusAction" onClick={() => preparePrompt("Gere um relatório detalhado sobre os dados da minha clínica.")}><FileText size={18} /><span><strong>Relatório detalhado</strong><small>Organizar informações da clínica</small></span></button>
      <button className="naviPlusAction" onClick={() => preparePrompt("Quero analisar uma consulta da minha clínica.")}><CalendarDays size={18} /><span><strong>Anexar uma consulta</strong><small>Usar uma consulta como contexto</small></span></button>
      <button className="naviPlusAction" onClick={() => preparePrompt("Quero analisar um profissional da minha equipe.")}><UserRoundCheck size={18} /><span><strong>Anexar profissional</strong><small>Usar um profissional como contexto</small></span></button>
      <button className="naviPlusAction" onClick={() => preparePrompt("Quero analisar um paciente da minha clínica.")}><Users size={18} /><span><strong>Anexar paciente</strong><small>Usar um paciente como contexto</small></span></button>
    </div>
  );

  return (
    <div className="naviShell">

      {/* ── Main chat area ─────────────────────────────── */}
      <div className={`naviMain${hasConversation ? " hasConv" : ""}`}>

        {/* Greeting */}
        {!hasConversation && (
          <div className="naviGreetingArea">
            <span className="naviGreetingEyebrow"><Sparkles size={14} /> ASSISTENTE DA CLÍNICA</span>
            <h1 className="naviGreetingTitle">{userName ? `Ei, ${userName}` : "Olá!"}</h1>
            <p className="naviGreetingSubtitle">Como posso ajudar você hoje?</p>

            {dailyAlert && !alertDismissed && (
              <div className="naviDailyAlert">
                <div className="naviDailyAlertBody">
                  <span className="naviDailyAlertIcon">📅</span>
                  <div>
                    <strong>Você tem {dailyAlert.total} consulta{dailyAlert.total > 1 ? "s" : ""} hoje</strong>
                    {dailyAlert.proxima && <p>Próxima: {dailyAlert.proxima}</p>}
                  </div>
                </div>
                <button className="naviDailyAlertClose" onClick={() => setAlertDismissed(true)} aria-label="Fechar">×</button>
              </div>
            )}

            <div className="naviGreetingComposer">
              <div className="naviComposerWrap">
                {plusOpen && <PlusMenu />}
                <form className="naviPageForm" onSubmit={handleSubmit}>
                  <button type="button" className="naviPlusButton" onClick={() => setPlusOpen(o => !o)} aria-label="Adicionar conteúdo" aria-expanded={plusOpen}><Plus size={21} /></button>
                  <textarea rows={1} value={input} onChange={e => setInput(e.target.value.slice(0, MAX_INPUT))} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Digite sua dúvida..." aria-label="Mensagem para o Navi" />
                  <button type="button" className="naviExpandBtn" onClick={() => setInputExpanded(o => !o)} aria-label={inputExpanded ? "Recolher" : "Expandir"}>{inputExpanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button>
                  <button type="submit" disabled={sending || !input.trim()} aria-label="Enviar mensagem"><ArrowUp size={18} /></button>
                </form>
                {input.length > MAX_INPUT * 0.8 && <div className={`naviCharCount${input.length >= MAX_INPUT ? " naviCharCountMax" : ""}`}>{input.length}/{MAX_INPUT}</div>}
              </div>
              <div className="naviPageSuggestions">
                {suggestions.map(s => (
                  <button key={s} onClick={() => void sendMessage(s)} disabled={sending}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {hasConversation && (
          <div className="naviMsgsArea" ref={msgsAreaRef}>
            {messages.map((message, index) =>
              message.role === "assistant" ? (
                <div className="naviAssistantRow" key={`a-${index}`}>
                  <img className="naviResponseAvatar" src="/navi-svgs/chatbot.svg" alt="Navi" />
                  <div className="naviPageMessage naviPageMessage-assistant">
                    <AssistantMessage content={message.content} />
                    {message.content && (
                      <div className="naviMsgActions">
                        {message.ts && <span className="naviMsgTime">{formatMsgTime(message.ts)}</span>}
                        <CopyButton text={message.content} />
                        {index === messages.length - 1 && (
                          <button className="naviCopyBtn" onClick={() => void regenerate()} disabled={sending} title="Regenerar resposta">
                            <RefreshCw size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="naviPageMessage naviPageMessage-user" key={`u-${index}`}>
                  {message.content}
                  {message.ts && <span className="naviMsgTimeUser">{formatMsgTime(message.ts)}</span>}
                </div>
              )
            )}
            {followUps.length > 0 && !sending && (
              <div className="naviFollowUps">
                {followUps.map(q => (
                  <button key={q} className="naviFollowUpChip" onClick={() => void sendMessage(q)}>{q}</button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {showScrollTop && (
          <button className="naviScrollTopBtn" onClick={scrollToTop} aria-label="Voltar ao topo">
            <ChevronsUp size={16} />
          </button>
        )}

        {/* Conversation bottom composer */}
        {hasConversation && (
          <div className="naviConvBottom">
            {pendingAction && (
              <div className="naviActionConfirm">
                <strong>Confirme esta ação</strong>
                <span>O Navi quer {pendingAction.operation === "create" ? "cadastrar" : pendingAction.operation === "update" ? "editar" : "excluir"} {pendingAction.entity === "clinica" ? "os dados da clínica" : `um ${pendingAction.entity}`}.</span>
                {pendingAction.entity === "profissional" && (pendingAction.operation === "create" || pendingAction.operation === "update") && (
                  <div className="naviProfFotoWrap">
                    <input ref={profFotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => void handleProfFoto(e.target.files?.[0] ?? null)} />
                    <div className="naviProfFotoPreview" onClick={() => profFotoRef.current?.click()}>
                      {profFotoPreview
                        ? <img src={profFotoPreview} alt="Foto" />
                        : <Camera size={20} />}
                    </div>
                    <button type="button" className="naviProfFotoBtn" onClick={() => profFotoRef.current?.click()} disabled={profFotoUploading}>
                      {profFotoUploading ? "Enviando..." : profFotoPreview ? "Trocar foto" : "Adicionar foto"}
                    </button>
                    {profFotoUrl && <span className="naviProfFotoOk"><Check size={12} /> Foto pronta</span>}
                  </div>
                )}
                <div>
                  <button type="button" onClick={() => { setPendingAction(null); setProfFotoPreview(null); setProfFotoUrl(null); }} disabled={actionBusy}>Cancelar</button>
                  <button type="button" onClick={() => void confirmPendingAction()} disabled={actionBusy || profFotoUploading}>{actionBusy ? "Executando..." : "Confirmar"}</button>
                </div>
              </div>
            )}
            {attachmentNames.length > 0 && (
              <div className="naviAttachmentChips">
                {attachmentNames.map(name => <span key={name}><Paperclip size={12} /> {name}</span>)}
              </div>
            )}
            <div className="naviComposerWrap">
              {plusOpen && <PlusMenu />}
              <form className="naviPageForm" onSubmit={handleSubmit}>
                <button type="button" className="naviPlusButton" onClick={() => setPlusOpen(o => !o)} aria-label="Adicionar conteúdo" aria-expanded={plusOpen}><Plus size={21} /></button>
                <textarea rows={1} value={input} onChange={e => setInput(e.target.value.slice(0, MAX_INPUT))} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Digite sua dúvida..." aria-label="Mensagem para o Navi" />
                <button type="submit" disabled={sending || !input.trim()} aria-label="Enviar mensagem"><ArrowUp size={18} /></button>
              </form>
              {input.length > MAX_INPUT * 0.8 && <div className={`naviCharCount${input.length >= MAX_INPUT ? " naviCharCountMax" : ""}`}>{input.length}/{MAX_INPUT}</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── History sidebar (right) ────────────────────── */}
      <aside className="naviSideHistory">
        <div className="naviSideHead">
          <button className="naviNewChatBtn" onClick={startNewConversation}>
            <PenLine size={14} /> Nova conversa
          </button>
          {hasConversation && (
            <button className="naviExportBtn" onClick={exportConversation} title="Exportar conversa">
              <Download size={13} /> Exportar
            </button>
          )}
          <div className="naviSearchWrap">
            <Search size={13} className="naviSearchIcon" />
            <input
              className="naviSearchInput"
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {sessionsLoading ? (
          <div className="naviSideEmpty">Carregando...</div>
        ) : sessions.length === 0 ? (
          <div className="naviSideEmpty">Nenhuma conversa salva ainda.</div>
        ) : filteredSessions.length === 0 ? (
          <div className="naviSideEmpty">Nenhuma conversa encontrada.</div>
        ) : (
          <>
            <div className="naviSideSectionLabel">Conversas e tarefas</div>
            <div className="naviSideList">
              {filteredSessions.map(session => (
                <div
                  key={session.id}
                  className={`naviSideItem${session.id === activeId ? " isActive" : ""}`}
                  onClick={() => loadSession(session)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && loadSession(session)}
                  title={formatSessionDate(session.createdAt)}
                >
                  <span className="naviSideDot" />
                  {editingId === session.id ? (
                    <input
                      className="naviSideItemEdit"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => void saveTitle(session.id)}
                      onKeyDown={e => { if (e.key === "Enter") void saveTitle(session.id); if (e.key === "Escape") setEditingId(null); }}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      maxLength={80}
                    />
                  ) : (
                    <span className="naviSideItemTitle" onDoubleClick={e => startEditing(session, e)}>{session.title}</span>
                  )}
                  <button className="naviSideItemDel" onClick={e => void deleteSession(session.id, e)} aria-label="Excluir">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
