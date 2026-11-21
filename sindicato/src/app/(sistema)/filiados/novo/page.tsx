import { Cabecalho } from '@/components/Ui';
import { db } from '@/lib/db';
import { usuarioAtual } from '@/lib/sessao';
import { criarFiliado } from '../acoes';
import { FormFiliado } from '../FormFiliado';

export const metadata = { title: 'Novo filiado' };

export default async function NovoFiliado() {
  const { sindicatoId } = await usuarioAtual();
  const empresas = await db.empresa.findMany({
    where: { sindicatoId, ativa: true },
    select: { id: true, razaoSocial: true, nomeFantasia: true },
    orderBy: { razaoSocial: 'asc' },
  });
  return (
    <>
      <Cabecalho titulo="Novo filiado" voltar={{ href: '/filiados', rotulo: 'Filiados' }} />
      <FormFiliado acao={criarFiliado} empresas={empresas} />
    </>
  );
}
