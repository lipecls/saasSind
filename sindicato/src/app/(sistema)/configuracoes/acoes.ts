'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, obrigatorio, opcao, texto, textoOuNulo } from '@/lib/acao';
import { paraCentavos } from '@/lib/formato';
import { chaves, PAPEL } from '@/lib/rotulos';
import { exigirAdmin, usuarioAtual } from '@/lib/sessao';

export async function salvarSindicato(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await exigirAdmin();
    const dia = Number(texto(form, 'diaVencimento'));
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) throw new ErroValidacao('Dia de vencimento deve estar entre 1 e 31.');
    await db.sindicato.update({
      where: { id: sindicatoId },
      data: {
        nome: obrigatorio(form, 'nome', 'o nome'),
        sigla: textoOuNulo(form, 'sigla'),
        categoria: textoOuNulo(form, 'categoria'),
        email: textoOuNulo(form, 'email'),
        telefone: textoOuNulo(form, 'telefone'),
        endereco: textoOuNulo(form, 'endereco'),
        cidade: textoOuNulo(form, 'cidade'),
        uf: textoOuNulo(form, 'uf'),
        mensalidadeCentavos: paraCentavos(texto(form, 'mensalidade')) ?? 0,
        diaVencimento: dia,
      },
    });
    revalidatePath('/', 'layout');
    return { ok: 'Dados do sindicato atualizados.' };
  });
}

export async function criarUsuario(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await exigirAdmin();
    const senha = texto(form, 'senha');
    if (senha.length < 8) throw new ErroValidacao('A senha deve ter pelo menos 8 caracteres.');
    await db.usuario.create({
      data: {
        sindicatoId,
        nome: obrigatorio(form, 'nome', 'o nome'),
        email: obrigatorio(form, 'email', 'o e-mail').toLowerCase(),
        senhaHash: await bcrypt.hash(senha, 10),
        papel: opcao(form, 'papel', chaves(PAPEL), 'OPERADOR'),
      },
    });
    revalidatePath('/configuracoes');
    return { ok: 'Usuário criado. Informe a senha inicial à pessoa.' };
  });
}

export async function alternarUsuario(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const admin = await exigirAdmin();
    const id = texto(form, 'id');
    if (id === admin.id) throw new ErroValidacao('Você não pode desativar a si mesmo.');
    const u = await db.usuario.findFirst({ where: { id, sindicatoId: admin.sindicatoId } });
    if (!u) throw new ErroValidacao('Usuário não encontrado.');
    await db.usuario.update({ where: { id }, data: { ativo: !u.ativo } });
    revalidatePath('/configuracoes');
  });
}

export async function trocarSenha(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const usuario = await usuarioAtual();
    if (!(await bcrypt.compare(texto(form, 'atual'), usuario.senhaHash))) throw new ErroValidacao('Senha atual incorreta.');
    const nova = texto(form, 'nova');
    if (nova.length < 8) throw new ErroValidacao('A nova senha deve ter pelo menos 8 caracteres.');
    await db.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await bcrypt.hash(nova, 10) } });
    return { ok: 'Senha alterada.' };
  });
}
