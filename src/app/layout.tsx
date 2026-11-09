import type { Metadata, Viewport } from "next";
import { Geist, Newsreader } from "next/font/google";
import { MetaPixel } from "@/components/MetaPixel";
import { SmoothScroll } from "@/components/SmoothScroll";
import { empresa } from "@/content/site";
import "./globals.css";

const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const titulo = "Regularização de imóveis em Maringá e Ponta Grossa | JusVértice";
const descricao =
  "Seu imóvel pode estar irregular sem você saber. Engenharia e consultoria jurídica para regularizar antes da venda, do financiamento ou da transferência. Diagnóstico pelo WhatsApp.";

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
  themeColor: "#071429",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#conteudo"
          className="sr-only-focusable fixed left-4 top-4 z-[60] bg-gold px-5 py-3 font-medium text-stage"
        >
          Pular para o conteúdo
        </a>
        {children}
        <SmoothScroll />
        <MetaPixel />
      </body>
    </html>
  );
}
