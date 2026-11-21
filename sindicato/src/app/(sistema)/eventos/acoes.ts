'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, obrigatorio, opcao, texto, textoOuNulo } from '@/lib/acao';
import { paraDataHora, somenteDigitos } from '@/lib/formato';
import { chaves, TIPO_EVENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

export async function criarEvento(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const inicio = paraDataHora(texto(form, 'inicio'));
    if (!inicio) throw new ErroValidacao('Informe data e hora de início.');
    const fim = paraDataHora(texto(form, 'fim'));
    if (fim && fim < inicio) throw new ErroValidacao('O término deve ser depois do início.');
    const e = await db.evento.create({
      data: {
        sindicatoId,
        tipo: opcao(form, 'tipo', chaves(TIPO_EVENTO)),
        titulo: obrigatorio(form, 'titulo', 'o título'),
        descricao: textoOuNulo(form, 'descricao'),
        local: textoOuNulo(form, 'local'),
        inicio,
        fim,
      },
    });
    revalidatePath('/eventos');
    redirect(`/eventos/${e.id}`);
  });
}

export async function salvarAta(eventoId: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const r = await db.evento.updateMany({ where: { id: eventoId, sindicatoId }, data: { ata: textoOuNulo(form, 'ata') } });
    if (r.count === 0) throw new ErroValidacao('Evento não encontrado.');
    revalidatePath(`/eventos/${eventoId}`);
    return { ok: 'Ata salva.' };
  });
}

/** Registra presença pela matrícula ou CPF do filiado. */
export async function registrarPresenca(eventoId: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    if (!(await db.evento.findFirst({ where: { id: eventoId, sindicatoId } }))) throw new ErroValidacao('Evento não encontrado.');
    const busca = somenteDigitos(obrigatorio(form, 'identificacao', 'a matrícula ou o CPF'));
    if (!busca) throw new ErroValidacao('Use apenas números (matrícula ou CPF).');
    const filiado = await db.filiado.findFirst({
      where: { sindicatoId, OR: [{ cpf: busca }, ...(busca.length <= 9 ? [{ matricula: Number(busca) }] : [])] },
    });
    if (!filiado) throw new ErroValidacao('Filiado não encontrado.');
    const ja = await db.presenca.findUnique({ where: { eventoId_filiadoId: { eventoId, filiadoId: filiado.id } } });
    if (ja) return { ok: `${filiado.nome} já estava registrado(a).` };
    await db.presenca.create({ data: { eventoId, filiadoId: filiado.id } });
    revalidatePath(`/eventos/${eventoId}`);
    return { ok: `Presença registrada: ${filiado.nome}${filiado.status !== 'ATIVO' ? ' (atenção: filiado não está ativo)' : ''}.` };
  });
}

export async function removerPresenca(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const { sindicatoId } = await usuarioAtual();
  const p = await db.presenca.findFirst({ where: { id: texto(form, 'id'), evento: { sindicatoId } } });
  if (!p) return { erro: 'Presença não encontrada.' };
  await db.presenca.delete({ where: { id: p.id } });
  revalidatePath(`/eventos/${p.eventoId}`);
  return {};
}
