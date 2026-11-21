import type { Metadata, Viewport } from 'next';
import { RegistrarApp } from '@/components/App';
import { MARCA } from '@/lib/marca';
import './globals.css';

export const metadata: Metadata = {
  title: { default: MARCA.sigla, template: `%s · ${MARCA.sigla}` },
  description: `Sistema de gestão do ${MARCA.sigla}: filiados, financeiro, convenções, atendimentos e eventos.`,
  applicationName: MARCA.sigla,
  appleWebApp: { capable: true, title: MARCA.sigla, statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icones/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: MARCA.simbolo, type: 'image/svg+xml' },
    ],
    apple: '/icones/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: MARCA.corPrincipal,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <RegistrarApp />
      </body>
    </html>
  );
}
