import { Cabecalho } from '@/components/Ui';
import { db } from '@/lib/db';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { atualizarEmpresa } from '../../acoes';
import { FormEmpresa } from '../../FormEmpresa';

export const metadata = { title: 'Editar empresa' };

export default async function EditarEmpresa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const empresa = garantir(await db.empresa.findFirst({ where: { id, sindicatoId } }));
  return (
    <>
      <Cabecalho titulo={`Editar: ${empresa.razaoSocial}`} voltar={{ href: `/empresas/${id}`, rotulo: 'Empresa' }} />
      <FormEmpresa acao={atualizarEmpresa.bind(null, id)} empresa={empresa} />
    </>
  );
}
