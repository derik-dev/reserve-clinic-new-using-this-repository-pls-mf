"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { searchFilter } from "@/lib/adminTable";
import { TABLE_PAGE_SIZE } from "@/components/AdminTable";

type Options = { table: "pacientes" | "profissionais"; query: string; status: string; specialty?: string; page: number; onPageChange: (page: number) => void };

export function recordsQuery({ table, query, status, specialty }: Omit<Options, "page" | "onPageChange">) {
  let request = supabase.from(table).select("*", { count: "exact" });
  if (query.trim()) request = request.or(searchFilter(table === "pacientes" ? ["nome", "telefone", "cpf", "email"] : ["nome", "especialidade", "cpf"], query));
  if (status !== "todos") request = table === "pacientes" ? request.eq("status", status) : request.eq("ativo", status === "ativo");
  if (specialty) request = specialty === "__sem__" ? request.is("especialidade", null) : request.eq("especialidade", specialty);
  return request.order(table === "pacientes" ? "created_at" : "nome", { ascending: table !== "pacientes" }).order("id");
}

export function useAdminRecords<T>({ table, query, status, specialty, page, onPageChange }: Options) {
  const [records, setRecords] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState(query);
  const sequence = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query); onPageChange(1); }, 300);
    return () => clearTimeout(timer);
  }, [query, onPageChange]);
  const load = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true); setLoadError(false);
    try {
      const { data, count, error } = await recordsQuery({ table, query: search, status, specialty }).range((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE - 1).abortSignal(AbortSignal.timeout(10000));
      if (error) throw error;
      if (id !== sequence.current) return;
      const lastPage = Math.max(1, Math.ceil((count ?? 0) / TABLE_PAGE_SIZE));
      if (page > lastPage) { onPageChange(lastPage); return; }
      setRecords((data ?? []) as T[]); setTotal(count ?? 0);
    } catch { if (id === sequence.current) { setRecords([]); setLoadError(true); } }
    finally { if (id === sequence.current) setLoading(false); }
  }, [table, search, status, specialty, page, onPageChange]);
  useEffect(() => { void load(); return () => { sequence.current++; }; }, [load]);
  return { records, total, loading, loadError, load };
}
