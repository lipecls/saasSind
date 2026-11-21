import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from './db';
import { assinarSessao, COOKIE_SESSAO, DadosSessao, DURACAO_SESSAO_SEG, verificarSessao } from './sessao-token';

export async function iniciarSessao(dados: DadosSessao) {
  const token = await assinarSessao(dados);
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Ative (COOKIE_SECURE=true) quando o sistema for acessado por HTTPS.
    // Em rede local via http://IP, o navegador descartaria um cookie "secure" e o login não funcionaria.
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: DURACAO_SESSAO_SEG,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE_SESSAO);
}

/**
 * Usuário logado (revalidado no banco a cada requisição: usuário desativado perde o acesso).
 * Toda consulta de negócio deve filtrar por `usuario.sindicatoId`.
 */
export const usuarioAtual = cache(async () => {
  const dados = await verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!dados) redirect('/login');
  const usuario = await db.usuario.findUnique({
    where: { id: dados.usuarioId },
    include: { sindicato: true },
  });
  if (!usuario || !usuario.ativo || usuario.sindicatoId !== dados.sindicatoId) redirect('/login');
  return usuario;
});

export async function exigirAdmin() {
  const usuario = await usuarioAtual();
  if (usuario.papel !== 'ADMIN') redirect('/painel?erro=acesso');
  return usuario;
}
