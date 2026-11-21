// Rótulos em português para os enums do banco.

export const STATUS_FILIADO = {
  ATIVO: 'Ativo',
  AFASTADO: 'Afastado',
  APOSENTADO: 'Aposentado',
  DESFILIADO: 'Desfiliado',
} as const;

export const TIPO_CONVENCAO = {
  CCT: 'Convenção Coletiva (CCT)',
  ACT: 'Acordo Coletivo (ACT)',
} as const;

export const TIPO_COBRANCA = {
  MENSALIDADE: 'Mensalidade',
  CONTRIBUICAO_ASSISTENCIAL: 'Contribuição assistencial',
  CONTRIBUICAO_NEGOCIAL: 'Contribuição negocial',
  OUTRA: 'Outra',
} as const;

export const STATUS_COBRANCA = {
  PENDENTE: 'Pendente',
  PAGA: 'Paga',
  CANCELADA: 'Cancelada',
} as const;

export const TIPO_LANCAMENTO = { RECEITA: 'Receita', DESPESA: 'Despesa' } as const;

export const TIPO_ATENDIMENTO = {
  JURIDICO: 'Jurídico',
  HOMOLOGACAO: 'Homologação / rescisão',
  DENUNCIA: 'Denúncia',
  ORIENTACAO: 'Orientação',
  OUTRO: 'Outro',
} as const;

export const STATUS_ATENDIMENTO = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
} as const;

export const TIPO_EVENTO = {
  ASSEMBLEIA: 'Assembleia',
  REUNIAO: 'Reunião',
  CURSO: 'Curso / formação',
  EVENTO: 'Evento',
} as const;

export const PAPEL = { ADMIN: 'Administrador', OPERADOR: 'Operador' } as const;

export const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Dinheiro', 'Desconto em folha', 'Cartão', 'Transferência'];

export const CATEGORIAS_RECEITA = ['Mensalidades', 'Contribuições', 'Convênios', 'Eventos', 'Outras receitas'];
export const CATEGORIAS_DESPESA = [
  'Pessoal',
  'Aluguel e condomínio',
  'Jurídico',
  'Comunicação',
  'Eventos e assembleias',
  'Água, luz e telefone',
  'Impostos e taxas',
  'Outras despesas',
];

export const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export function chaves<T extends Record<string, string>>(obj: T) {
  return Object.keys(obj) as (keyof T & string)[];
}
