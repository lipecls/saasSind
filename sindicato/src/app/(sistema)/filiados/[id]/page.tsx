import Link from 'next/link';
import { Campo } from '@/components/Campos';
import { BotaoAcao, Form } from '@/components/Form';
import { Cabecalho, Cartao, Dados, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import {
  formatarCep,
  formatarCompetencia,
  formatarCpf,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  idade,
} from '@/lib/formato';
import { STATUS_ATENDIMENTO, STATUS_COBRANCA, STATUS_FILIADO, TIPO_ATENDIMENTO, TIPO_COBRANCA } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { statusCobranca } from '@/lib/financeiro';
import { adicionarDependente, removerDependente } from '../acoes';

export default async function FichaFiliado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId, sindicato } = await usuarioAtual();
  const f = garantir(
    await db.filiado.findFirst({
      where: { id, sindicatoId },
      include: {
        empresa: true,
        dependentes: { orderBy: { nome: 'asc' } },
        cobrancas: { orderBy: { vencimento: 'desc' }, take: 12 },
        atendimentos: { orderBy: { abertoEm: 'desc' }, take: 10 },
        _count: { select: { presencas: true } },
      },
    }),
  );
  const emAberto = await db.cobranca.aggregate({
    where: { filiadoId: id, sindicatoId, status: 'PENDENTE', vencimento: { lt: new Date() } },
    _sum: { valorCentavos: true },
    _count: true,
  });

  return (
    <>
      <Cabecalho
        titulo={f.nome}
        subtitulo={
          <>
            Matrícula {f.matricula} · <Etiqueta valor={f.status}>{STATUS_FILIADO[f.status]}</Etiqueta>
            {emAberto._count > 0 && (
              <>
                {' '}
                · <Etiqueta valor="ATRASADA">{emAberto._count} em atraso ({formatarMoeda(emAberto._sum.valorCentavos)})</Etiqueta>
              </>
            )}
          </>
        }
        voltar={{ href: '/filiados', rotulo: 'Filiados' }}
        acoes={
          <>
            <Link href={`/filiados/${id}/carteirinha`} className="btn btn-secundario">
              Carteirinha
            </Link>
            <Link href={`/atendimentos/novo?filiado=${id}`} className="btn btn-secundario">
              Novo atendimento
            </Link>
            <Link href={`/filiados/${id}/editar`} className="btn btn-primario">
              Editar
            </Link>
          </>
        }
      />
      <div className="grade-2">
        <Cartao titulo="Dados pessoais">
          <Dados
            itens={[
              ['CPF', formatarCpf(f.cpf)],
              ['RG', f.rg],
              ['Nascimento', f.dataNascimento ? `${formatarData(f.dataNascimento)} (${idade(f.dataNascimento)} anos)` : null],
              ['E-mail', f.email],
              ['Telefone', f.telefone],
              ['Endereço', [f.endereco, f.cidade && `${f.cidade}/${f.uf ?? ''}`, formatarCep(f.cep)].filter(Boolean).join(' · ')],
            ]}
          />
        </Cartao>
        <Cartao titulo="Vínculo e filiação">
          <Dados
            itens={[
              ['Empresa', f.empresa ? <Link href={`/empresas/${f.empresa.id}`}>{f.empresa.nomeFantasia || f.empresa.razaoSocial}</Link> : null],
              ['Cargo', f.cargo],
              ['Salário', f.salarioCentavos != null ? formatarMoeda(f.salarioCentavos) : null],
              ['Admissão', f.dataAdmissao ? formatarData(f.dataAdmissao) : null],
              ['Filiação', formatarData(f.dataFiliacao)],
              ['Desfiliação', f.dataDesfiliacao ? formatarData(f.dataDesfiliacao) : null],
              ['Mensalidade', formatarMoeda(f.mensalidadeCentavos ?? sindicato.mensalidadeCentavos) + (f.mensalidadeCentavos == null ? ' (padrão)' : '')],
              ['Presenças em eventos', f._count.presencas],
            ]}
          />
          {f.observacoes && <p className="observacao">{f.observacoes}</p>}
        </Cartao>
      </div>

      <Cartao titulo={`Dependentes (${f.dependentes.length})`}>
        {f.dependentes.length > 0 && (
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Parentesco</th>
                <th>Nascimento</th>
                <th>CPF</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {f.dependentes.map((d) => (
                <tr key={d.id}>
                  <td>{d.nome}</td>
                  <td>{d.parentesco}</td>
                  <td>{formatarData(d.dataNascimento)}</td>
                  <td>{d.cpf ? formatarCpf(d.cpf) : '—'}</td>
                  <td className="acoes">
                    <BotaoAcao acao={removerDependente} rotulo="Remover" variante="perigo" campos={{ id: d.id }} confirmar={`Remover ${d.nome}?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <details className="expansivel">
          <summary>+ Adicionar dependente</summary>
          <Form acao={adicionarDependente.bind(null, id)} rotulo="Adicionar">
            <div className="grade-campos">
              <Campo nome="nome" rotulo="Nome" obrigatorio />
              <Campo nome="parentesco" rotulo="Parentesco" obrigatorio placeholder="Cônjuge, filho(a)…" />
              <Campo nome="dataNascimento" rotulo="Nascimento" tipo="date" />
              <Campo nome="cpf" rotulo="CPF" />
            </div>
          </Form>
        </details>
      </Cartao>

      <div className="grade-2">
        <Cartao titulo="Últimas cobranças" acoes={<Link href={`/financeiro?filiado=${id}`}>Ver todas</Link>}>
          {f.cobrancas.length === 0 ? (
            <Vazio>Sem cobranças.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {f.cobrancas.map((c) => {
                  const st = statusCobranca(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        {TIPO_COBRANCA[c.tipo]} {formatarCompetencia(c.competencia)}
                      </td>
                      <td className="num">{formatarMoeda(c.valorCentavos)}</td>
                      <td>
                        <Etiqueta valor={st}>{st === 'ATRASADA' ? 'Em atraso' : STATUS_COBRANCA[c.status]}</Etiqueta>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Cartao>
        <Cartao titulo="Atendimentos">
          {f.atendimentos.length === 0 ? (
            <Vazio>Nenhum atendimento.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {f.atendimentos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/atendimentos/${a.id}`}>
                        #{a.protocolo} {a.assunto}
                      </Link>
                      <br />
                      <small>
                        {TIPO_ATENDIMENTO[a.tipo]} · {formatarDataHora(a.abertoEm)}
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
      </div>
    </>
  );
}
