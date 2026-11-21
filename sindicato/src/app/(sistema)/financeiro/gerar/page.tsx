import { Campo, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import { Cabecalho, Cartao } from '@/components/Ui';
import { db } from '@/lib/db';
import { competenciaAtual, formatarMoeda } from '@/lib/formato';
import { TIPO_COBRANCA } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { criarCobrancaAvulsa, gerarMensalidades } from '../acoes';

export const metadata = { title: 'Gerar cobranças' };

export default async function Gerar() {
  const { sindicatoId, sindicato } = await usuarioAtual();
  const [ativos, filiados, empresas] = await Promise.all([
    db.filiado.count({ where: { sindicatoId, status: 'ATIVO' } }),
    db.filiado.findMany({ where: { sindicatoId, status: { not: 'DESFILIADO' } }, select: { id: true, nome: true, matricula: true }, orderBy: { nome: 'asc' } }),
    db.empresa.findMany({ where: { sindicatoId }, select: { id: true, razaoSocial: true }, orderBy: { razaoSocial: 'asc' } }),
  ]);
  return (
    <>
      <Cabecalho titulo="Gerar cobranças" />
      <div className="grade-2">
        <Cartao titulo="Mensalidades do mês (em lote)">
          <p className="texto-apoio">
            Gera a mensalidade para os <strong>{ativos} filiados ativos</strong>, usando o valor individual de cada um ou o padrão do
            sindicato ({formatarMoeda(sindicato.mensalidadeCentavos)}). Quem já tem a mensalidade da competência não é cobrado de novo.
          </p>
          <Form acao={gerarMensalidades} rotulo="Gerar mensalidades">
            <div className="grade-campos">
              <Campo nome="competencia" rotulo="Competência" tipo="month" obrigatorio padrao={competenciaAtual()} />
              <Campo nome="diaVencimento" rotulo="Dia do vencimento" tipo="number" min={1} max={31} padrao={sindicato.diaVencimento} />
            </div>
          </Form>
        </Cartao>
        <Cartao titulo="Cobrança avulsa">
          <p className="texto-apoio">Contribuição assistencial/negocial, mensalidade retroativa ou outra cobrança a um filiado ou empresa.</p>
          <Form acao={criarCobrancaAvulsa} rotulo="Criar cobrança">
            <div className="grade-campos">
              <Selecao nome="tipo" rotulo="Tipo" opcoes={TIPO_COBRANCA} obrigatorio />
              <Campo nome="competencia" rotulo="Competência" tipo="month" obrigatorio padrao={competenciaAtual()} />
              <Selecao nome="filiadoId" rotulo="Filiado" vazio="—" largura="cheia" opcoes={filiados.map((f) => ({ valor: f.id, rotulo: `${f.nome} (#${f.matricula})` }))} />
              <Selecao nome="empresaId" rotulo="ou Empresa" vazio="—" largura="cheia" opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.razaoSocial }))} />
              <Campo nome="valor" rotulo="Valor (R$)" obrigatorio inputMode="decimal" />
              <Campo nome="vencimento" rotulo="Vencimento" tipo="date" obrigatorio />
              <Campo nome="descricao" rotulo="Descrição" largura="cheia" />
            </div>
          </Form>
        </Cartao>
      </div>
    </>
  );
}
