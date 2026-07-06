import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./product.css";
import "./product-tables.css";
import "./login.css";
import "./booking.css";
import "./onboarding.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Reserve Clinic — Gestão inteligente para clínicas",
  description:
    "Agenda, lembretes automáticos e cobrança de sinal via Pix para clínicas médicas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${plex.variable} ${space.variable}`}>
      <body>{children}</body>
    </html>
  );
}



