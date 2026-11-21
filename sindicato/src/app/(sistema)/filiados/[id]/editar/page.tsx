import { Cabecalho } from '@/components/Ui';
import { db } from '@/lib/db';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { atualizarFiliado } from '../../acoes';
import { FormFiliado } from '../../FormFiliado';

export const metadata = { title: 'Editar filiado' };

export default async function EditarFiliado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const [filiado, empresas] = await Promise.all([
    db.filiado.findFirst({ where: { id, sindicatoId } }).then(garantir),
    db.empresa.findMany({ where: { sindicatoId }, select: { id: true, razaoSocial: true, nomeFantasia: true }, orderBy: { razaoSocial: 'asc' } }),
  ]);
  return (
    <>
      <Cabecalho titulo={`Editar: ${filiado.nome}`} voltar={{ href: `/filiados/${id}`, rotulo: 'Ficha do filiado' }} />
      <FormFiliado acao={atualizarFiliado.bind(null, id)} filiado={filiado} empresas={empresas} />
    </>
  );
}
