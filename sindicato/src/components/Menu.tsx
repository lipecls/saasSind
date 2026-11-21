'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS = [
  { href: '/painel', rotulo: 'Painel', icone: '▦' },
  { href: '/filiados', rotulo: 'Filiados', icone: '👥' },
  { href: '/empresas', rotulo: 'Empresas', icone: '🏢' },
  { href: '/convencoes', rotulo: 'Convenções', icone: '📜' },
  { href: '/financeiro', rotulo: 'Financeiro', icone: '💰' },
  { href: '/atendimentos', rotulo: 'Atendimentos', icone: '⚖️' },
  { href: '/eventos', rotulo: 'Eventos e assembleias', icone: '📅' },
  { href: '/comunicados', rotulo: 'Comunicados', icone: '📣' },
];

export function Menu({ admin }: { admin: boolean }) {
  const caminho = usePathname();
  const itens = admin ? [...ITENS, { href: '/configuracoes', rotulo: 'Configurações', icone: '⚙️' }] : ITENS;
  return (
    <nav className="menu">
      {itens.map((i) => (
        <Link key={i.href} href={i.href} className={caminho.startsWith(i.href) ? 'ativo' : ''}>
          <span aria-hidden>{i.icone}</span> {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}
