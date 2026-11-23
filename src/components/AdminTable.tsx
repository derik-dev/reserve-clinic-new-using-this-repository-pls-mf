"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LoaderCircle, MoreHorizontal, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { initials } from "@/lib/db";

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="adminSearch"><Search size={17} aria-hidden="true" /><input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

export function TableToolbar({ children, tabs }: { children: ReactNode; tabs?: ReactNode }) {
  return <div className="adminToolbar">{tabs && <div className="adminTabs" aria-label="Filtrar consultas por status">{tabs}</div>}<div className="adminControls">{children}</div></div>;
}

export function TableState({ columns, loading, error, empty, onRetry, onClear }: { columns: number; loading: boolean; error: boolean; empty: string; onRetry: () => void; onClear?: () => void }) {
  return <tr><td colSpan={columns}><div className="adminTableState" role={error ? "alert" : "status"}>
    {loading ? <><LoaderCircle className="adminSpinner" size={20} aria-hidden="true" /><strong>Carregando registros…</strong></> : error ? <><strong>Não foi possível carregar os registros.</strong><button className="secondaryButton" onClick={onRetry}>Tentar novamente</button></> : <><strong>{empty}</strong>{onClear && <button className="secondaryButton" onClick={onClear}>Limpar filtros</button>}</>}
  </div></td></tr>;
}

export const TABLE_PAGE_SIZE = 20;

export function Pagination({ page, total, onChange, disabled }: { page: number; total: number; onChange: (page: number) => void; disabled?: boolean }) {
  const pages = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));
  return <nav className="adminPagination" aria-label="Paginação"><span aria-live="polite">{total === 0 ? "0 registros" : `${(page - 1) * TABLE_PAGE_SIZE + 1}–${Math.min(page * TABLE_PAGE_SIZE, total)} de ${total} registros`}</span><div><span>Página {page} de {pages}</span><button className="iconButton" aria-label="Página anterior" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={17} /></button><button className="iconButton" aria-label="Próxima página" disabled={disabled || page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={17} /></button></div></nav>;
}

export function RecordAvatar({ name, src }: { name: string; src?: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return <span className="adminAvatar" aria-hidden="true">{src && src !== failedSrc ? <Image unoptimized width={36} height={36} src={src} alt="" onError={() => setFailedSrc(src)} /> : initials(name)}</span>;
}

type RowAction = { label: string; onClick?: () => void; href?: string; danger?: boolean };

export function RowActions({ name, actions, disabled }: { name: string; actions: RowAction[]; disabled?: boolean }) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [portalRoot, setPortalRoot] = useState<Element | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  function close(restoreFocus = false) { setPosition(null); if (restoreFocus) trigger.current?.focus(); }
  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    function outside(event: PointerEvent) { if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close(); }
    function dismiss() { setPosition(null); }
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", dismiss, true); };
  }, [position]);
  return <><button ref={trigger} className="iconButton" disabled={disabled} aria-label={`Ações de ${name}`} aria-haspopup="menu" aria-expanded={!!position} aria-controls={position ? id : undefined} onClick={(e) => {
    e.stopPropagation();
    if (position) { close(true); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setPortalRoot(e.currentTarget.closest(".adminPage"));
    const height = actions.length * 40 + 10;
    setPosition({ top: rect.bottom + height > window.innerHeight - 12 ? Math.max(12, rect.top - height) : rect.bottom + 4, left: Math.max(12, Math.min(rect.right - 240, window.innerWidth - 252)) });
  }}><MoreHorizontal size={19} /></button>{position && portalRoot && createPortal(<div ref={menu} id={id} className="adminRowMenu" role="menu" aria-label={`Ações de ${name}`} style={position} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => {
    if (e.key === "Escape") { e.preventDefault(); close(true); }
    if (e.key === "Tab") { close(); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const items = Array.from(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (current + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }}>{actions.map((action) => action.href ? <Link role="menuitem" key={action.label} href={action.href} onClick={() => close()}>{action.label}</Link> : <button role="menuitem" key={action.label} className={action.danger ? "isDanger" : undefined} onClick={() => { close(true); action.onClick?.(); }}>{action.label}</button>)}</div>, portalRoot)}</>;
}

export function AdminDialog({ title, onClose, busy, children, className = "modalCard" }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => { onCloseRef.current = onClose; busyRef.current = busy; });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  return <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busyRef.current) onCloseRef.current(); }}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} aria-busy={busy} className={className} onKeyDown={(e) => {
    if (e.key === "Escape") { e.stopPropagation(); if (!busyRef.current) onCloseRef.current(); }
    if (e.key === "Tab") {
      const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter((el) => el.getClientRects().length > 0);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
    }
  }}>{children}</div></div>;
}

export type Confirmation = { title: string; description: string; label: string; onConfirm: () => Promise<void> };

export function ConfirmDialog({ confirmation, busy, onClose }: { confirmation: Confirmation; busy: boolean; onClose: () => void }) {
  return <AdminDialog title={confirmation.title} busy={busy} onClose={onClose} className="modalCard adminConfirm"><header className="modalHeader"><h2>{confirmation.title}</h2><button className="iconButton" disabled={busy} onClick={onClose} aria-label="Fechar"><X size={17} /></button></header><div className="modalBody"><p>{confirmation.description}</p></div><footer className="modalFooter"><button className="secondaryButton" disabled={busy} onClick={onClose}>Voltar</button><button className="dangerButton" disabled={busy} onClick={confirmation.onConfirm}>{busy ? "Processando…" : confirmation.label}</button></footer></AdminDialog>;
}

export function OperationNotice({ notice }: { notice: { ok: boolean; message: string } | null }) {
  return notice ? <div className={`adminNotice${notice.ok ? "" : " isError"}`} role={notice.ok ? "status" : "alert"}>{notice.message}</div> : null;
}
