# Reserve Clinic — Contexto completo do projeto

## Quem é o usuário
Derik, fundador/dev do Reserve Clinic. Toca o produto sozinho (design, código, negócio). Confortável com TypeScript e SQL. Comunica em português informal. Clínica de teste própria: **vidanova** (slug `vidanova`).

---

## O que é o produto
SaaS de gestão de clínicas. Multi-profissional por conta (cada usuário cadastrado = uma clínica). UI em português brasileiro. Produto em produção real.

---

## Stack
- **Framework:** Next.js 16 App Router + React 19 + TypeScript strict
- **Banco:** Supabase (Postgres + Auth + Storage)
- **CSS:** Arquivos flat globais — sem Tailwind, sem CSS Modules. Classes em camelCase. Arquivos: `globals.css`, `product.css`, `product-tables.css`, `login.css`, `booking.css`, `onboarding.css`
- **Ícones:** lucide-react
- **Fontes:** IBM Plex Sans (`--font-plex`), Space Grotesk (`--font-space`)
- **Path alias:** `@/*` → `src/*`

---

## Arquitetura de rotas
| Rota | Descrição |
|------|-----------|
| `(system)/dashboard` | Área autenticada — visão geral |
| `(system)/agenda` | Grade semanal + calendário mensal |
| `(system)/consultas` | CRUD de consultas |
| `(system)/pacientes` | CRUD de pacientes |
| `(system)/profissionais` | CRUD de profissionais |
| `(system)/configuracoes` | Ajustes da clínica |
| `agendamento/[slug]` | Booking público do paciente |
| `login`, `registro`, `onboarding` | Fluxo de entrada |

---

## Banco de dados (tabelas principais)
```
perfis          — conta da clínica (id = auth.uid())
configuracoes   — agenda_config jsonb por perfil_id
profissionais   — id, perfil_id, nome, especialidade, foto_url, ativo
consultas       — profissional text (legado) + profissional_id uuid FK
pacientes       — dados dos pacientes
agendamentos    — registros do booking público
```

### agenda_config (jsonb em configuracoes)
```json
{
  "dias": { "seg": { "aberto": true, "inicio": "08:00", "fim": "18:00" }, ... },
  "feriados": ["2026-12-25"],
  "duracao_min": 60,
  "disponibilidade": {
    "<profissional_id>": {
      "dias": { "seg": { "aberto": true, "inicio": "09:00", "fim": "17:00" }, ... },
      "feriados": ["2026-07-09"]
    }
  }
}
```
- `disponibilidade[profId]` é opcional — sem entrada = usa dias da clínica como fallback
- Feriados individuais **somam** aos feriados gerais da clínica (não substituem)

---

## Features implementadas
- **Auth:** guard em `(system)/layout.tsx`, redirect para `/login` ou `/onboarding`
- **Dashboard:** busca todas as consultas (sem filtro de mês), auto-refresh ao voltar pra aba
- **Consultas:** modal com 4 seções agrupadas; profissional via select da tabela SQL; salva `profissional_id`
- **Migração profissional_id:** `consultas.profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL` — rodada em produção. 40/61 consultas do vidanova linkadas, 21 ficaram null (campo texto vazio)
- **Agenda admin:**
  - Filtro de profissional por pills visuais (não select)
  - Grade e cálculo de capacidade respeitam disponibilidade individual
  - Widgets da grade mostram nome do profissional
  - MiniCalendar com badge de contagem de consultas por dia
- **AjustesModal:** aba "Por profissional" para configurar horários e folgas individuais
- **Booking público (`/agendamento/[slug]`):**
  - Seletor de profissional com foto + especialidade
  - Slots e calendário isolados por `profissional_id`
  - API `criar-agendamento` salva `profissional_id` na consulta criada
- **Mobile agenda:**
  - Calendário mensal no topo (células 42px)
  - Agenda do dia logo abaixo
  - Stats 2×2, depois grade semanal

---

## Regras importantes
1. **Nunca rodar SQL de schema sem aprovação explícita do Derik.** Sempre mostrar o SQL antes.
2. Profissionais: tabela SQL é fonte de verdade. O array `profissionais[]` dentro do JSON `agenda_config` é legado e não é mais usado para filtros.
3. RLS: todas as queries são escopadas por `perfil_id = auth.uid()`. Booking público usa service role key.
4. Commits só quando Derik pedir explicitamente.
5. Respostas curtas — ele lê o código, não precisa de narração do que foi feito.
