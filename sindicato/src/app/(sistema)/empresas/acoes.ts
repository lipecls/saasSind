'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, inteiroOuNulo, obrigatorio, texto, textoOuNulo } from '@/lib/acao';
import { cnpjValido, somenteDigitos } from '@/lib/formato';
import { usuarioAtual } from '@/lib/sessao';

function dadosEmpresa(form: FormData) {
  const cnpj = somenteDigitos(obrigatorio(form, 'cnpj', 'o CNPJ'));
  if (!cnpjValido(cnpj)) throw new ErroValidacao('CNPJ inválido.');
  return {
    razaoSocial: obrigatorio(form, 'razaoSocial', 'a razão social'),
    nomeFantasia: textoOuNulo(form, 'nomeFantasia'),
    cnpj,
    email: textoOuNulo(form, 'email'),
    telefone: textoOuNulo(form, 'telefone'),
    contato: textoOuNulo(form, 'contato'),
    endereco: textoOuNulo(form, 'endereco'),
    cidade: textoOuNulo(form, 'cidade'),
    uf: textoOuNulo(form, 'uf'),
    numFuncionarios: inteiroOuNulo(form, 'numFuncionarios'),
    ativa: texto(form, 'ativa') !== 'nao',
  };
}

export async function criarEmpresa(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const empresa = await db.empresa.create({ data: { ...dadosEmpresa(form), sindicatoId } });
    revalidatePath('/empresas');
    redirect(`/empresas/${empresa.id}`);
  });
}

export async function atualizarEmpresa(id: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const r = await db.empresa.updateMany({ where: { id, sindicatoId }, data: dadosEmpresa(form) });
    if (r.count === 0) throw new ErroValidacao('Empresa não encontrada.');
    revalidatePath('/empresas');
    redirect(`/empresas/${id}`);
  });
}
