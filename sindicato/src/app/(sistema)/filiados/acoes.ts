'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, obrigatorio, opcao, texto, textoOuNulo } from '@/lib/acao';
import { cpfValido, paraCentavos, paraData, somenteDigitos } from '@/lib/formato';
import { chaves, STATUS_FILIADO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { comSequencial } from '@/lib/tenant';

async function dadosFiliado(form: FormData, sindicatoId: string) {
  const cpf = somenteDigitos(obrigatorio(form, 'cpf', 'o CPF'));
  if (!cpfValido(cpf)) throw new ErroValidacao('CPF inválido.');
  const empresaId = textoOuNulo(form, 'empresaId');
  if (empresaId && !(await db.empresa.findFirst({ where: { id: empresaId, sindicatoId } }))) {
    throw new ErroValidacao('Empresa não encontrada.');
  }
  const status = opcao(form, 'status', chaves(STATUS_FILIADO), 'ATIVO');
  return {
    nome: obrigatorio(form, 'nome', 'o nome'),
    cpf,
    rg: textoOuNulo(form, 'rg'),
    dataNascimento: paraData(texto(form, 'dataNascimento')),
    email: textoOuNulo(form, 'email')?.toLowerCase() ?? null,
    telefone: textoOuNulo(form, 'telefone'),
    endereco: textoOuNulo(form, 'endereco'),
    cidade: textoOuNulo(form, 'cidade'),
    uf: textoOuNulo(form, 'uf'),
    cep: somenteDigitos(texto(form, 'cep')) || null,
    empresaId,
    cargo: textoOuNulo(form, 'cargo'),
    salarioCentavos: paraCentavos(texto(form, 'salario')),
    dataAdmissao: paraData(texto(form, 'dataAdmissao')),
    dataFiliacao: paraData(texto(form, 'dataFiliacao')) ?? new Date(),
    status,
    mensalidadeCentavos: paraCentavos(texto(form, 'mensalidade')),
    observacoes: textoOuNulo(form, 'observacoes'),
  };
}

export async function criarFiliado(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const dados = await dadosFiliado(form, sindicatoId);
    if (await db.filiado.findFirst({ where: { sindicatoId, cpf: dados.cpf } })) {
      throw new ErroValidacao('Já existe um filiado com este CPF.');
    }
    const filiado = await comSequencial(
      async () => ((await db.filiado.aggregate({ where: { sindicatoId }, _max: { matricula: true } }))._max.matricula ?? 0) + 1,
      (matricula) => db.filiado.create({ data: { ...dados, sindicatoId, matricula } }),
    );
    revalidatePath('/filiados');
    redirect(`/filiados/${filiado.id}`);
  });
}

export async function atualizarFiliado(id: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const atual = await db.filiado.findFirst({ where: { id, sindicatoId } });
    if (!atual) throw new ErroValidacao('Filiado não encontrado.');
    const dados = await dadosFiliado(form, sindicatoId);
    const desfiliando = dados.status === 'DESFILIADO' && atual.status !== 'DESFILIADO';
    await db.filiado.update({
      where: { id },
      data: {
        ...dados,
        dataDesfiliacao: dados.status === 'DESFILIADO' ? (desfiliando ? new Date() : atual.dataDesfiliacao) : null,
      },
    });
    revalidatePath('/filiados');
    redirect(`/filiados/${id}`);
  });
}

export async function adicionarDependente(filiadoId: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    if (!(await db.filiado.findFirst({ where: { id: filiadoId, sindicatoId } }))) throw new ErroValidacao('Filiado não encontrado.');
    const cpf = somenteDigitos(texto(form, 'cpf')) || null;
    if (cpf && !cpfValido(cpf)) throw new ErroValidacao('CPF do dependente inválido.');
    await db.dependente.create({
      data: {
        filiadoId,
        nome: obrigatorio(form, 'nome', 'o nome do dependente'),
        parentesco: obrigatorio(form, 'parentesco', 'o parentesco'),
        dataNascimento: paraData(texto(form, 'dataNascimento')),
        cpf,
      },
    });
    revalidatePath(`/filiados/${filiadoId}`);
    return { ok: 'Dependente adicionado.' };
  });
}

export async function removerDependente(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const { sindicatoId } = await usuarioAtual();
  const id = texto(form, 'id');
  const dep = await db.dependente.findFirst({ where: { id, filiado: { sindicatoId } } });
  if (!dep) return { erro: 'Dependente não encontrado.' };
  await db.dependente.delete({ where: { id } });
  revalidatePath(`/filiados/${dep.filiadoId}`);
  return {};
}
