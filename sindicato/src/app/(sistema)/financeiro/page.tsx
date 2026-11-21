import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Campo, Selecao } from '@/components/Campos';
import { BotaoAcao, Form } from '@/components/Form';
import { Cabecalho, Etiqueta, Paginacao, paginaAtual, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { inicioDeHoje, statusCobranca } from '@/lib/financeiro';
import { competenciaAtual, competenciaValida, dataParaInput, formatarCompetencia, formatarData, formatarMoeda } from '@/lib/formato';
import { chaves, FORMAS_PAGAMENTO, STATUS_COBRANCA, TIPO_COBRANCA } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { cancelarCobranca, registrarPagamento } from './acoes';

export const metadata = { title: 'Financeiro' };
const POR_PAGINA = 30;

type Busca = { status?: string; competencia?: string; tipo?: string; filiado?: string; pagina?: string };

export default async function Cobrancas({ searchParams }: { searchParams: Promise<Busca> }) {
  const { sindicatoId } = await usuarioAtual();
  const p = await searchParams;
  const pagina = paginaAtual(p.pagina);
  const hoje = inicioDeHoje();
  const compAtual = competenciaAtual();

  const where: Prisma.CobrancaWhereInput = { sindicatoId };
  if (p.status === 'ATRASADA') Object.assign(where, { status: 'PENDENTE', vencimento: { lt: hoje } });
  else if (chaves(STATUS_COBRANCA).includes(p.status as never)) where.status = p.status as never;
  if (p.competencia && competenciaValida(p.competencia)) where.competencia = p.competencia;
  if (chaves(TIPO_COBRANCA).includes(p.tipo as never)) where.tipo = p.tipo as never;
  if (p.filiado) where.filiadoId = p.filiado;

  const [cobrancas, total, resumo, atraso, filiadoFiltro] = await Promise.all([
    db.cobranca.findMany({
      where,
      include: { filiado: { select: { id: true, nome: true, matricula: true } }, empresa: { select: { id: true, razaoSocial: true } } },
      orderBy: [{ vencimento: 'desc' }, { filiado: { nome: 'asc' } }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    db.cobranca.count({ where }),
    db.cobranca.groupBy({ by: ['status'], where: { sindicatoId, competencia: compAtual }, _sum: { valorCentavos: true, valorPagoCentavos: true }, _count: true }),
    db.cobranca.aggregate({ where: { sindicatoId, status: 'PENDENTE', vencimento: { lt: hoje } }, _sum: { valorCentavos: true }, _count: true }),
    p.filiado ? db.filiado.findFirst({ where: { id: p.filiado, sindicatoId }, select: { nome: true } }) : null,
  ]);
  const doMes = (s: string) => resumo.find((r) => r.status === s);

  return (
    <>
      <Cabecalho
        titulo="Cobranças"
        subtitulo={filiadoFiltro ? `Filiado: ${filiadoFiltro.nome}` : 'Mensalidades e contribuições'}
        acoes={
          <Link href="/financeiro/gerar" className="btn btn-primario">
            + Gerar cobranças
          </Link>
        }
      />
      <div className="indicadores">
        <div className="indicador">
          <small>Recebido em {formatarCompetencia(compAtual)}</small>
          <strong>{formatarMoeda(doMes('PAGA')?._sum.valorPagoCentavos ?? 0)}</strong>
          <span>{doMes('PAGA')?._count ?? 0} cobrança(s)</span>
        </div>
        <div className="indicador">
          <small>A receber em {formatarCompetencia(compAtual)}</small>
          <strong>{formatarMoeda(doMes('PENDENTE')?._sum.valorCentavos ?? 0)}</strong>
          <span>{doMes('PENDENTE')?._count ?? 0} cobrança(s)</span>
        </div>
        <div className="indicador indicador-alerta">
          <small>Total em atraso</small>
          <strong>{formatarMoeda(atraso._sum.valorCentavos ?? 0)}</strong>
          <span>
            <Link href="/financeiro?status=ATRASADA">{atraso._count} cobrança(s)</Link>
          </span>
        </div>
      </div>

      <form className="filtros">
        {p.filiado && <input type="hidden" name="filiado" value={p.filiado} />}
        <select name="status" defaultValue={p.status ?? ''}>
          <option value="">Todas as situações</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="ATRASADA">Em atraso</option>
          <option value="PAGA">Pagas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
        <select name="tipo" defaultValue={p.tipo ?? ''}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_COBRANCA).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <input type="month" name="competencia" defaultValue={p.competencia} />
        <button className="btn btn-secundario">Filtrar</button>
        {(p.status || p.tipo || p.competencia || p.filiado) && <Link href="/financeiro">Limpar</Link>}
      </form>

      {cobrancas.length === 0 ? (
        <Vazio>Nenhuma cobrança encontrada.</Vazio>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Devedor</th>
                <th>Tipo</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th className="num">Valor</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cobrancas.map((c) => {
                const st = statusCobranca(c);
                return (
                  <tr key={c.id}>
                    <td>
                      {c.filiado ? (
                        <Link href={`/filiados/${c.filiado.id}`}>
                          {c.filiado.nome} <small>#{c.filiado.matricula}</small>
                        </Link>
                      ) : c.empresa ? (
                        <Link href={`/empresas/${c.empresa.id}`}>{c.empresa.razaoSocial}</Link>
                      ) : (
                        '—'
                      )}
                      {c.descricao && <small className="bloco">{c.descricao}</small>}
                    </td>
                    <td>{TIPO_COBRANCA[c.tipo]}</td>
                    <td>{formatarCompetencia(c.competencia)}</td>
                    <td>{formatarData(c.vencimento)}</td>
                    <td className="num">{formatarMoeda(c.valorCentavos)}</td>
                    <td>
                      <Etiqueta valor={st}>{st === 'ATRASADA' ? 'Em atraso' : STATUS_COBRANCA[c.status]}</Etiqueta>
                      {c.status === 'PAGA' && (
                        <small className="bloco">
                          {formatarData(c.pagoEm)} · {c.formaPagamento ?? ''}
                        </small>
                      )}
                    </td>
                    <td className="acoes">
                      {c.status === 'PENDENTE' && (
                        <details className="popover">
                          <summary className="btn btn-primario btn-pequeno">Receber</summary>
                          <div className="popover-corpo">
                            <Form acao={registrarPagamento} rotulo="Confirmar pagamento">
                              <input type="hidden" name="id" value={c.id} />
                              <div className="grade-campos">
                                <Campo nome="pagoEm" rotulo="Data" tipo="date" padrao={dataParaInput(new Date())} />
                                <Selecao nome="formaPagamento" rotulo="Forma" opcoes={FORMAS_PAGAMENTO} />
                                <Campo nome="valorPago" rotulo="Valor pago (R$)" inputMode="decimal" placeholder={(c.valorCentavos / 100).toFixed(2).replace('.', ',')} />
                              </div>
                            </Form>
                          </div>
                        </details>
                      )}
                      <BotaoAcao
                        acao={cancelarCobranca}
                        campos={{ id: c.id }}
                        rotulo={c.status === 'PAGA' ? 'Estornar' : c.status === 'PENDENTE' ? 'Cancelar' : 'Reabrir'}
                        confirmar={c.status === 'PAGA' ? 'Estornar o pagamento? A receita será removida do caixa.' : undefined}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} params={{ status: p.status, tipo: p.tipo, competencia: p.competencia, filiado: p.filiado }} />
    </>
  );
}
