import type { Convencao } from '@prisma/client';

export const DIAS_ALERTA_VENCIMENTO = 90;

/** Situação de uma convenção/acordo em relação à vigência. */
export function situacaoConvencao(c: Pick<Convencao, 'vigenciaInicio' | 'vigenciaFim'>, agora = new Date()) {
  if (c.vigenciaFim < agora) return { chave: 'VENCIDA', rotulo: 'Vencida' } as const;
  if (c.vigenciaInicio > agora) return { chave: 'ABERTO', rotulo: 'Futura' } as const;
  const dias = Math.ceil((c.vigenciaFim.getTime() - agora.getTime()) / 86_400_000);
  if (dias <= DIAS_ALERTA_VENCIMENTO) return { chave: 'A_VENCER', rotulo: `Vence em ${dias} dia(s)` } as const;
  return { chave: 'VIGENTE', rotulo: 'Vigente' } as const;
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
