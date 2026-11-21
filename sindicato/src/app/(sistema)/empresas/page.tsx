import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Cabecalho, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarCnpj, somenteDigitos } from '@/lib/formato';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Empresas' };

export default async function Empresas({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sindicatoId } = await usuarioAtual();
  const q = (await searchParams).q?.trim();
  const where: Prisma.EmpresaWhereInput = { sindicatoId };
  if (q) {
    const d = somenteDigitos(q);
    where.OR = [
      { razaoSocial: { contains: q, mode: 'insensitive' } },
      { nomeFantasia: { contains: q, mode: 'insensitive' } },
      ...(d ? [{ cnpj: { contains: d } }] : []),
    ];
  }
  const empresas = await db.empresa.findMany({
    where,
    orderBy: { razaoSocial: 'asc' },
    include: { _count: { select: { filiados: { where: { status: 'ATIVO' } } } } },
  });

  return (
    <>
      <Cabecalho
        titulo="Empresas da base"
        subtitulo="Empregadores da categoria representada"
        acoes={
          <Link href="/empresas/novo" className="btn btn-primario">
            + Nova empresa
          </Link>
        }
      />
      <form className="filtros">
        <input name="q" placeholder="Buscar por razão social, nome fantasia ou CNPJ" defaultValue={q} />
        <button className="btn btn-secundario">Buscar</button>
      </form>
      {empresas.length === 0 ? (
        <Vazio>Nenhuma empresa cadastrada.</Vazio>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th className="num">Trabalhadores</th>
                <th className="num">Filiados ativos</th>
                <th className="num">Taxa de filiação</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/empresas/${e.id}`}>{e.nomeFantasia || e.razaoSocial}</Link>
                    {e.nomeFantasia && <small className="bloco">{e.razaoSocial}</small>}
                  </td>
                  <td>{formatarCnpj(e.cnpj)}</td>
                  <td>{e.cidade ? `${e.cidade}/${e.uf ?? ''}` : '—'}</td>
                  <td className="num">{e.numFuncionarios ?? '—'}</td>
                  <td className="num">{e._count.filiados}</td>
                  <td className="num">
                    {e.numFuncionarios ? `${Math.round((e._count.filiados / e.numFuncionarios) * 100)}%` : '—'}
                  </td>
                  <td>
                    <Etiqueta valor={e.ativa ? 'ATIVO' : 'CANCELADA'}>{e.ativa ? 'Ativa' : 'Inativa'}</Etiqueta>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
