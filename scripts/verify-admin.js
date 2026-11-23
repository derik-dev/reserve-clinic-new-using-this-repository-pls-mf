/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node runner with optional Playwright supplied through NODE_PATH. */
// Isolated UI regression checks. Every Supabase request is intercepted.
// Fixtures exist only in memory; this script never writes to a clinic database.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const origin = process.env.ADMIN_TEST_ORIGIN || "http://localhost:3000";
const output = path.resolve("artifacts/admin-review");
fs.mkdirSync(output, { recursive: true });
const id = n => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const user = { id: id(1), aud: "authenticated", role: "authenticated", email: "qa@example.invalid", app_metadata: {}, user_metadata: {}, created_at: "2024-01-01T00:00:00Z" };
const now = new Date();
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
  const search = () => page.locator(".adminSearch input");
  const menu = () => page.locator(".adminRowActions button[aria-haspopup=menu]").first().click();
  const dialog = () => page.getByRole("dialog");
  const screenshot = name => page.screenshot({ path: path.join(output, name + ".png"), fullPage: true });
  async function searchFor(value, table) {
    const response = page.waitForResponse(r => r.url().includes("/rest/v1/" + table + "?") && r.request().method() === "GET");
    await search().fill(value); await response; await waitRows();
  }
  try {
    await navigate(origin + "/consultas"); await waitRows();
    await check("Consultas: paginação real de 20 registros", async () => {
      assert.equal(await page.locator(".adminTable tbody tr").count(), 20);
      await page.getByRole("button", { name: "Próxima página" }).click(); await page.getByText("Página 2 de 3", { exact: true }).waitFor(); await waitRows();
      assert(requests.some(r => r.table === "consultas" && r.query.includes("offset=20") && r.query.includes("limit=20")));
      await page.getByRole("button", { name: "Página anterior" }).click(); await waitRows();
    });
    await check("Consultas: abas, contagens, busca, ordenação e período", async () => {
      for (const [label, status] of [["Aguardando", "aguardando"], ["Confirmadas", "confirmada"], ["Concluídas", "concluida"], ["Canceladas", "cancelada"]]) {
        await page.locator(".adminTabs button").filter({ hasText: label }).click();
        const n = appointments.filter(c => c.status === status).length;
        await page.getByText("1–" + n + " de " + n + " registros", { exact: true }).waitFor();
      }
      await page.locator(".adminTabs button").filter({ hasText: "Todas" }).click(); await waitRows();
      await searchFor("Retorno de teste", "consultas");
      await page.getByLabel("Ordenar consultas").selectOption("asc"); await waitRows();
      await page.getByLabel("Filtrar por período").selectOption("hoje"); await waitRows();
      const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar", exact: true }).click(); await (await download).saveAs(path.join(output, "consultas-test.csv"));
      await search().fill("sem-resultados-qa"); await page.getByText("Nenhuma consulta encontrada.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Limpar filtros" }).click(); await waitRows();
      await page.getByLabel("Ordenar consultas").selectOption("desc"); await waitRows();
    });
    await check("Consultas: confirmação com vínculo automático, cancelamento e exclusão", async () => {
      await page.locator(".adminQuickAction").first().click(); await page.getByText("Consulta confirmada.", { exact: true }).waitFor();
      assert.equal(appointments[0].status, "confirmada"); assert(appointments[0].paciente_id);
      await menu(); await page.getByRole("menuitem", { name: "Cancelar consulta", exact: true }).click();
      assert.equal(appointments[0].status, "confirmada"); await dialog().getByRole("button", { name: "Cancelar consulta", exact: true }).click(); await page.getByText("Consulta cancelada.", { exact: true }).waitFor();
      await menu(); await page.getByRole("menuitem", { name: "Excluir consulta", exact: true }).click(); await dialog().getByRole("button", { name: "Voltar", exact: true }).click(); assert.equal(tables.consultas.length, 45);
    });
    await check("Consultas: validação, criação e edição", async () => {
      await page.getByRole("button", { name: "Nova consulta", exact: true }).click(); await dialog().getByRole("button", { name: "Agendar", exact: true }).click(); await page.getByText("Selecione ou informe o paciente.", { exact: true }).waitFor();
      await dialog().getByPlaceholder("Nome do paciente").fill("Paciente exclusivo de QA");
      await dialog().locator('input[type="date"]').fill("2026-11-12"); await dialog().locator('input[type="time"]').fill("10:00");
      await dialog().getByRole("button", { name: "Agendar", exact: true }).click(); await page.getByText("Consulta criada.", { exact: true }).waitFor(); await waitRows();
      await menu(); await page.getByRole("menuitem", { name: "Editar consulta", exact: true }).click();
      await dialog().getByLabel("Serviço", { exact: true }).fill("Serviço atualizado em QA");
      await dialog().getByRole("button", { name: "Salvar alterações" }).click(); await page.getByText("Consulta atualizada.", { exact: true }).waitFor();
    });
    await navigate(origin + "/pacientes"); await waitRows();
    await check("Pacientes: busca por nome, telefone e CPF e paginação", async () => {
      for (const value of ["Paciente de teste 02", patients[1].telefone, patients[1].cpf]) { await searchFor(value, "pacientes"); assert.equal(await page.locator(".adminTable tbody tr").count(), 1); }
      await searchFor("", "pacientes"); await page.getByRole("button", { name: "Próxima página" }).click(); await page.getByText("Página 2 de 2", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Página anterior" }).click(); await waitRows();
    });
    await check("Pacientes: cadastro, edição, criação e desativação", async () => {
      await page.locator(".adminName").first().click(); await dialog().getByRole("button", { name: "Editar paciente" }).click();
      await dialog().getByLabel("Nome completo").fill("Paciente atualizado em QA"); await dialog().getByRole("button", { name: "Salvar alterações" }).click(); await page.getByText("Paciente atualizado.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Novo paciente", exact: true }).click(); await dialog().getByLabel("Nome completo").fill("Novo paciente QA");
      await dialog().getByRole("button", { name: "Cadastrar", exact: true }).click(); await page.getByText("Paciente cadastrado.", { exact: true }).waitFor(); await waitRows();
      await menu(); await page.getByRole("menuitem", { name: "Desativar paciente" }).click(); await dialog().getByRole("button", { name: "Desativar paciente" }).click(); await page.getByText("Paciente desativado.", { exact: true }).waitFor();
    });
    await navigate(origin + "/profissionais"); await waitRows();
    await check("Profissionais: tabela, foto opcional, filtros e paginação", async () => {
      assert.equal(await page.locator(".profGrid").count(), 0); await page.locator(".adminAvatar").first().filter({ hasText: "PD" }).waitFor();
      await page.getByLabel("Filtrar por especialidade").selectOption("Fisioterapia"); await waitRows();
      await page.getByLabel("Filtrar profissionais por status").selectOption("inativo"); await page.getByText("Nenhum profissional encontrado.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Limpar filtros" }).click(); await waitRows();
      await page.getByRole("button", { name: "Próxima página" }).click(); await page.getByText("Página 2 de 2", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Página anterior" }).click(); await waitRows();
    });
    await check("Profissionais: detalhes, relatório, link, edição e criação", async () => {
      await menu(); assert.equal(await page.getByRole("menuitem", { name: "Ver relatório" }).getAttribute("href"), "/profissionais/" + professionals[0].id);
      await page.getByRole("menuitem", { name: "Ver relatório" }).click(); await page.waitForURL("**/profissionais/" + professionals[0].id);
      await page.getByRole("heading", { name: professionals[0].nome }).waitFor();
      await navigate(origin + "/profissionais"); await waitRows(); await menu();
      await page.getByRole("menuitem", { name: "Copiar link de agendamento" }).click(); await page.getByText("Link de agendamento copiado.", { exact: true }).waitFor(); assert((await page.evaluate(() => navigator.clipboard.readText())).includes("/agendamento/qa?p="));
      await page.locator(".adminName").first().click(); await dialog().getByRole("button", { name: "Editar profissional" }).click();
      await dialog().getByLabel("Especialidade", { exact: true }).fill("Psicologia"); await dialog().getByRole("button", { name: "Salvar alterações" }).click(); await page.getByText("Profissional atualizado.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Novo profissional", exact: true }).click(); await dialog().getByLabel("Nome completo").fill("Novo profissional QA"); await dialog().getByRole("button", { name: "Cadastrar", exact: true }).click(); await page.getByText("Profissional cadastrado.", { exact: true }).waitFor();
    });
    await check("Profissionais: ativar, desativar, excluir e falha de operação", async () => {
      await menu(); await page.getByRole("menuitem", { name: "Desativar profissional" }).click(); await dialog().getByRole("button", { name: "Desativar profissional" }).click(); await page.getByText("Profissional desativado.", { exact: true }).waitFor();
      await menu(); await page.getByRole("menuitem", { name: "Ativar profissional" }).click(); await page.getByText("Profissional ativado.", { exact: true }).waitFor();
      await menu(); await page.getByRole("menuitem", { name: "Excluir profissional" }).click(); failMutation = true; await dialog().getByRole("button", { name: "Excluir profissional" }).click(); await page.locator(".adminNotice[role=alert]").waitFor(); failMutation = false;
      await menu(); await page.getByRole("menuitem", { name: "Excluir profissional" }).click(); await dialog().getByRole("button", { name: "Excluir profissional" }).click(); await page.getByText("Profissional excluído.", { exact: true }).waitFor();
    });
    await check("Teclado: menu, foco e Escape", async () => {
      await menu(); await page.keyboard.press("ArrowDown"); assert.equal(await page.evaluate(() => document.activeElement.getAttribute("role")), "menuitem"); await page.keyboard.press("Escape"); assert.equal(await page.getByRole("menu").count(), 0);
      await page.getByRole("button", { name: "Novo profissional", exact: true }).click(); await page.keyboard.press("Tab"); assert(await dialog().evaluate(el => el.contains(document.activeElement))); await page.keyboard.press("Escape"); assert.equal(await dialog().count(), 0);
    });
    for (const route of ["consultas", "pacientes", "profissionais"]) {
      await check(route + ": carregamento, erro, retry e vazio", async () => {
        delayTable = route; failTable = route; await navigate(origin + "/" + route); await page.getByText("Carregando registros…", { exact: true }).waitFor(); await page.getByText("Não foi possível carregar os registros.", { exact: true }).waitFor();
        delayTable = null; failTable = null; await page.getByRole("button", { name: "Tentar novamente", exact: true }).click(); await waitRows();
        const previous = tables[route]; tables[route] = []; await page.reload({ waitUntil: "domcontentloaded" }); await page.getByText(route === "consultas" ? "Nenhuma consulta registrada." : route === "pacientes" ? "Nenhum paciente cadastrado." : "Nenhum profissional cadastrado.", { exact: true }).waitFor(); tables[route] = previous;
      });
      for (const width of [1440, 1024, 768, 390]) await check(route + ": responsividade " + width + "px", async () => {
        await page.setViewportSize({ width, height: 960 }); await navigate(origin + "/" + route); await waitRows();
        const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, font: getComputedStyle(document.querySelector(".adminTable td")).fontSize, control: document.querySelector(".pageActions button").getBoundingClientRect().height, background: getComputedStyle(document.querySelector(".appContent")).backgroundColor }));
        assert(metrics.scroll <= metrics.width + 1, JSON.stringify(metrics)); assert.equal(metrics.font, "16px"); assert(metrics.control >= 44); assert.equal(metrics.background, "rgb(255, 255, 255)");
        const columns = await page.locator(".adminTable thead th").evaluateAll(nodes => nodes.every(el => getComputedStyle(el).display === "table-cell"));
        assert(columns, "No columns may be hidden on mobile");
        const buttonsInside = await page.locator(".adminPagination").evaluate(el => Array.from(el.querySelectorAll("button")).every(button => button.getBoundingClientRect().right <= el.getBoundingClientRect().right && button.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom));
        assert(buttonsInside, "Pagination controls must stay inside their container");
        await screenshot(route + "-" + width);
        await page.locator(".adminTableScroll").evaluate(el => { el.scrollLeft = el.scrollWidth; });
        if (width === 390) await screenshot(route + "-390-actions");
      });
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ mode: "isolated simulated Supabase; no real writes", checks, errors, requestCount: requests.length }, null, 2));
    console.log("PASS " + checks.length + " checks");
  } catch (error) { await screenshot("failure"); fs.writeFileSync(path.join(output, "failure.json"), JSON.stringify({ message: error.message, checks, errors, consoleErrors, network, requests, url: page.url() }, null, 2)); throw error; }
  finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
