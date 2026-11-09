import type { Metadata } from "next";
import { PaginaLanding } from "@/components/PaginaLanding";
import { metaGeorreferenciamento } from "@/content/georreferenciamento";
import { metadadosVariante, variantesRural } from "@/content/variantes";

export const metadata: Metadata = {
  title: metaGeorreferenciamento.titulo,
  description: metaGeorreferenciamento.descricao,
  ...metadadosVariante("/georreferenciamento"),
};

export default function RuralVersaoDois() {
  return <PaginaLanding pagina={variantesRural.v2} />;
}
