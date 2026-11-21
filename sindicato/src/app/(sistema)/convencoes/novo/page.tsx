import { Cabecalho } from '@/components/Ui';
import { db } from '@/lib/db';
import { usuarioAtual } from '@/lib/sessao';
import { criarConvencao } from '../acoes';
import { FormConvencao } from '../FormConvencao';

export const metadata = { title: 'Nova convenção' };

export default async function NovaConvencao({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { sindicatoId } = await usuarioAtual();
  const { empresa } = await searchParams;
  const empresas = await db.empresa.findMany({ where: { sindicatoId }, select: { id: true, razaoSocial: true, nomeFantasia: true }, orderBy: { razaoSocial: 'asc' } });
  return (
    <>
      <Cabecalho titulo="Nova convenção / acordo coletivo" voltar={{ href: '/convencoes', rotulo: 'Convenções' }} />
      <FormConvencao acao={criarConvencao} empresas={empresas} empresaPadrao={empresa} />
    </>
  );
}
