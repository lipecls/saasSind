'use client';

import { startTransition, useActionState, useEffect, useRef } from 'react';
import type { EstadoAcao } from '@/lib/acao';

type Acao = (estado: EstadoAcao, form: FormData) => Promise<EstadoAcao>;

/**
 * Envia o formulário para a server action sem o reset automático do React 19
 * (que apagaria o que foi digitado quando há erro de validação). Só limpa em caso de sucesso.
 */
function useEnvio(acao: Acao, confirmar?: string) {
  const [estado, despachar, pendente] = useActionState(acao, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pendente || (confirmar && !window.confirm(confirmar))) return;
    const dados = new FormData(e.currentTarget);
    startTransition(() => despachar(dados));
  };
  return { estado, pendente, ref, onSubmit };
}

export function Form({
  acao,
  children,
  rotulo = 'Salvar',
  className,
  confirmar,
}: {
  acao: Acao;
  children?: React.ReactNode;
  rotulo?: string;
  className?: string;
  confirmar?: string;
}) {
  const { estado, pendente, ref, onSubmit } = useEnvio(acao, confirmar);
  return (
    <form ref={ref} onSubmit={onSubmit} className={className ?? 'form'}>
      {estado.erro && (
        <div className="alerta alerta-erro" role="alert">
          {estado.erro}
        </div>
      )}
      {estado.ok && (
        <div className="alerta alerta-ok" role="status">
          {estado.ok}
        </div>
      )}
      {children}
      <div className="form-acoes">
        <button type="submit" className="btn btn-primario" disabled={pendente}>
          {pendente ? 'Aguarde…' : rotulo}
        </button>
      </div>
    </form>
  );
}

/** Botão isolado que dispara uma ação (ex.: excluir, estornar). */
export function BotaoAcao({
  acao,
  rotulo,
  confirmar,
  variante = 'secundario',
  campos,
}: {
  acao: Acao;
  rotulo: string;
  confirmar?: string;
  variante?: 'secundario' | 'perigo' | 'primario';
  campos?: Record<string, string>;
}) {
  const { estado, pendente, ref, onSubmit } = useEnvio(acao, confirmar);
  return (
    <form ref={ref} onSubmit={onSubmit} className="form-inline">
      {campos && Object.entries(campos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className={`btn btn-${variante} btn-pequeno`} disabled={pendente}>
        {pendente ? '…' : rotulo}
      </button>
      {estado.erro && <span className="erro-inline">{estado.erro}</span>}
    </form>
  );
}
