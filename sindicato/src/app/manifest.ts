import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { MARCA } from '@/lib/marca';

// Gerado a cada acesso para usar o nome do sindicato cadastrado na instalação.
export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const sindicato = await db.sindicato.findFirst({ select: { nome: true, sigla: true } }).catch(() => null);
  return {
    id: '/',
    name: sindicato?.sigla ? `${sindicato.sigla} — Gestão` : MARCA.sigla,
    short_name: sindicato?.sigla || MARCA.sigla,
    description: 'Gestão do sindicato: filiados, financeiro, convenções, atendimentos e eventos.',
    lang: 'pt-BR',
    start_url: '/painel',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: MARCA.corFundo,
    theme_color: MARCA.corPrincipal,
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Filiados', url: '/filiados', icons: [{ src: '/icones/icone-192.png', sizes: '192x192' }] },
      { name: 'Novo atendimento', url: '/atendimentos/novo', icons: [{ src: '/icones/icone-192.png', sizes: '192x192' }] },
      { name: 'Cobranças', url: '/financeiro', icons: [{ src: '/icones/icone-192.png', sizes: '192x192' }] },
    ],
  };
}
