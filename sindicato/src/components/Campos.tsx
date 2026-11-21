// Campos de formulário padronizados.

type Base = { nome: string; rotulo: string; obrigatorio?: boolean; dica?: string; largura?: 'cheia' | 'meia' };

export function Campo({
  nome,
  rotulo,
  obrigatorio,
  dica,
  largura,
  tipo = 'text',
  padrao,
  ...resto
}: Base & { tipo?: string; padrao?: string | number | null } & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'name' | 'type' | 'defaultValue'
  >) {
  return (
    <label className={`campo ${largura === 'cheia' ? 'campo-cheio' : ''}`}>
      <span>
        {rotulo}
        {obrigatorio && <em>*</em>}
      </span>
      <input name={nome} type={tipo} required={obrigatorio} defaultValue={padrao ?? undefined} {...resto} />
      {dica && <small>{dica}</small>}
    </label>
  );
}

export function AreaTexto({ nome, rotulo, obrigatorio, dica, padrao, linhas = 4 }: Base & { padrao?: string | null; linhas?: number }) {
  return (
    <label className="campo campo-cheio">
      <span>
        {rotulo}
        {obrigatorio && <em>*</em>}
      </span>
      <textarea name={nome} required={obrigatorio} defaultValue={padrao ?? undefined} rows={linhas} />
      {dica && <small>{dica}</small>}
    </label>
  );
}

export function Selecao({
  nome,
  rotulo,
  obrigatorio,
  dica,
  largura,
  opcoes,
  padrao,
  vazio,
}: Base & {
  opcoes: { valor: string; rotulo: string }[] | Record<string, string> | string[];
  padrao?: string | null;
  vazio?: string;
}) {
  const lista = Array.isArray(opcoes)
    ? opcoes.map((o) => (typeof o === 'string' ? { valor: o, rotulo: o } : o))
    : Object.entries(opcoes).map(([valor, rotulo]) => ({ valor, rotulo }));
  return (
    <label className={`campo ${largura === 'cheia' ? 'campo-cheio' : ''}`}>
      <span>
        {rotulo}
        {obrigatorio && <em>*</em>}
      </span>
      <select name={nome} required={obrigatorio} defaultValue={padrao ?? ''}>
        {vazio !== undefined && <option value="">{vazio}</option>}
        {lista.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {dica && <small>{dica}</small>}
    </label>
  );
}

export function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="grupo">
      <legend>{titulo}</legend>
      <div className="grade-campos">{children}</div>
    </fieldset>
  );
}
