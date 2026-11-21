'use client';

import { useEffect, useState } from 'react';

/** Registra o service worker (exige HTTPS ou localhost; em http://IP o navegador não permite). */
export function RegistrarApp() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Botão "Instalar app": usa o convite nativo (Android/Chrome/Edge) ou mostra instruções (iPhone). */
export function BotaoInstalar() {
  const [convite, setConvite] = useState<EventoInstalar | null>(null);
  const [situacao, setSituacao] = useState<'carregando' | 'instalado' | 'ios' | 'nativo' | 'manual'>('carregando');
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return setSituacao('instalado');
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setSituacao(ios ? 'ios' : 'manual');
    const aoConvidar = (e: Event) => {
      e.preventDefault();
      setConvite(e as EventoInstalar);
      setSituacao('nativo');
    };
    const aoInstalar = () => setSituacao('instalado');
    window.addEventListener('beforeinstallprompt', aoConvidar);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoConvidar);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  if (situacao === 'carregando' || situacao === 'instalado') return null;

  const instalar = async () => {
    if (convite) {
      await convite.prompt();
      await convite.userChoice;
      setConvite(null);
    } else {
      setAjuda((a) => !a);
    }
  };

  return (
    <div className="instalar">
      <button type="button" className="btn btn-secundario btn-bloco" onClick={instalar}>
        📲 Instalar app no celular
      </button>
      {ajuda && (
        <div className="instalar-ajuda">
          {situacao === 'ios' ? (
            <>
              No Safari, toque em <strong>Compartilhar</strong> (quadrado com seta ↑) e depois em <strong>Adicionar à Tela de Início</strong>.
            </>
          ) : (
            <>
              No Chrome, toque no menu <strong>⋮</strong> e depois em <strong>Instalar app</strong> (ou <strong>Adicionar à tela inicial</strong>).
              {!window.isSecureContext && (
                <>
                  {' '}
                  Para abrir em tela cheia, como app, o sistema precisa estar em <strong>HTTPS</strong> (veja o guia de instalação).
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
