import Link from 'next/link';
import { Cabecalho, Cartao, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { DIAS_ALERTA_VENCIMENTO } from '@/lib/convencoes';
import { inicioDeHoje } from '@/lib/financeiro';
import { competenciaAtual, formatarCompetencia, formatarData, formatarDataHora, formatarMoeda } from '@/lib/formato';
import { STATUS_ATENDIMENTO, TIPO_EVENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Painel' };

export default async function Painel({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const usuario = await usuarioAtual();
  const { sindicatoId } = usuario;
  const { erro } = await searchParams;
  const agora = new Date();
  const hoje = inicioDeHoje();
  const comp = competenciaAtual();
  const [ano, mes] = comp.split('-').map(Number);
  const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
  const fimMes = new Date(Date.UTC(ano, mes, 1));
  const limiteConvencao = new Date(agora.getTime() + DIAS_ALERTA_VENCIMENTO * 86_400_000);

  const [porStatus, novosMes, emAtraso, inadimplentes, caixa, atendAbertos, meusAtend, eventos, convencoes, aniversariantes] = await Promise.all([
    db.filiado.groupBy({ by: ['status'], where: { sindicatoId }, _count: true }),
    db.filiado.count({ where: { sindicatoId, dataFiliacao: { gte: inicioMes, lt: fimMes } } }),
    db.cobranca.aggregate({ where: { sindicatoId, status: 'PENDENTE', vencimento: { lt: hoje } }, _sum: { valorCentavos: true } }),
    db.cobranca.findMany({ where: { sindicatoId, status: 'PENDENTE', vencimento: { lt: hoje }, filiadoId: { not: null } }, distinct: ['filiadoId'], select: { filiadoId: true } }),
    db.lancamento.groupBy({ by: ['tipo'], where: { sindicatoId, data: { gte: inicioMes, lt: fimMes } }, _sum: { valorCentavos: true } }),
    db.atendimento.count({ where: { sindicatoId, status: { in: ['ABERTO', 'EM_ANDAMENTO'] } } }),
    db.atendimento.findMany({
      where: { sindicatoId, responsavelId: usuario.id, status: { in: ['ABERTO', 'EM_ANDAMENTO'] } },
      orderBy: { abertoEm: 'asc' },
      take: 6,
      include: { filiado: { select: { nome: true } } },
    }),
    db.evento.findMany({ where: { sindicatoId, inicio: { gte: agora } }, orderBy: { inicio: 'asc' }, take: 5 }),
    db.convencao.findMany({ where: { sindicatoId, vigenciaFim: { gte: agora, lte: limiteConvencao } }, orderBy: { vigenciaFim: 'asc' } }),
    db.$queryRaw<{ id: string; nome: string; dia: number }[]>`
      SELECT id, nome, EXTRACT(DAY FROM "dataNascimento")::int AS dia
      FROM "Filiado"
      WHERE "sindicatoId" = ${sindicatoId} AND status = 'ATIVO'
        AND EXTRACT(MONTH FROM "dataNascimento") = ${mes}
      ORDER BY dia LIMIT 15`,
  ]);
  const qtd = (s: string) => porStatus.find((p) => p.status === s)?._count ?? 0;
  const receitas = caixa.find((c) => c.tipo === 'RECEITA')?._sum.valorCentavos ?? 0;
  const despesas = caixa.find((c) => c.tipo === 'DESPESA')?._sum.valorCentavos ?? 0;
  const ativos = qtd('ATIVO');

  return (
    <>
      <Cabecalho titulo={`Olá, ${usuario.nome.split(' ')[0]}`} subtitulo={usuario.sindicato.nome} />
      {erro === 'acesso' && <div className="alerta alerta-erro">Você não tem permissão para acessar aquela área.</div>}
      <div className="indicadores">
        <Link href="/filiados?status=ATIVO" className="indicador">
          <small>Filiados ativos</small>
          <strong>{ativos}</strong>
          <span>+{novosMes} neste mês</span>
        </Link>
        <Link href="/financeiro/inadimplencia" className="indicador indicador-alerta">
          <small>Inadimplência</small>
          <strong>{ativos ? Math.round((inadimplentes.length / ativos) * 100) : 0}%</strong>
          <span>
            {inadimplentes.length} filiado(s) · {formatarMoeda(emAtraso._sum.valorCentavos ?? 0)}
          </span>
        </Link>
        <Link href="/financeiro/caixa" className="indicador">
          <small>Resultado de {formatarCompetencia(comp)}</small>
          <strong className={receitas - despesas >= 0 ? 'positivo' : 'negativo'}>{formatarMoeda(receitas - despesas)}</strong>
          <span>
            Receitas {formatarMoeda(receitas)} · Despesas {formatarMoeda(despesas)}
          </span>
        </Link>
        <Link href="/atendimentos" className="indicador">
          <small>Atendimentos em aberto</small>
          <strong>{atendAbertos}</strong>
          <span>{meusAtend.length} sob sua responsabilidade</span>
        </Link>
      </div>

      <div className="grade-2">
        <Cartao titulo="Meus atendimentos" acoes={<Link href="/atendimentos?meus=1">Ver todos</Link>}>
          {meusAtend.length === 0 ? (
            <Vazio>Nada pendente com você.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {meusAtend.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/atendimentos/${a.id}`}>
                        #{a.protocolo} {a.assunto}
                      </Link>
                      <small className="bloco">
                        {a.filiado?.nome ?? a.solicitante} · desde {formatarData(a.abertoEm)}
                      </small>
                    </td>
                    <td>
                      <Etiqueta valor={a.status}>{STATUS_ATENDIMENTO[a.status]}</Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Cartao>
        <Cartao titulo="Próximos eventos" acoes={<Link href="/eventos/novo">+ Agendar</Link>}>
          {eventos.length === 0 ? (
            <Vazio>Nenhum evento agendado.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/eventos/${e.id}`}>{e.titulo}</Link>
                      <small className="bloco">
                        {TIPO_EVENTO[e.tipo]} · {e.local ?? 'local a definir'}
                      </small>
                    </td>
                    <td>{formatarDataHora(e.inicio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Cartao>
        <Cartao titulo={`Convenções vencendo em ${DIAS_ALERTA_VENCIMENTO} dias`}>
          {convencoes.length === 0 ? (
            <Vazio>Nenhuma convenção perto do vencimento.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {convencoes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/convencoes/${c.id}`}>{c.titulo}</Link>
                    </td>
                    <td>
                      <Etiqueta valor="A_VENCER">vence {formatarData(c.vigenciaFim)}</Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Cartao>
        <Cartao titulo="Aniversariantes do mês">
          {aniversariantes.length === 0 ? (
            <Vazio>Nenhum aniversariante.</Vazio>
          ) : (
            <ul className="lista-simples">
              {aniversariantes.map((a) => (
                <li key={a.id}>
                  <strong>{String(a.dia).padStart(2, '0')}</strong> <Link href={`/filiados/${a.id}`}>{a.nome}</Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  );
}
