// Assinatura/verificação do token de sessão (compatível com o runtime edge do middleware).
import { jwtVerify, SignJWT } from 'jose';

export const COOKIE_SESSAO = 'sind_sessao';
export const DURACAO_SESSAO_SEG = 60 * 60 * 12; // 12 horas

export type DadosSessao = {
  usuarioId: string;
  sindicatoId: string;
  papel: 'ADMIN' | 'OPERADOR';
};

function chave() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error('SESSION_SECRET ausente ou com menos de 32 caracteres');
  }
  return new TextEncoder().encode(segredo);
}

export async function assinarSessao(dados: DadosSessao): Promise<string> {
  return new SignJWT(dados)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_SEG}s`)
    .sign(chave());
}

export async function verificarSessao(token: string | undefined): Promise<DadosSessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ['HS256'] });
    if (typeof payload.usuarioId !== 'string' || typeof payload.sindicatoId !== 'string') return null;
    return {
      usuarioId: payload.usuarioId,
      sindicatoId: payload.sindicatoId,
      papel: payload.papel === 'ADMIN' ? 'ADMIN' : 'OPERADOR',
    };
  } catch {
    return null;
  }
}
