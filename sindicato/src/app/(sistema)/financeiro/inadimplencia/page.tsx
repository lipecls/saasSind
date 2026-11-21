import Link from 'next/link';
import { Cabecalho, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { inicioDeHoje } from '@/lib/financeiro';
import { formatarData, formatarMoeda } from '@/lib/formato';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Inadimplência' };

export default async function Inadimplencia() {
  const { sindicatoId } = await usuarioAtual();
  const hoje = inicioDeHoje();
  const grupos = await db.cobranca.groupBy({
    by: ['filiadoId'],
    where: { sindicatoId, status: 'PENDENTE', vencimento: { lt: hoje }, filiadoId: { not: null } },
    _sum: { valorCentavos: true },
    _count: true,
    _min: { vencimento: true },
    orderBy: { _sum: { valorCentavos: 'desc' } },
  });
  const filiados = await db.filiado.findMany({
    where: { id: { in: grupos.map((g) => g.filiadoId!) }, sindicatoId },
    select: { id: true, nome: true, matricula: true, telefone: true, email: true, empresa: { select: { razaoSocial: true } } },
  });
  const porId = new Map(filiados.map((f) => [f.id, f]));
  const total = grupos.reduce((s, g) => s + (g._sum.valorCentavos ?? 0), 0);

  return (
    <>
      <Cabecalho titulo="Inadimplência" subtitulo={`${grupos.length} filiado(s) com débitos em atraso · total ${formatarMoeda(total)}`} />
      {grupos.length === 0 ? (
        <Vazio>Nenhum filiado em atraso. 🎉</Vazio>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Filiado</th>
                <th>Empresa</th>
                <th>Contato</th>
                <th className="num">Parcelas</th>
                <th>Atraso desde</th>
                <th className="num">Total devido</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const f = porId.get(g.filiadoId!);
                if (!f) return null;
                return (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/financeiro?filiado=${f.id}&status=ATRASADA`}>
                        {f.nome} <small>#{f.matricula}</small>
                      </Link>
                    </td>
                    <td>{f.empresa?.razaoSocial ?? '—'}</td>
                    <td>{[f.telefone, f.email].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="num">{g._count}</td>
                    <td>{formatarData(g._min.vencimento)}</td>
                    <td className="num">{formatarMoeda(g._sum.valorCentavos)}</td>
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
