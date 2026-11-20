import Link from "next/link";

/** Esqueleto de carregamento: a mesma grade das telas, sem conteúdo (só na primeira abertura). */
export function EsqueletoPainel() {
  return (
    <div className="animate-pulse px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-56 rounded-lg bg-[#dfe5ee]" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/70" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-2xl bg-white/70 lg:col-span-2" />
        <div className="h-72 rounded-2xl bg-white/70" />
      </div>
    </div>
  );
}

/** Sem banco: o passo a passo para conectar o Neon na Vercel. */
export function SemBanco({ erro }: { erro: string | null }) {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="painel-cartao mx-auto max-w-2xl p-6 sm:p-8">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[#7e5f20]">Configuração</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold uppercase leading-none text-[#0a1f3f]">Conecte o banco de dados</h1>
        <p className="mt-3 text-[0.9375rem] text-[#4a5870]">
          O painel lê os eventos do site de um banco Postgres. Enquanto ele não existir, o site funciona normalmente, mas nada é guardado.
        </p>
        {erro && (
          <p className="mt-4 rounded-xl bg-[#fdecea] px-4 py-3 text-[0.875rem] text-[#b42318]" role="alert">
            O banco respondeu com erro: {erro}
          </p>
        )}
        <ol className="mt-6 flex flex-col gap-4 text-[0.9375rem] text-[#0a1f3f]">
          {[
            "Na Vercel, abra o projeto jusvertice › Storage › Create Database › Neon (plano gratuito).",
            "Conecte o banco ao projeto, nos ambientes Production e Preview. A Vercel cria a variável DATABASE_URL sozinha.",
            "Faça um novo deploy (Deployments › Redeploy). As tabelas são criadas no primeiro acesso.",
          ].map((passo, i) => (
            <li key={passo} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-[#002448] text-[0.8125rem] font-semibold">{i + 1}</span>
              <span className="pt-0.5">{passo}</span>
            </li>
          ))}
        </ol>
        <Link href="/admin/configuracao" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[#002448] px-5 font-semibold text-white">
          Ver a configuração completa
        </Link>
      </div>
    </div>
  );
}
