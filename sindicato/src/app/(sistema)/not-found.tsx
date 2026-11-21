import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <div className="vazio">
      <h2>Registro não encontrado</h2>
      <p>Ele pode ter sido removido.</p>
      <Link href="/painel">Voltar ao painel</Link>
    </div>
  );
}
