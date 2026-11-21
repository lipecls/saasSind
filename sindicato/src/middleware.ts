import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESSAO, verificarSessao } from './lib/sessao-token';

const ROTAS_PUBLICAS = ['/login', '/instalacao', '/api/saude'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publica = ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const sessao = await verificarSessao(req.cookies.get(COOKIE_SESSAO)?.value);

  if (!sessao && !publica) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('voltar', pathname);
    return NextResponse.redirect(url);
  }
  if (sessao && (publica || pathname === '/')) {
    return NextResponse.redirect(new URL('/painel', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)'],
};
