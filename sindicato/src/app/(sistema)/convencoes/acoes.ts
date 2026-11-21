'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, inteiroOuNulo, obrigatorio, opcao, texto, textoOuNulo } from '@/lib/acao';
import { paraCentavos, paraData } from '@/lib/formato';
import { chaves, TIPO_CONVENCAO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

async function dadosConvencao(form: FormData, sindicatoId: string) {
  const tipo = opcao(form, 'tipo', chaves(TIPO_CONVENCAO));
  const vigenciaInicio = paraData(texto(form, 'vigenciaInicio'));
  const vigenciaFim = paraData(texto(form, 'vigenciaFim'));
  if (!vigenciaInicio || !vigenciaFim) throw new ErroValidacao('Informe o período de vigência.');
  if (vigenciaFim <= vigenciaInicio) throw new ErroValidacao('O fim da vigência deve ser posterior ao início.');
  const empresaId = tipo === 'ACT' ? textoOuNulo(form, 'empresaId') : null;
  if (tipo === 'ACT' && !empresaId) throw new ErroValidacao('Acordo coletivo (ACT) exige a empresa signatária.');
  if (empresaId && !(await db.empresa.findFirst({ where: { id: empresaId, sindicatoId } }))) {
    throw new ErroValidacao('Empresa não encontrada.');
  }
  const mes = inteiroOuNulo(form, 'mesDataBase');
  if (mes != null && (mes < 1 || mes > 12)) throw new ErroValidacao('Mês da data-base inválido.');
  const reajuste = texto(form, 'reajustePercentual').replace(',', '.');
  return {
    tipo,
    titulo: obrigatorio(form, 'titulo', 'o título'),
    numeroRegistro: textoOuNulo(form, 'numeroRegistro'),
    parteContraria: tipo === 'CCT' ? textoOuNulo(form, 'parteContraria') : null,
    empresaId,
    vigenciaInicio,
    vigenciaFim,
    mesDataBase: mes,
    pisoCentavos: paraCentavos(texto(form, 'piso')),
    reajustePercentual: reajuste ? Number(reajuste) : null,
    clausulas: textoOuNulo(form, 'clausulas'),
  };
}

export async function criarConvencao(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const c = await db.convencao.create({ data: { ...(await dadosConvencao(form, sindicatoId)), sindicatoId } });
    revalidatePath('/convencoes');
    redirect(`/convencoes/${c.id}`);
  });
}

export async function atualizarConvencao(id: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const r = await db.convencao.updateMany({ where: { id, sindicatoId }, data: await dadosConvencao(form, sindicatoId) });
    if (r.count === 0) throw new ErroValidacao('Convenção não encontrada.');
    revalidatePath('/convencoes');
    redirect(`/convencoes/${id}`);
  });
}

export async function excluirConvencao(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const { sindicatoId } = await usuarioAtual();
  await db.convencao.deleteMany({ where: { id: texto(form, 'id'), sindicatoId } });
  revalidatePath('/convencoes');
  redirect('/convencoes');
}
