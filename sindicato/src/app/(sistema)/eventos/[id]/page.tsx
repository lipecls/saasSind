import Link from 'next/link';
import { AreaTexto, Campo } from '@/components/Campos';
import { BotaoAcao, Form } from '@/components/Form';
import { Cabecalho, Cartao, Dados, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarDataHora } from '@/lib/formato';
import { TIPO_EVENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { registrarPresenca, removerPresenca, salvarAta } from '../acoes';

export default async function FichaEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const e = garantir(
    await db.evento.findFirst({
      where: { id, sindicatoId },
      include: { presencas: { include: { filiado: { select: { id: true, nome: true, matricula: true } } }, orderBy: { registradoEm: 'asc' } } },
    }),
  );
  const ativos = await db.filiado.count({ where: { sindicatoId, status: 'ATIVO' } });

  return (
    <>
      <Cabecalho titulo={e.titulo} subtitulo={`${TIPO_EVENTO[e.tipo]} · ${formatarDataHora(e.inicio)}`} voltar={{ href: '/eventos', rotulo: 'Eventos' }} />
      <div className="grade-2">
        <Cartao titulo="Dados">
          <Dados
            itens={[
              ['Início', formatarDataHora(e.inicio)],
              ['Término', e.fim ? formatarDataHora(e.fim) : null],
              ['Local', e.local],
              ['Presentes', `${e.presencas.length}${ativos ? ` (${Math.round((e.presencas.length / ativos) * 100)}% dos filiados ativos)` : ''}`],
            ]}
          />
          {e.descricao && (
            <>
              <h3>Pauta</h3>
              <div className="texto-longo">{e.descricao}</div>
            </>
          )}
        </Cartao>
        <Cartao titulo="Lista de presença">
          <Form acao={registrarPresenca.bind(null, id)} rotulo="Registrar presença">
            <div className="grade-campos">
              <Campo nome="identificacao" rotulo="Matrícula ou CPF" obrigatorio largura="cheia" autoFocus inputMode="numeric" />
            </div>
          </Form>
          {e.presencas.length === 0 ? (
            <Vazio>Nenhuma presença registrada.</Vazio>
          ) : (
            <table className="tabela">
              <tbody>
                {e.presencas.map((p, i) => (
                  <tr key={p.id}>
                    <td className="num">{i + 1}</td>
                    <td>
                      <Link href={`/filiados/${p.filiado.id}`}>{p.filiado.nome}</Link> <small>#{p.filiado.matricula}</small>
                    </td>
                    <td>
                      <small>{formatarDataHora(p.registradoEm)}</small>
                    </td>
                    <td className="acoes">
                      <BotaoAcao acao={removerPresenca} rotulo="Remover" variante="perigo" campos={{ id: p.id }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Cartao>
      </div>
      <Cartao titulo="Ata / deliberações">
        <Form acao={salvarAta.bind(null, id)} rotulo="Salvar ata">
          <div className="grade-campos">
            <AreaTexto nome="ata" rotulo="Registro das deliberações" linhas={10} padrao={e.ata} />
          </div>
        </Form>
      </Cartao>
    </>
  );
}
