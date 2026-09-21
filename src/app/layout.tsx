import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import "./product.css";
import "./product-tables.css";
import "./login.css";
import "./booking.css";
import "./onboarding.css";
import "./tour.css";
import "./navi.css";

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

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Reserve Clinic — Gestão inteligente para clínicas",
  description:
    "Agenda, lembretes automáticos e cobrança de sinal via Pix para clínicas médicas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${plex.variable} ${space.variable} ${serif.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}



