export function searchFilter(columns: string[], value: string) {
  // Quote the literal for PostgREST's OR grammar; user input cannot add filters.
  const literal = `%${value.trim().replace(/[%_*]/g, "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}%`;
  return columns.map((column) => `${column}.ilike."${literal}"`).join(",");
}

const escapeHtml = (value: string | number) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Primeira linha = cabe\u00E7alho. Gera um relat\u00F3rio HTML aut\u00F4nomo, pronto para abrir ou imprimir.
export function downloadHTML(filename: string, title: string, rows: (string | number)[][]) {
  const [head = [], ...body] = rows;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
body{font-family:Poppins,Arial,sans-serif;color:#000;margin:32px}
h1{font-size:20px;margin:0 0 4px}p{color:#555;font-size:13px;margin:0 0 20px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e3e6ec}
th{background:#f4f6fa;font-weight:600}
</style></head><body><h1>${escapeHtml(title)}</h1><p>Gerado em ${new Date().toLocaleString("pt-BR")} \u00B7 ${body.length} registro(s)</p><table><thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
