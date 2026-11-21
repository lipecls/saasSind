'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, obrigatorio, opcao, texto, textoOuNulo } from '@/lib/acao';
import { chaves, STATUS_ATENDIMENTO, TIPO_ATENDIMENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { comSequencial } from '@/lib/tenant';

export async function criarAtendimento(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const usuario = await usuarioAtual();
    const { sindicatoId } = usuario;
    const filiadoId = textoOuNulo(form, 'filiadoId');
    const solicitante = textoOuNulo(form, 'solicitante');
    if (!filiadoId && !solicitante) throw new ErroValidacao('Informe o filiado ou o nome do solicitante.');
    let empresaId = textoOuNulo(form, 'empresaId');
    if (filiadoId) {
      const f = await db.filiado.findFirst({ where: { id: filiadoId, sindicatoId } });
      if (!f) throw new ErroValidacao('Filiado não encontrado.');
      empresaId ??= f.empresaId;
    }
    if (empresaId && !(await db.empresa.findFirst({ where: { id: empresaId, sindicatoId } }))) throw new ErroValidacao('Empresa não encontrada.');
    const responsavelId = textoOuNulo(form, 'responsavelId') ?? usuario.id;
    if (!(await db.usuario.findFirst({ where: { id: responsavelId, sindicatoId } }))) throw new ErroValidacao('Responsável inválido.');

    const a = await comSequencial(
      async () => ((await db.atendimento.aggregate({ where: { sindicatoId }, _max: { protocolo: true } }))._max.protocolo ?? 0) + 1,
      (protocolo) =>
        db.atendimento.create({
          data: {
            sindicatoId,
            protocolo,
            tipo: opcao(form, 'tipo', chaves(TIPO_ATENDIMENTO)),
            assunto: obrigatorio(form, 'assunto', 'o assunto'),
            descricao: textoOuNulo(form, 'descricao'),
            filiadoId,
            solicitante: filiadoId ? null : solicitante,
            empresaId,
            responsavelId,
          },
        }),
    );
    revalidatePath('/atendimentos');
    redirect(`/atendimentos/${a.id}`);
  });
}

export async function registrarAndamento(atendimentoId: string, _: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const usuario = await usuarioAtual();
    const a = await db.atendimento.findFirst({ where: { id: atendimentoId, sindicatoId: usuario.sindicatoId } });
    if (!a) throw new ErroValidacao('Atendimento não encontrado.');
    const status = opcao(form, 'status', chaves(STATUS_ATENDIMENTO), a.status);
    const textoAndamento = texto(form, 'texto');
    const responsavelId = textoOuNulo(form, 'responsavelId') ?? a.responsavelId;
    if (responsavelId && !(await db.usuario.findFirst({ where: { id: responsavelId, sindicatoId: usuario.sindicatoId } }))) {
      throw new ErroValidacao('Responsável inválido.');
    }
    if (!textoAndamento && status === a.status && responsavelId === a.responsavelId) throw new ErroValidacao('Escreva o andamento ou altere a situação.');

    const mudancas: string[] = [];
    if (status !== a.status) mudancas.push(`Situação: ${STATUS_ATENDIMENTO[a.status]} → ${STATUS_ATENDIMENTO[status]}`);
    if (responsavelId !== a.responsavelId) mudancas.push('Responsável alterado');
    const finalizado = status === 'CONCLUIDO' || status === 'ARQUIVADO';

    await db.$transaction([
      db.atendimento.update({
        where: { id: a.id },
        data: { status, responsavelId, concluidoEm: finalizado ? (a.concluidoEm ?? new Date()) : null },
      }),
      db.andamentoAtendimento.create({
        data: { atendimentoId: a.id, autorId: usuario.id, texto: [textoAndamento, ...mudancas.map((m) => `[${m}]`)].filter(Boolean).join('\n') },
      }),
    ]);
    revalidatePath(`/atendimentos/${a.id}`);
    revalidatePath('/atendimentos');
    return { ok: 'Andamento registrado.' };
  });
}
