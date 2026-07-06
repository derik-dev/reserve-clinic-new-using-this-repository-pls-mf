"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

export default function TestePixPage() {
  const [codigo, setCodigo] = useState("");

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e8ef", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>Teste QR Code PIX</h1>
        <p style={{ margin: "0 0 20px", color: "#7d8597", fontSize: 13 }}>Cole um código PIX (Copia e Cola) ou uma chave PIX e veja o QR gerado.</p>

        <textarea
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Cole aqui a chave PIX ou o código Copia e Cola..."
          rows={4}
          style={{ width: "100%", border: "1px solid #dce0ea", borderRadius: 8, padding: "10px 12px", fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }}
        />

        {codigo.trim() && (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#fff", padding: 16, border: "1px solid #e5e8ef", borderRadius: 12 }}>
              <QRCode value={codigo.trim()} size={200} />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#858d9f", textAlign: "center" }}>Escaneie com o celular para testar</p>
          </div>
        )}
      </div>
    </main>
  );
}
