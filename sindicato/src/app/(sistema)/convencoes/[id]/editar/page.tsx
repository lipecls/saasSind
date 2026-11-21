import { Cabecalho } from '@/components/Ui';
import { db } from '@/lib/db';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { atualizarConvencao } from '../../acoes';
import { FormConvencao } from '../../FormConvencao';

export const metadata = { title: 'Editar convenção' };

export default async function EditarConvencao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const [convencao, empresas] = await Promise.all([
    db.convencao.findFirst({ where: { id, sindicatoId } }).then(garantir),
    db.empresa.findMany({ where: { sindicatoId }, select: { id: true, razaoSocial: true, nomeFantasia: true }, orderBy: { razaoSocial: 'asc' } }),
  ]);
  return (
    <>
      <Cabecalho titulo={`Editar: ${convencao.titulo}`} voltar={{ href: `/convencoes/${id}`, rotulo: 'Convenção' }} />
      <FormConvencao acao={atualizarConvencao.bind(null, id)} convencao={convencao} empresas={empresas} />
    </>
  );
}
