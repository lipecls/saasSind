import { MARCA } from '@/lib/marca';

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <main className="publico">
      <div className="publico-marca">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARCA.logo} alt={`${MARCA.sigla} — ${MARCA.nome}`} width={900} height={665} />
      </div>
      {children}
    </main>
  );
}
