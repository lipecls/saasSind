import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'SindGestão', template: '%s · SindGestão' },
  description: 'Gestão de sindicatos de trabalhadores: filiados, financeiro, convenções, atendimentos e eventos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
