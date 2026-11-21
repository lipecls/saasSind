import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Cabecalho, Etiqueta, Paginacao, paginaAtual, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarCpf, formatarData, somenteDigitos } from '@/lib/formato';
import { chaves, STATUS_FILIADO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Filiados' };
const POR_PAGINA = 25;

type Busca = { q?: string; status?: string; empresa?: string; pagina?: string };

export default async function Filiados({ searchParams }: { searchParams: Promise<Busca> }) {
  const { sindicatoId } = await usuarioAtual();
  const params = await searchParams;
  const pagina = paginaAtual(params.pagina);
  const q = params.q?.trim();
  const digitos = somenteDigitos(q);

  const where: Prisma.FiliadoWhereInput = { sindicatoId };
  if (params.status && chaves(STATUS_FILIADO).includes(params.status as never)) where.status = params.status as never;
  if (params.empresa) where.empresaId = params.empresa;
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      ...(digitos ? [{ cpf: { contains: digitos } }] : []),
      ...(digitos && digitos.length <= 9 ? [{ matricula: Number(digitos) }] : []),
    ];
  }

  const [filiados, total, empresas] = await Promise.all([
    db.filiado.findMany({
      where,
      include: { empresa: { select: { razaoSocial: true, nomeFantasia: true } } },
      orderBy: { nome: 'asc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    db.filiado.count({ where }),
    db.empresa.findMany({ where: { sindicatoId }, select: { id: true, razaoSocial: true, nomeFantasia: true }, orderBy: { razaoSocial: 'asc' } }),
  ]);

  return (
    <>
      <Cabecalho
        titulo="Filiados"
        subtitulo={`${total} encontrado(s)`}
        acoes={
          <Link href="/filiados/novo" className="btn btn-primario">
            + Novo filiado
          </Link>
        }
      />
      <form className="filtros">
        <input name="q" placeholder="Buscar por nome, CPF ou matrícula" defaultValue={q} />
        <select name="status" defaultValue={params.status ?? ''}>
          <option value="">Todas as situações</option>
          {Object.entries(STATUS_FILIADO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <select name="empresa" defaultValue={params.empresa ?? ''}>
          <option value="">Todas as empresas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia || e.razaoSocial}
            </option>
          ))}
        </select>
        <button className="btn btn-secundario">Filtrar</button>
      </form>

      {filiados.length === 0 ? (
        <Vazio>Nenhum filiado encontrado.</Vazio>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Empresa</th>
                <th>Filiação</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {filiados.map((f) => (
                <tr key={f.id}>
                  <td className="num">{f.matricula}</td>
                  <td>
                    <Link href={`/filiados/${f.id}`}>{f.nome}</Link>
                  </td>
                  <td>{formatarCpf(f.cpf)}</td>
                  <td>{f.empresa ? f.empresa.nomeFantasia || f.empresa.razaoSocial : '—'}</td>
                  <td>{formatarData(f.dataFiliacao)}</td>
                  <td>
                    <Etiqueta valor={f.status}>{STATUS_FILIADO[f.status]}</Etiqueta>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} params={{ q, status: params.status, empresa: params.empresa }} />
    </>
  );
}
