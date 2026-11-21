'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BotaoInstalar } from './App';
import { MARCA } from '@/lib/marca';
import { Menu } from './Menu';

const PRINCIPAIS = [
  { href: '/painel', rotulo: 'Painel', icone: '▦' },
  { href: '/filiados', rotulo: 'Filiados', icone: '👥' },
  { href: '/financeiro', rotulo: 'Financeiro', icone: '💰' },
  { href: '/atendimentos', rotulo: 'Atendim.', icone: '⚖️' },
];

/** Barra superior e barra inferior exibidas no celular (no computador fica o menu lateral). */
export function NavegacaoMovel({ titulo, admin, rodape }: { titulo: string; admin: boolean; rodape: React.ReactNode }) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  useEffect(() => setAberta(false), [caminho]);
  useEffect(() => {
    document.body.style.overflow = aberta ? 'hidden' : '';
  }, [aberta]);
  const naGaveta = !PRINCIPAIS.some((p) => caminho.startsWith(p.href));

  return (
    <>
      <header className="topo-movel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARCA.simbolo} alt="" className="simbolo" />
        <strong>{titulo}</strong>
      </header>

      <nav className="nav-inferior" aria-label="Navegação principal">
        {PRINCIPAIS.map((p) => (
          <Link key={p.href} href={p.href} className={caminho.startsWith(p.href) ? 'ativo' : ''}>
            <span aria-hidden>{p.icone}</span>
            {p.rotulo}
          </Link>
        ))}
        <button type="button" className={naGaveta || aberta ? 'ativo' : ''} onClick={() => setAberta(true)} aria-expanded={aberta}>
          <span aria-hidden>☰</span>
          Mais
        </button>
      </nav>

      {aberta && (
        <div className="gaveta-fundo" onClick={() => setAberta(false)}>
          <div
            className="gaveta"
            role="dialog"
            aria-label="Menu"
            onClick={(e) => {
              e.stopPropagation();
              // fecha na hora ao tocar num item do menu
              if ((e.target as HTMLElement).closest('a')) setAberta(false);
            }}
          >
            <div className="gaveta-topo">
              <strong>Menu</strong>
              <button type="button" className="btn btn-link" onClick={() => setAberta(false)}>
                Fechar ✕
              </button>
            </div>
            <Menu admin={admin} />
            <BotaoInstalar />
            <div className="usuario">{rodape}</div>
          </div>
        </div>
      )}
    </>
  );
}
