import type { Metadata } from "next";
import { PaginaLanding } from "@/components/PaginaLanding";
import { metaGeorreferenciamento, paginaGeorreferenciamento } from "@/content/georreferenciamento";

export const metadata: Metadata = {
  title: metaGeorreferenciamento.titulo,
  description: metaGeorreferenciamento.descricao,
  alternates: { canonical: "/georreferenciamento" },
  openGraph: {
    title: metaGeorreferenciamento.titulo,
    description: metaGeorreferenciamento.descricao,
    url: "/georreferenciamento",
  },
  twitter: { card: "summary_large_image", title: metaGeorreferenciamento.titulo, description: metaGeorreferenciamento.descricao },
};

export default function Georreferenciamento() {
  return <PaginaLanding pagina={paginaGeorreferenciamento} />;
}
