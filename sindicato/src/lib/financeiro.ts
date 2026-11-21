import type { Cobranca } from '@prisma/client';

export type SituacaoCobranca = 'PENDENTE' | 'ATRASADA' | 'PAGA' | 'CANCELADA';

/** Pendente com vencimento anterior a hoje = em atraso (inadimplência). */
export function statusCobranca(c: Pick<Cobranca, 'status' | 'vencimento'>, agora = new Date()): SituacaoCobranca {
  if (c.status !== 'PENDENTE') return c.status;
  const hoje = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
  return c.vencimento < hoje ? 'ATRASADA' : 'PENDENTE';
}

/** Início do dia de hoje (UTC) — cobranças com vencimento antes disso estão em atraso. */
export function inicioDeHoje(agora = new Date()) {
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
}
