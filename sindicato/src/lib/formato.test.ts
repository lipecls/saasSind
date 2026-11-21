import { describe, expect, it } from 'vitest';
import {
  cnpjValido,
  competenciaAtual,
  cpfValido,
  formatarCnpj,
  formatarCpf,
  paraCentavos,
  paraData,
  paraDataHora,
  vencimentoDaCompetencia,
} from './formato';

describe('CPF', () => {
  it('valida dígitos verificadores', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('52998224725')).toBe(true);
    expect(cpfValido('529.982.247-24')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(cpfValido('123')).toBe(false);
  });
  it('formata', () => expect(formatarCpf('52998224725')).toBe('529.982.247-25'));
});

describe('CNPJ', () => {
  it('valida dígitos verificadores', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11.222.333/0001-80')).toBe(false);
    expect(cnpjValido('00000000000000')).toBe(false);
  });
  it('formata', () => expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81'));
});

describe('paraCentavos', () => {
  it('aceita formatos brasileiros e internacionais', () => {
    expect(paraCentavos('1.234,56')).toBe(123456);
    expect(paraCentavos('R$ 45,90')).toBe(4590);
    expect(paraCentavos('1234.5')).toBe(123450);
    expect(paraCentavos('30')).toBe(3000);
  });
  it('rejeita vazio, negativo e texto', () => {
    expect(paraCentavos('')).toBeNull();
    expect(paraCentavos('-5')).toBeNull();
    expect(paraCentavos('abc')).toBeNull();
  });
});

describe('datas', () => {
  it('guarda datas ao meio-dia UTC', () => {
    expect(paraData('2026-02-28')?.toISOString()).toBe('2026-02-28T12:00:00.000Z');
    expect(paraData('28/02/2026')).toBeNull();
  });
  it('interpreta datetime-local como horário de Brasília', () => {
    expect(paraDataHora('2026-11-21T19:00')?.toISOString()).toBe('2026-11-21T22:00:00.000Z');
  });
  it('limita o vencimento ao último dia do mês', () => {
    expect(vencimentoDaCompetencia('2026-02', 31).toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(vencimentoDaCompetencia('2026-11', 10).toISOString().slice(0, 10)).toBe('2026-11-10');
  });
  it('competência atual usa o fuso de Brasília', () => {
    // 01/12 às 01h UTC ainda é 30/11 em Brasília
    expect(competenciaAtual(new Date('2026-12-01T01:00:00Z'))).toBe('2026-11');
  });
});
