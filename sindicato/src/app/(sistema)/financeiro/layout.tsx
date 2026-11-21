import Link from 'next/link';

export default function LayoutFinanceiro({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="abas">
        <Link href="/financeiro">Cobranças</Link>
        <Link href="/financeiro/gerar">Gerar cobranças</Link>
        <Link href="/financeiro/inadimplencia">Inadimplência</Link>
        <Link href="/financeiro/caixa">Caixa (receitas e despesas)</Link>
      </nav>
      {children}
    </>
  );
}
