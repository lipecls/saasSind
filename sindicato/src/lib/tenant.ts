import 'server-only';
import { notFound } from 'next/navigation';

/** Garante que o registro existe (e já foi filtrado por sindicatoId); caso contrário, 404. */
export function garantir<T>(registro: T | null | undefined): T {
  if (!registro) notFound();
  return registro;
}

/**
 * Cria um registro com número sequencial por sindicato (matrícula, protocolo…),
 * tentando novamente em caso de colisão por concorrência.
 */
export async function comSequencial<T>(proximo: () => Promise<number>, criar: (n: number) => Promise<T>): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await criar(await proximo());
    } catch (e) {
      const colisao = typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002';
      if (!colisao || tentativa >= 4) throw e;
    }
  }
}
