'use client';

export function BotaoImprimir({ rotulo = 'Imprimir' }: { rotulo?: string }) {
  return (
    <button className="btn btn-primario" onClick={() => window.print()}>
      {rotulo}
    </button>
  );
}
