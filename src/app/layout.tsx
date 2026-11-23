import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./product.css";
import "./product-tables.css";
import "./login.css";
import "./booking.css";
import "./onboarding.css";
import "./tour.css";
import "./system.css";
import "./agenda.css";

// Fonte única do produto: Poppins. Texto corrido em regular (400); 500 e 600 para ênfase onde for preciso
// (títulos, valores, seleções). Pesos acima de 600 usam o 600. Sem bold falso (font-synthesis: none em globals.css).
// As variáveis antigas (--font-plex, --font-space, --font-serif, --font-inter) apontam para ela em globals.css.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Reserve Clinic — Gestão inteligente para clínicas",
  description:
    "Agenda, lembretes automáticos e cobrança de sinal via Pix para clínicas médicas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}



