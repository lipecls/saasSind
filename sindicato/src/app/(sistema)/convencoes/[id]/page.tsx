import Link from 'next/link';
import { BotaoAcao } from '@/components/Form';
import { Cabecalho, Cartao, Dados, Etiqueta } from '@/components/Ui';
import { db } from '@/lib/db';
import { MESES, situacaoConvencao } from '@/lib/convencoes';
import { formatarData, formatarMoeda } from '@/lib/formato';
import { TIPO_CONVENCAO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { excluirConvencao } from '../acoes';

export default async function FichaConvencao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const c = garantir(await db.convencao.findFirst({ where: { id, sindicatoId }, include: { empresa: true } }));
  const s = situacaoConvencao(c);
  return (
    <>
      <Cabecalho
        titulo={c.titulo}
        subtitulo={
          <>
            {TIPO_CONVENCAO[c.tipo]} · <Etiqueta valor={s.chave}>{s.rotulo}</Etiqueta>
          </>
        }
        voltar={{ href: '/convencoes', rotulo: 'Convenções' }}
        acoes={
          <>
            <BotaoAcao acao={excluirConvencao} rotulo="Excluir" variante="perigo" campos={{ id }} confirmar="Excluir esta convenção?" />
            <Link href={`/convencoes/${id}/editar`} className="btn btn-primario">
              Editar
            </Link>
          </>
        }
      />
      <Cartao>
        <Dados
          itens={[
            ['Nº de registro', c.numeroRegistro],
            [c.tipo === 'ACT' ? 'Empresa' : 'Sindicato patronal', c.empresa ? <Link href={`/empresas/${c.empresa.id}`}>{c.empresa.razaoSocial}</Link> : c.parteContraria],
            ['Vigência', `${formatarData(c.vigenciaInicio)} a ${formatarData(c.vigenciaFim)}`],
            ['Data-base', c.mesDataBase ? MESES[c.mesDataBase - 1] : null],
            ['Piso salarial', c.pisoCentavos != null ? formatarMoeda(c.pisoCentavos) : null],
            ['Reajuste', c.reajustePercentual != null ? `${c.reajustePercentual.toLocaleString('pt-BR')}%` : null],
          ]}
        />
      </Cartao>
      {c.clausulas && (
        <Cartao titulo="Principais cláusulas">
          <div className="texto-longo">{c.clausulas}</div>
        </Cartao>
      )}
    </>
  );
}
