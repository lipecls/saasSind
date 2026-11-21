import Link from 'next/link';
import { Cabecalho, Cartao, Dados, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarCnpj, formatarData } from '@/lib/formato';
import { STATUS_FILIADO, TIPO_CONVENCAO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { situacaoConvencao } from '@/lib/convencoes';

export default async function FichaEmpresa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const e = garantir(
    await db.empresa.findFirst({
      where: { id, sindicatoId },
      include: {
        filiados: { orderBy: { nome: 'asc' }, select: { id: true, nome: true, matricula: true, cargo: true, status: true } },
        convencoes: { orderBy: { vigenciaFim: 'desc' } },
        _count: { select: { atendimentos: true } },
      },
    }),
  );
  const ativos = e.filiados.filter((f) => f.status === 'ATIVO').length;

  return (
    <>
      <Cabecalho
        titulo={e.nomeFantasia || e.razaoSocial}
        subtitulo={`${e.razaoSocial} · CNPJ ${formatarCnpj(e.cnpj)}`}
        voltar={{ href: '/empresas', rotulo: 'Empresas' }}
        acoes={
          <Link href={`/empresas/${id}/editar`} className="btn btn-primario">
            Editar
          </Link>
        }
      />
      <div className="grade-2">
        <Cartao titulo="Dados">
          <Dados
            itens={[
              ['Situação', e.ativa ? 'Ativa' : 'Inativa'],
              ['Responsável (RH)', e.contato],
              ['E-mail', e.email],
              ['Telefone', e.telefone],
              ['Endereço', [e.endereco, e.cidade && `${e.cidade}/${e.uf ?? ''}`].filter(Boolean).join(' · ')],
            ]}
          />
        </Cartao>
        <Cartao titulo="Representação">
          <Dados
            itens={[
              ['Trabalhadores', e.numFuncionarios],
              ['Filiados ativos', ativos],
              ['Taxa de filiação', e.numFuncionarios ? `${Math.round((ativos / e.numFuncionarios) * 100)}%` : null],
              ['Atendimentos registrados', e._count.atendimentos],
            ]}
          />
        </Cartao>
      </div>
      <Cartao titulo="Acordos coletivos (ACT)" acoes={<Link href={`/convencoes/novo?empresa=${id}`}>+ Novo ACT</Link>}>
        {e.convencoes.length === 0 ? (
          <Vazio>Nenhum acordo coletivo específico com esta empresa.</Vazio>
        ) : (
          <table className="tabela">
            <tbody>
              {e.convencoes.map((c) => {
                const s = situacaoConvencao(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/convencoes/${c.id}`}>{c.titulo}</Link> <small>{TIPO_CONVENCAO[c.tipo]}</small>
                    </td>
                    <td>
                      {formatarData(c.vigenciaInicio)} a {formatarData(c.vigenciaFim)}
                    </td>
                    <td>
                      <Etiqueta valor={s.chave}>{s.rotulo}</Etiqueta>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Cartao>
      <Cartao titulo={`Filiados (${e.filiados.length})`}>
        {e.filiados.length === 0 ? (
          <Vazio>Nenhum filiado vinculado.</Vazio>
        ) : (
          <table className="tabela">
            <tbody>
              {e.filiados.map((f) => (
                <tr key={f.id}>
                  <td className="num">{f.matricula}</td>
                  <td>
                    <Link href={`/filiados/${f.id}`}>{f.nome}</Link>
                  </td>
                  <td>{f.cargo ?? '—'}</td>
                  <td>
                    <Etiqueta valor={f.status}>{STATUS_FILIADO[f.status]}</Etiqueta>
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
