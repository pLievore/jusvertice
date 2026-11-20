import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { empresa } from "@/content/site";
import "./globals.css";

// Barlow nasceu da sinalização de rodovia: letra de engenharia, e a versão condensada é a
// mesma família dos títulos em caixa alta dos posts da marca. Não é variável: pesos explícitos.
const display = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const sans = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const titulo = "Regularização de imóveis em Maringá e Ponta Grossa | JusVértice";
const descricao =
  "Georreferenciamento, topografia e regularização imobiliária em Maringá e Ponta Grossa, com engenharia e consultoria jurídica juntas. Diagnóstico pelo WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(empresa.url),
  title: titulo,
  description: descricao,
  applicationName: empresa.nome,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: empresa.nome,
    title: titulo,
    description: descricao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: titulo, description: descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#002448",
  colorScheme: "light",
};

/** Só a estrutura e as fontes. O site, (site)/layout.tsx, e o painel, admin/layout.tsx, montam o resto. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
