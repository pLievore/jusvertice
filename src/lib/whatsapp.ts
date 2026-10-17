import { empresa, incluirCodigoNaMensagem, origens, type Origem } from "@/content/site";

export function whatsappUrl(texto: string, numero: string = empresa.whatsapp) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/**
 * Mensagem final enviada ao WhatsApp.
 * `extra` são linhas de contexto (ex.: respostas do checklist); `codigo` liga a conversa à campanha.
 */
export function montarMensagem(origem: Origem, extra?: string, codigo?: string | null) {
  let texto: string = origens[origem];
  if (extra) texto += `\n\n${extra}`;
  if (codigo && incluirCodigoNaMensagem) texto += `\n\nCódigo: ${codigo}`;
  return texto;
}
