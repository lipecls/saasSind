import { Campo, Selecao } from '@/components/Campos';
import { BotaoAcao, Form } from '@/components/Form';
import { Cabecalho, Cartao, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { competenciaAtual, competenciaValida, dataParaInput, formatarCompetencia, formatarData, formatarMoeda } from '@/lib/formato';
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, TIPO_LANCAMENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { criarLancamento, excluirLancamento } from '../acoes';

export const metadata = { title: 'Caixa' };

export default async function Caixa({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { sindicatoId } = await usuarioAtual();
  const { mes: mesParam } = await searchParams;
  const mes = mesParam && competenciaValida(mesParam) ? mesParam : competenciaAtual();
  const [ano, m] = mes.split('-').map(Number);
  const inicio = new Date(Date.UTC(ano, m - 1, 1));
  const fim = new Date(Date.UTC(ano, m, 1));

  const [lancamentos, porCategoria] = await Promise.all([
    db.lancamento.findMany({ where: { sindicatoId, data: { gte: inicio, lt: fim } }, orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }] }),
    db.lancamento.groupBy({ by: ['tipo', 'categoria'], where: { sindicatoId, data: { gte: inicio, lt: fim } }, _sum: { valorCentavos: true }, orderBy: { _sum: { valorCentavos: 'desc' } } }),
  ]);
  const soma = (t: 'RECEITA' | 'DESPESA') => lancamentos.filter((l) => l.tipo === t).reduce((s, l) => s + l.valorCentavos, 0);
  const receitas = soma('RECEITA');
  const despesas = soma('DESPESA');

  return (
    <>
      <Cabecalho titulo={`Caixa — ${formatarCompetencia(mes)}`} subtitulo="Receitas e despesas do sindicato" />
      <form className="filtros">
        <input type="month" name="mes" defaultValue={mes} />
        <button className="btn btn-secundario">Ver mês</button>
      </form>
      <div className="indicadores">
        <div className="indicador">
          <small>Receitas</small>
          <strong className="positivo">{formatarMoeda(receitas)}</strong>
        </div>
        <div className="indicador">
          <small>Despesas</small>
          <strong className="negativo">{formatarMoeda(despesas)}</strong>
        </div>
        <div className="indicador">
          <small>Resultado do mês</small>
          <strong className={receitas - despesas >= 0 ? 'positivo' : 'negativo'}>{formatarMoeda(receitas - despesas)}</strong>
        </div>
      </div>
      <div className="grade-2">
        <Cartao titulo="Novo lançamento">
          <Form acao={criarLancamento} rotulo="Lançar">
            <div className="grade-campos">
              <Selecao nome="tipo" rotulo="Tipo" opcoes={TIPO_LANCAMENTO} obrigatorio padrao="DESPESA" />
              <Selecao
                nome="categoria"
                rotulo="Categoria"
                obrigatorio
                opcoes={[...CATEGORIAS_DESPESA.map((c) => ({ valor: c, rotulo: `Despesa · ${c}` })), ...CATEGORIAS_RECEITA.map((c) => ({ valor: c, rotulo: `Receita · ${c}` }))]}
              />
              <Campo nome="descricao" rotulo="Descrição" obrigatorio largura="cheia" />
              <Campo nome="valor" rotulo="Valor (R$)" obrigatorio inputMode="decimal" />
              <Campo nome="data" rotulo="Data" tipo="date" padrao={dataParaInput(new Date())} />
            </div>
          </Form>
        </Cartao>
        <Cartao titulo="Por categoria">
          {porCategoria.length === 0 ? (
            <Vazio>Sem lançamentos no mês.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {porCategoria.map((g) => (
                  <tr key={g.tipo + g.categoria}>
                    <td>
                      <Etiqueta valor={g.tipo}>{TIPO_LANCAMENTO[g.tipo]}</Etiqueta> {g.categoria}
                    </td>
                    <td className="num">{formatarMoeda(g._sum.valorCentavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Cartao>
      </div>
      <Cartao titulo="Lançamentos">
        {lancamentos.length === 0 ? (
          <Vazio>Sem lançamentos no mês.</Vazio>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="num">Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td>{formatarData(l.data)}</td>
                  <td>{l.descricao}</td>
                  <td>{l.categoria}</td>
                  <td className={`num ${l.tipo === 'RECEITA' ? 'positivo' : 'negativo'}`}>
                    {l.tipo === 'DESPESA' ? '−' : ''}
                    {formatarMoeda(l.valorCentavos)}
                  </td>
                  <td className="acoes">
                    {l.cobrancaId ? (
                      <small>via cobrança</small>
                    ) : (
                      <BotaoAcao acao={excluirLancamento} rotulo="Excluir" variante="perigo" campos={{ id: l.id }} confirmar="Excluir este lançamento?" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Cartao>
    </>
  );
}
