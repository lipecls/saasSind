// Apoio às server actions: leitura de formulários e retorno de erros para o usuário.

export type EstadoAcao = { erro?: string; ok?: string };

export class ErroValidacao extends Error {}

export function texto(form: FormData, campo: string): string {
  const v = form.get(campo);
  return typeof v === 'string' ? v.trim() : '';
}

export function textoOuNulo(form: FormData, campo: string): string | null {
  return texto(form, campo) || null;
}

export function obrigatorio(form: FormData, campo: string, rotulo: string): string {
  const v = texto(form, campo);
  if (!v) throw new ErroValidacao(`Informe ${rotulo}.`);
  return v;
}

export function inteiroOuNulo(form: FormData, campo: string): number | null {
  const v = texto(form, campo);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new ErroValidacao(`Valor inválido em "${campo}".`);
  return n;
}

export function opcao<T extends string>(form: FormData, campo: string, validas: readonly T[], padrao?: T): T {
  const v = texto(form, campo) as T;
  if (validas.includes(v)) return v;
  if (padrao) return padrao;
  throw new ErroValidacao(`Opção inválida em "${campo}".`);
}

/** Executa a ação convertendo erros de validação/unicidade em mensagens amigáveis. */
export async function executar(fn: () => Promise<EstadoAcao | void>): Promise<EstadoAcao> {
  try {
    return (await fn()) ?? {};
  } catch (e) {
    if (e instanceof ErroValidacao) return { erro: e.message };
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      return { erro: 'Já existe um registro com esses dados (CPF, CNPJ ou e-mail duplicado).' };
    }
    throw e; // inclui redirect() do Next, que precisa propagar
  }
}
