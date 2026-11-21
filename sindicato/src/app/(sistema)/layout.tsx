import Link from 'next/link';
import { Menu } from '@/components/Menu';
import { usuarioAtual } from '@/lib/sessao';
import { PAPEL } from '@/lib/rotulos';
import { sair } from '../(publico)/acoes';

export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  return (
    <div className="sistema">
      <aside className="lateral">
        <div className="marca">
          <span className="logo">✊</span>
          <div>
            <strong>{usuario.sindicato.sigla || 'SindGestão'}</strong>
            <small>{usuario.sindicato.nome}</small>
          </div>
        </div>
        <Menu admin={usuario.papel === 'ADMIN'} />
        <div className="usuario">
          <Link href="/conta">
            <strong>{usuario.nome}</strong>
            <small>{PAPEL[usuario.papel]}</small>
          </Link>
          <form action={sair}>
            <button className="btn btn-link" type="submit">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  );
}
