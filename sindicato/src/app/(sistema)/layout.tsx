import Link from 'next/link';
import { Menu } from '@/components/Menu';
import { NavegacaoMovel } from '@/components/NavegacaoMovel';
import { usuarioAtual } from '@/lib/sessao';
import { PAPEL } from '@/lib/rotulos';
import { MARCA } from '@/lib/marca';
import { sair } from '../(publico)/acoes';

export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  const admin = usuario.papel === 'ADMIN';
  const rodape = (
    <>
      <Link href="/conta">
        <strong>{usuario.nome}</strong>
        <small>{PAPEL[usuario.papel]}</small>
      </Link>
      <form action={sair}>
        <button className="btn btn-link" type="submit">
          Sair
        </button>
      </form>
    </>
  );
  return (
    <div className="sistema">
      <aside className="lateral">
        <div className="marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARCA.simbolo} alt="" className="simbolo" />
          <div>
            <strong>{usuario.sindicato.sigla || MARCA.sigla}</strong>
            <small>{usuario.sindicato.nome}</small>
          </div>
        </div>
        <Menu admin={admin} />
        <div className="usuario">{rodape}</div>
      </aside>
      <NavegacaoMovel titulo={usuario.sindicato.sigla || usuario.sindicato.nome} admin={admin} rodape={rodape} />
      <main className="conteudo">{children}</main>
    </div>
  );
}
