/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node runner with optional Playwright supplied through NODE_PATH. */
// Isolated UI regression checks. Every Supabase request is intercepted.
// Fixtures exist only in memory; this script never writes to a clinic database.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const origin = process.env.ADMIN_TEST_ORIGIN || "http://localhost:3000";
const output = path.resolve("artifacts/dashboard-review");
fs.mkdirSync(output, { recursive: true });
const id = n => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const user = { id: id(1), aud: "authenticated", role: "authenticated", email: "qa@example.invalid", app_metadata: {}, user_metadata: {}, created_at: "2024-01-01T00:00:00Z" };
const now = new Date("2026-11-12T12:00:00-03:00");
const patients = Array.from({ length: 25 }, (_, i) => ({ id: id(100 + i), perfil_id: user.id, nome: "Paciente de teste " + String(i + 1).padStart(2, "0"), telefone: "1190000" + String(i).padStart(4, "0"), email: "paciente" + i + "@example.invalid", cpf: String(10000000000 + i), data_nascimento: "1990-01-01", observacoes: "Teste isolado.", status: i % 4 ? "ativo" : "inativo", created_at: new Date(now.getTime() - i * 86400000).toISOString() }));
const professionals = Array.from({ length: 24 }, (_, i) => ({ id: id(200 + i), perfil_id: user.id, nome: "Profissional de teste " + String(i + 1).padStart(2, "0"), especialidade: i % 3 === 0 ? null : i % 2 ? "Fisioterapia" : "Psicologia", whatsapp: "11900000000", cpf: null, crm: "CRM 12345", anos_experiencia: null, foto_url: i === 0 ? origin + "/qa-missing-photo.png" : null, ativo: i % 4 !== 0, created_at: "2024-01-01T00:00:00Z", valor_consulta: 150 }));
const appointments = Array.from({ length: 45 }, (_, i) => ({ id: id(300 + i), perfil_id: user.id, paciente_id: i === 0 ? null : patients[i % 25].id, paciente_nome: patients[i % 25].nome, paciente_telefone: "11900000000", paciente_email: null, data_hora: new Date(now.getFullYear(), now.getMonth(), now.getDate() + i % 3, 8 + i % 8).toISOString(), duracao_min: 30, servico: i % 2 ? "Retorno de teste" : "Consulta de teste", profissional_id: professionals[i % 24].id, profissional: professionals[i % 24].nome, valor: i % 3 ? 150 : null, status: ["aguardando", "confirmada", "concluida", "cancelada"][i % 4], observacoes: null, origem: "painel", created_at: new Date(now.getTime() - i * 60000).toISOString() }));
const tables = { pacientes: patients, profissionais: professionals, consultas: appointments, perfis: [{ id: user.id, nome: "Clínica de teste isolado", slug: "qa", onboarding_concluido: true, cor_primaria: "#2454DA", cor_secundaria: "#2454DA", logo_url: null, created_at: "2024-01-01T00:00:00Z", valor_consulta: 150 }] };
let failTable = null, failMutation = false, delayTable = null;
const requests = [], checks = [], errors = [], network = [], consoleErrors = [];
function filter(table, params) {
  let rows = [...(tables[table] || [])];
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset", "or"].includes(key)) continue;
    const split = value.indexOf("."), op = value.slice(0, split), term = value.slice(split + 1);
    if (op === "in") rows = rows.filter(r => term.slice(1, -1).split(",").includes(String(r[key])));
    if (op === "eq") rows = rows.filter(r => String(r[key]) === term);
    if (op === "is" && term === "null") rows = rows.filter(r => r[key] == null);
    if (op === "gte") rows = rows.filter(r => r[key] >= term);
    if (op === "lt") rows = rows.filter(r => r[key] < term);
    if (op === "ilike") rows = rows.filter(r => String(r[key]).toLowerCase() === term.toLowerCase());
  }
  if (params.get("or")) {
    const matches = [...params.get("or").matchAll(/([a-z_]+)\.ilike\."%((?:\\.|[^"\\])*)%"/g)];
    rows = rows.filter(r => matches.some(([, key, value]) => String(r[key] || "").toLowerCase().includes(value.replace(/\\(.)/g, "$1").toLowerCase())));
  }
  if (params.get("order")) {
    const [key, dir] = params.get("order").split(",")[0].split(".");
    rows.sort((a, b) => String(a[key]).localeCompare(String(b[key])) * (dir === "desc" ? -1 : 1));
  }
  return rows;
}
async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.ADMIN_TEST_CHROMIUM });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "America/Sao_Paulo", permissions: ["clipboard-read", "clipboard-write"] });
  const publicUrl = fs.readFileSync(".env.local", "utf8").match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1];
  assert(publicUrl, "Configure NEXT_PUBLIC_SUPABASE_URL");
  const host = new URL(publicUrl).hostname;
  await context.addInitScript(({ user, key }) => {
    localStorage.setItem("reserve-clinic-theme", "light");
    const token = "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })) + ".test";
    localStorage.setItem(key, JSON.stringify({ access_token: token, refresh_token: "qa-only", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user }));
  }, { user, key: "sb-" + host.split(".")[0] + "-auth-token" });
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    network.push(route.request().method() + " " + url.hostname + url.pathname);
    if (url.pathname === "/qa-missing-photo.png") return route.fulfill({ status: 404, body: "" });
    if (url.hostname !== host) return route.continue();
    const method = route.request().method();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-expose-headers": "content-range", "content-type": "application/json" };
    if (method === "OPTIONS") return route.fulfill({ status: 200, headers, body: "" });
    if (url.pathname.startsWith("/auth/")) return route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
    const table = url.pathname.split("/").pop();
    requests.push({ table, method, query: url.search });
    if (delayTable === table) await new Promise(resolve => setTimeout(resolve, 600));
    if (failTable === table || (failMutation && !["GET", "HEAD"].includes(method))) return route.fulfill({ status: 500, headers, body: JSON.stringify({ message: "Falha simulada", code: "QA_ERROR" }) });
    let rows = filter(table, url.searchParams);
    if (method === "PATCH") for (const row of rows) Object.assign(row, route.request().postDataJSON());
    if (method === "DELETE") tables[table] = tables[table].filter(r => !rows.includes(r));
    if (method === "POST") { const record = { id: id(900 + requests.length), created_at: new Date().toISOString(), status: "ativo", ativo: true, ...route.request().postDataJSON() }; tables[table].push(record); rows = [record]; }
    const total = rows.length, offset = Number(url.searchParams.get("offset") || 0), limit = Number(url.searchParams.get("limit") || total);
    rows = rows.slice(offset, offset + limit);
    const select = url.searchParams.get("select");
    if (select && select !== "*") rows = rows.map(r => Object.fromEntries(select.split(",").map(key => [key, r[key]])));
    headers["content-range"] = total ? offset + "-" + Math.max(offset, offset + rows.length - 1) + "/" + total : "*/0";
    const single = (route.request().headers().accept || "").includes("vnd.pgrst.object");
    if (["PATCH", "DELETE", "POST"].includes(method) && !select) return route.fulfill({ status: 204, headers });
    return route.fulfill({ status: 200, headers, body: method === "HEAD" ? "" : JSON.stringify(single ? rows[0] || null : rows) });
  });
  const page = await context.newPage();
  const navigate = url => page.goto(url, { waitUntil: "domcontentloaded" });
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  const waitRows = () => page.locator(".adminTable tbody .rowClickable").first().waitFor();
  const check = async (label, fn) => { await fn(); checks.push(label); console.log("PASS " + label); };
  await page.clock.install({ time: new Date("2026-11-12T12:00:00-03:00") });
  const make = (n, day, time, status) => ({ ...appointments[0], id: id(500 + n), paciente_nome: "Paciente de teste " + n, profissional: "Profissional de teste " + n, data_hora: "2026-11-" + day + "T" + time + ":00-03:00", status });
  // Store timestamps as UTC, as PostgREST does, to exercise local day boundaries.
  const fixtures = [
    make(1, "12", "08:30", "concluida"), make(2, "12", "14:00", "confirmada"),
    make(3, "12", "13:30", "cancelada"), make(4, "12", "09:15", "aguardando"),
    make(5, "12", "23:30", "confirmada"), make(6, "11", "10:00", "aguardando"),
    make(7, "13", "10:00", "aguardando"), make(8, "13", "11:00", "confirmada"),
    make(9, "15", "10:00", "aguardando"), make(10, "16", "10:00", "aguardando"),
    make(11, "17", "10:00", "aguardando"), make(12, "18", "10:00", "aguardando"),
    make(13, "20", "10:00", "confirmada"),
  ].map(record => ({ ...record, data_hora: new Date(record.data_hora).toISOString() }));
  tables.consultas = structuredClone(fixtures);
  const screenshot = name => page.screenshot({ path: path.join(output, name + ".png"), fullPage: true });
  const ready = async () => {
    await page.locator('section[aria-label="Resumo operacional"][aria-busy="false"]').waitFor();
    await page.getByRole("button", { name: "Copiar link de agendamento" }).waitFor();
  };
  const metric = name => page.locator('[data-metric="' + name + '"] .dxKpiValue');
  const upcoming = () => page.locator('section[aria-labelledby="dashboard-upcoming"]');
  const pending = () => page.locator('section[aria-labelledby="dashboard-pending"]');
  const reload = async () => { await page.reload({ waitUntil: "domcontentloaded" }); await ready(); };
  try {
    await navigate(origin + "/dashboard"); await ready();
    await check("Contagens: hoje no fuso local, próximas consultas e pendências completas", async () => {
      assert.equal(await metric("today").innerText(), "4");
      assert.equal(await metric("pending").innerText(), "7");
      assert.equal(await metric("upcoming").innerText(), "8");
      assert((await page.locator('[data-metric="today"]').innerText()).includes("1 concluída · 1 a confirmar"));
      assert((await page.locator('[data-metric="pending"]').innerText()).includes("2 com horário já passado"));
      assert.equal(await upcoming().locator("li").count(), 6);
      assert.equal(await pending().locator("li").count(), 5);
      assert((await pending().innerText()).includes("Horário já passou"));
      assert(!(await upcoming().innerText()).includes("Paciente de teste 3\n"));
    });
    await check("Saques, faturamento estimado e falsa disponibilidade ausentes", async () => {
      const content = await page.locator("main").innerText();
      assert(!/saque|sacar|faturamento|ocupação|horário livre|pacientes ativos/i.test(content));
      assert(!requests.some(r => ["pacientes", "configuracoes"].includes(r.table)));
      assert(!network.some(url => /\/api\/(saldo|sacar|transferencias)/.test(url)));
      assert(requests.filter(r => r.table === "consultas").every(r => ["GET", "HEAD"].includes(r.method)));
    });
    await check("Próximas consultas abrem o cadastro correto", async () => {
      const first = upcoming().locator("li a").first();
      assert((await first.getAttribute("href")).includes("editar=" + id(502)));
      await first.click();
      await page.getByRole("dialog", { name: "Editar consulta", exact: true }).waitFor();
      await navigate(origin + "/dashboard"); await ready();
    });
    await check("Atalhos de nova consulta e dias da agenda preservam a data", async () => {
      assert.equal(await page.getByRole("link", { name: "Nova consulta", exact: true }).first().getAttribute("href"), "/consultas?nova=1&data=2026-11-12");
      const weekLinks = page.locator('section[aria-labelledby="dashboard-week"] a[href*="?data="]');
      assert.equal(await weekLinks.count(), 7);
      assert.equal(await weekLinks.first().getAttribute("href"), "/agenda?data=2026-11-12");
      assert.equal(await weekLinks.last().getAttribute("href"), "/agenda?data=2026-11-18");
      assert((await weekLinks.first().innerText()).includes("1 cancelada"));
    });
    await check("Cópia do link e feedback de sucesso", async () => {
      await page.getByRole("button", { name: "Copiar link de agendamento" }).click();
      await page.getByText("Link de agendamento copiado.", { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), origin + "/agendamento/qa");
      await page.clock.runFor(1900);
    });
    await check("Contagens não ficam limitadas às prévias ou ao primeiro lote", async () => {
      tables.consultas = [...structuredClone(fixtures), ...Array.from({ length: 520 }, (_, i) => ({ ...fixtures[7], id: id(3000 + i) }))];
      await reload();
      assert.equal(await metric("upcoming").innerText(), "528");
      assert(requests.some(r => r.table === "consultas" && r.query.includes("offset=500")));
      assert.equal(await upcoming().locator("li").count(), 6);
      tables.consultas = structuredClone(fixtures);
    });
    await check("Data distante continua nos próximos atendimentos, fora do total de sete dias", async () => {
      tables.consultas = [structuredClone(fixtures[12])]; await reload();
      assert.equal(await metric("upcoming").innerText(), "0");
      assert.equal(await upcoming().locator("li").count(), 1);
      tables.consultas = structuredClone(fixtures);
    });
    await check("Falha de carregamento, dados indisponíveis e tentar novamente", async () => {
      failTable = "consultas"; await reload();
      await page.getByText("Não foi possível atualizar as consultas. Tente novamente.", { exact: true }).waitFor();
      assert.equal(await metric("today").innerText(), "—");
      failTable = null; await page.getByRole("button", { name: "Tentar novamente", exact: true }).click(); await ready();
      assert.equal(await metric("today").innerText(), "4");
    });
    await check("Estados vazios sem mensagens de atendimentos realizados inferidas pelo relógio", async () => {
      tables.consultas = []; await reload();
      await page.getByText("Nenhum atendimento por vir", { exact: true }).waitFor();
      await page.getByText("Nenhuma confirmação pendente", { exact: true }).waitFor();
      assert.equal(await metric("today").innerText(), "0");
      assert.equal(await metric("pending").innerText(), "0");
      assert(!(await page.locator("main").innerText()).includes("Todas realizadas"));
      tables.consultas = structuredClone(fixtures);
    });
    await check("Link bloqueado mantém a regra de configuração existente", async () => {
      const saved = tables.profissionais; tables.profissionais = []; await reload();
      await page.getByText("Cadastre um profissional para liberar o link de agendamento.", { exact: true }).waitFor();
      assert(await page.getByRole("button", { name: "Copiar link de agendamento" }).isDisabled());
      assert.equal(await page.getByRole("link", { name: "Concluir configuração" }).getAttribute("href"), "/profissionais");
      tables.profissionais = saved;
    });
    for (const width of [1440, 1024, 768, 390, 320]) await check("Responsividade e legibilidade em " + width + "px", async () => {
      await page.setViewportSize({ width, height: 1000 }); await reload();
      const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, font: getComputedStyle(document.querySelector('section[aria-labelledby="dashboard-upcoming"] li strong')).fontSize, buttons: Array.from(document.querySelectorAll(".dxHeader .dxActions > *")).map(el => el.getBoundingClientRect().height) }));
      assert(metrics.scroll <= metrics.width + 1, JSON.stringify(metrics)); assert(Number.parseFloat(metrics.font) >= 16); assert(metrics.buttons.every(height => height >= 44));
      await screenshot("dashboard-" + width);
    });
    await check("Tema escuro e navegação por teclado", async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.getByRole("button", { name: "Ativar modo escuro" }).click();
      assert(await page.locator(".appShell").evaluate(el => el.classList.contains("theme-dark")));
      await page.keyboard.press("Tab"); assert(await page.evaluate(() => document.activeElement !== document.body));
      await screenshot("dashboard-dark");
    });
    assert.equal(errors.length, 0, errors.join("\n"));
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ mode: "Supabase isolado e simulado; nenhuma gravação real", checks, errors, requestCount: requests.length }, null, 2));
    console.log("PASS " + checks.length + " checks");
  } catch (error) {
    await screenshot("failure");
    fs.writeFileSync(path.join(output, "failure.json"), JSON.stringify({ message: error.message, checks, errors, consoleErrors, requests }, null, 2)); throw error;
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
