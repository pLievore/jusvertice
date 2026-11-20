import { imagemCompartilhamento, tamanhoCompartilhamento } from "@/lib/imagem-compartilhamento";

export const alt = "JusVértice — Sua terra está em ordem no cartório?";
export const size = tamanhoCompartilhamento;
export const contentType = "image/png";

export default function Image() {
  return imagemCompartilhamento(
    "Sua terra está em ordem no cartório?",
    "Medição, documentação e registro · Maringá e Ponta Grossa",
  );
}
