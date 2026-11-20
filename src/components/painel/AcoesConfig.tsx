"use client";

import { useActionState, useState } from "react";
import { apagarDemo, type EstadoForm, gerarDemo, sincronizarAgora } from "@/app/admin/acoes";
import { BotaoDemo } from "./BotaoDemo";
import { IconeCopiar } from "./icones";

function Resultado({ estado }: { estado: EstadoForm }) {
  return (
    <p aria-live="polite" className="min-h-5 text-[0.8125rem] font-medium">
      {estado?.erro && <span className="text-[#b42318]">{estado.erro}</span>}
      {estado?.ok && <span className="text-[#006300]">✓ {estado.ok}</span>}
    </p>
  );
}

const botao = "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[0.875rem] font-semibold transition-colors disabled:opacity-60";

export function BotaoSincronizar({ habilitado }: { habilitado: boolean }) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(sincronizarAgora, null);
  return (
    <form action={acao} className="flex flex-col items-start gap-2">
      <button type="submit" disabled={pendente || !habilitado} className={`${botao} bg-[#002448] text-white hover:bg-[#0a3262]`}>
        {pendente ? "Sincronizando…" : "Sincronizar agora"}
      </button>
      <Resultado estado={estado} />
    </form>
  );
}

export function ControlesDemo({ ativo, temDados }: { ativo: boolean; temDados: boolean }) {
  const [estadoGerar, gerar, gerando] = useActionState<EstadoForm, FormData>(gerarDemo, null);
  const [estadoApagar, apagar, apagando] = useActionState<EstadoForm, FormData>(apagarDemo, null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={gerar}>
          <button type="submit" disabled={gerando} className={`${botao} bg-[#cca85e] text-[#002448] hover:bg-[#e3c680]`}>
            {gerando ? "Gerando 90 dias…" : temDados ? "Gerar de novo" : "Gerar dados de demonstração"}
          </button>
        </form>
        {temDados && (
          <BotaoDemo ligar={!ativo} className={`${botao} border border-[#cdd5df] bg-white text-[#0a1f3f] hover:border-[#0a1f3f]`}>
            {ativo ? "Ver os dados reais" : "Ver a demonstração"}
          </BotaoDemo>
        )}
        {temDados && (
          <form action={apagar}>
            <button type="submit" disabled={apagando} className={`${botao} text-[#b42318] hover:bg-[#fdecea]`}>
              {apagando ? "Apagando…" : "Apagar demonstração"}
            </button>
          </form>
        )}
      </div>
      <Resultado estado={estadoGerar ?? estadoApagar} />
    </div>
  );
}

export function CopiarTexto({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <code className="block break-all rounded-xl border border-[#e1e6ee] bg-[#f6f8fb] px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-[#0a1f3f]">{texto}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
          } catch {
            setCopiado(false);
          }
        }}
        className={`${botao} self-start border border-[#cdd5df] bg-white text-[#0a1f3f] hover:border-[#0a1f3f]`}
      >
        <IconeCopiar className="mr-2 size-[18px]" />
        {copiado ? "Copiado" : rotulo}
      </button>
    </div>
  );
}
