import Link from 'next/link';

export function Cabecalho({
  titulo,
  subtitulo,
  acoes,
  voltar,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  acoes?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
}) {
  return (
    <header className="cabecalho">
      <div>
        {voltar && (
          <Link href={voltar.href} className="voltar">
            ← {voltar.rotulo}
          </Link>
        )}
        <h1>{titulo}</h1>
        {subtitulo && <p className="subtitulo">{subtitulo}</p>}
      </div>
      {acoes && <div className="cabecalho-acoes">{acoes}</div>}
    </header>
  );
}

const CORES: Record<string, string> = {
  ATIVO: 'verde',
  PAGA: 'verde',
  CONCLUIDO: 'verde',
  RECEITA: 'verde',
  VIGENTE: 'verde',
  PENDENTE: 'amarelo',
  EM_ANDAMENTO: 'amarelo',
  AFASTADO: 'amarelo',
  A_VENCER: 'amarelo',
  ABERTO: 'azul',
  APOSENTADO: 'azul',
  ATRASADA: 'vermelho',
  DESPESA: 'vermelho',
  VENCIDA: 'vermelho',
  DESFILIADO: 'cinza',
  CANCELADA: 'cinza',
  ARQUIVADO: 'cinza',
};

export function Etiqueta({ valor, children }: { valor: string; children: React.ReactNode }) {
  return <span className={`etiqueta etiqueta-${CORES[valor] ?? 'cinza'}`}>{children}</span>;
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <div className="vazio">{children}</div>;
}

export function Cartao({ titulo, children, acoes }: { titulo?: string; children: React.ReactNode; acoes?: React.ReactNode }) {
  return (
    <section className="cartao">
      {(titulo || acoes) && (
        <div className="cartao-topo">
          {titulo && <h2>{titulo}</h2>}
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}

export function Dados({ itens }: { itens: [string, React.ReactNode][] }) {
  return (
    <dl className="dados">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt>{rotulo}</dt>
          <dd>{valor || valor === 0 ? valor : '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Paginacao({ pagina, total, porPagina, params }: { pagina: number; total: number; porPagina: number; params: Record<string, string | undefined> }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  const link = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    sp.set('pagina', String(p));
    return `?${sp.toString()}`;
  };
  return (
    <nav className="paginacao">
      {pagina > 1 ? <Link href={link(pagina - 1)}>← Anterior</Link> : <span />}
      <span>
        Página {pagina} de {paginas} · {total} registros
      </span>
      {pagina < paginas ? <Link href={link(pagina + 1)}>Próxima →</Link> : <span />}
    </nav>
  );
}

export function paginaAtual(valor: string | undefined) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
