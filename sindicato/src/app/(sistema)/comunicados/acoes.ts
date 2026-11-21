'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { EstadoAcao, executar, obrigatorio, texto } from '@/lib/acao';
import { usuarioAtual } from '@/lib/sessao';

export async function publicarComunicado(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const usuario = await usuarioAtual();
    await db.comunicado.create({
      data: {
        sindicatoId: usuario.sindicatoId,
        autorId: usuario.id,
        titulo: obrigatorio(form, 'titulo', 'o título'),
        conteudo: obrigatorio(form, 'conteudo', 'o conteúdo'),
      },
    });
    revalidatePath('/comunicados');
    revalidatePath('/painel');
    return { ok: 'Comunicado publicado.' };
  });
}

export async function excluirComunicado(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const { sindicatoId } = await usuarioAtual();
  await db.comunicado.deleteMany({ where: { id: texto(form, 'id'), sindicatoId } });
  revalidatePath('/comunicados');
  return {};
}
