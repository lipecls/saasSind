// Utilitários de formatação e validação para o contexto brasileiro.

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

export function cpfValido(valor: string): boolean {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = dv(cpf.slice(0, 9), 10);
  const d2 = dv(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function cnpjValido(valor: string): boolean {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((acc, p, i) => acc + Number(base[i]) * p, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(cnpj.slice(0, 12)) === Number(cnpj[12]) && dv(cnpj.slice(0, 13)) === Number(cnpj[13]);
}

export function formatarCpf(valor: string | null | undefined): string {
  const d = somenteDigitos(valor);
  if (d.length !== 11) return valor ?? '';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatarCnpj(valor: string | null | undefined): string {
  const d = somenteDigitos(valor);
  if (d.length !== 14) return valor ?? '';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarMoeda(centavos: number | null | undefined): string {
  if (centavos == null) return '—';
  return moeda.format(centavos / 100);
}

/** Converte "1.234,56", "1234.56" ou "1234" em centavos. Retorna null se vazio/inválido. */
export function paraCentavos(valor: string | null | undefined): number | null {
  const texto = (valor ?? '').trim().replace(/[R$\s]/g, '');
  if (!texto) return null;
  const normalizado = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto;
  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(numero * 100);
}

/** Centavos para o formato usado em inputs ("1234,56"). */
export function centavosParaInput(centavos: number | null | undefined): string {
  if (centavos == null) return '';
  return (centavos / 100).toFixed(2).replace('.', ',');
}

/** Datas "só dia" são armazenadas ao meio-dia UTC para não mudarem de dia com fuso horário. */
export function paraData(valor: string | null | undefined): Date | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const data = new Date(`${valor}T12:00:00Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function dataParaInput(data: Date | null | undefined): string {
  return data ? data.toISOString().slice(0, 10) : '';
}

export function formatarData(data: Date | null | undefined): string {
  return data ? data.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';
}

export const FUSO = 'America/Sao_Paulo';

export function formatarDataHora(data: Date | null | undefined): string {
  return data
    ? data.toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' })
    : '—';
}

/** "2026-11-21T19:00" (horário de Brasília, de <input type=datetime-local>) → Date. */
export function paraDataHora(valor: string | null | undefined): Date | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const data = new Date(`${valor}:00-03:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function dataHoraParaInput(data: Date | null | undefined): string {
  if (!data) return '';
  return new Date(data.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16);
}

export function competenciaValida(valor: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

export function formatarCompetencia(valor: string): string {
  const [ano, mes] = valor.split('-');
  return `${mes}/${ano}`;
}

/** Data de vencimento de uma competência ("2026-11") no dia informado, limitado ao fim do mês. */
export function vencimentoDaCompetencia(competencia: string, dia: number): Date {
  const [ano, mes] = competencia.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes - 1, Math.min(Math.max(dia, 1), ultimoDia), 12));
}

export function competenciaAtual(agora = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit' }).formatToParts(agora);
  const ano = partes.find((p) => p.type === 'year')!.value;
  const mes = partes.find((p) => p.type === 'month')!.value;
  return `${ano}-${mes}`;
}

export function idade(nascimento: Date | null | undefined, hoje = new Date()): number | null {
  if (!nascimento) return null;
  let anos = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  const m = hoje.getUTCMonth() - nascimento.getUTCMonth();
  if (m < 0 || (m === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) anos--;
  return anos;
}

export function formatarCep(valor: string | null | undefined): string {
  const d = somenteDigitos(valor);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : (valor ?? '');
}
