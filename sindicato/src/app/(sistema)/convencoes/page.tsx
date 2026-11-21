import Link from 'next/link';
import { Cabecalho, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { MESES, situacaoConvencao } from '@/lib/convencoes';
import { formatarData, formatarMoeda } from '@/lib/formato';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Convenções e acordos' };

export default async function Convencoes() {
  const { sindicatoId } = await usuarioAtual();
  const convencoes = await db.convencao.findMany({
    where: { sindicatoId },
    include: { empresa: { select: { razaoSocial: true, nomeFantasia: true } } },
    orderBy: { vigenciaFim: 'desc' },
  });
  return (
    <>
      <Cabecalho
        titulo="Convenções e acordos coletivos"
        subtitulo="CCTs e ACTs, vigências, datas-base e pisos salariais"
        acoes={
          <Link href="/convencoes/novo" className="btn btn-primario">
            + Nova convenção / acordo
          </Link>
        }
      />
      {convencoes.length === 0 ? (
        <Vazio>Nenhuma convenção cadastrada.</Vazio>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Título</th>
                <th>Parte</th>
                <th>Vigência</th>
                <th>Data-base</th>
                <th className="num">Piso</th>
                <th className="num">Reajuste</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {convencoes.map((c) => {
                const s = situacaoConvencao(c);
                return (
                  <tr key={c.id}>
                    <td>{c.tipo}</td>
                    <td>
                      <Link href={`/convencoes/${c.id}`}>{c.titulo}</Link>
                    </td>
                    <td>{c.empresa ? c.empresa.nomeFantasia || c.empresa.razaoSocial : c.parteContraria ?? '—'}</td>
                    <td>
                      {formatarData(c.vigenciaInicio)} a {formatarData(c.vigenciaFim)}
                    </td>
                    <td>{c.mesDataBase ? MESES[c.mesDataBase - 1] : '—'}</td>
                    <td className="num">{formatarMoeda(c.pisoCentavos)}</td>
                    <td className="num">{c.reajustePercentual != null ? `${c.reajustePercentual.toLocaleString('pt-BR')}%` : '—'}</td>
                    <td>
                      <Etiqueta valor={s.chave}>{s.rotulo}</Etiqueta>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
