import type { Metadata } from "next";
import { PaginaLanding } from "@/components/PaginaLanding";
import { metadadosVariante, variantesRegularizacao } from "@/content/variantes";

export const metadata: Metadata = metadadosVariante("/");

export default function VersaoTres() {
  return <PaginaLanding pagina={variantesRegularizacao.v3} />;
}
