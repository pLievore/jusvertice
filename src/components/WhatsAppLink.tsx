"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Origem } from "@/content/site";
import { getCodigo, track } from "@/lib/tracking";
import { montarMensagem, whatsappUrl } from "@/lib/whatsapp";
import { ArrowRight, WhatsAppIcon } from "./icons";

const noop = () => () => {};

type Props = {
  origem: Origem;
  children: ReactNode;
  className?: string;
  /** Linhas extras de contexto na mensagem (ex.: respostas do checklist). */
  extra?: string;
  icon?: boolean;
  arrow?: boolean;
  id?: string;
};

/**
 * Link de WhatsApp com mensagem pré-preenchida por origem.
 * Sem JS funciona com a mensagem base; com JS acrescenta o código de atendimento e registra o clique.
 */
export function WhatsAppLink({ origem, children, className = "", extra, icon = true, arrow = false, id }: Props) {
  const codigo = useSyncExternalStore(noop, getCodigo, () => null);
  const href = whatsappUrl(montarMensagem(origem, extra, codigo));

  return (
    <a
      id={id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-origem={origem}
      onClick={() => track("whatsapp_click", { origem })}
    >
      {icon && <WhatsAppIcon size={20} className="shrink-0" />}
      <span>{children}</span>
      <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
      {arrow && <ArrowRight size={18} className="seta shrink-0" />}
    </a>
  );
}
