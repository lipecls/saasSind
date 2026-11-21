'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, obrigatorio, opcao, texto, textoOuNulo } from '@/lib/acao';
import { competenciaValida, formatarCompetencia, paraCentavos, paraData, vencimentoDaCompetencia } from '@/lib/formato';
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, chaves, TIPO_COBRANCA, TIPO_LANCAMENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

function revalidar() {
  revalidatePath('/financeiro', 'layout');
  revalidatePath('/painel');
}

/** Gera as mensalidades de uma competência para todos os filiados ativos que ainda não a possuem. */
export async function gerarMensalidades(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId, sindicato } = await usuarioAtual();
    const competencia = obrigatorio(form, 'competencia', 'a competência');
    if (!competenciaValida(competencia)) throw new ErroValidacao('Competência inválida (use AAAA-MM).');
    const dia = Number(texto(form, 'diaVencimento')) || sindicato.diaVencimento;
    const vencimento = vencimentoDaCompetencia(competencia, dia);

    const filiados = await db.filiado.findMany({
      where: {
        sindicatoId,
        status: 'ATIVO',
        cobrancas: { none: { tipo: 'MENSALIDADE', competencia } },
      },
      select: { id: true, mensalidadeCentavos: true },
    });
    const dados = filiados
      .map((f) => ({ filiadoId: f.id, valorCentavos: f.mensalidadeCentavos ?? sindicato.mensalidadeCentavos }))
      .filter((d) => d.valorCentavos > 0)
      .map((d) => ({ ...d, sindicatoId, competencia, vencimento, tipo: 'MENSALIDADE' as const }));
    const semValor = filiados.length - dados.length;
    if (dados.length) await db.cobranca.createMany({ data: dados });
    revalidar();
    return {
      ok:
        `${dados.length} mensalidade(s) gerada(s) para ${formatarCompetencia(competencia)}.` +
        (semValor ? ` ${semValor} filiado(s) ignorado(s) por não terem valor de mensalidade.` : ''),
    };
  });
}

export async function criarCobrancaAvulsa(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const tipo = opcao(form, 'tipo', chaves(TIPO_COBRANCA));
    const filiadoId = textoOuNulo(form, 'filiadoId');
    const empresaId = textoOuNulo(form, 'empresaId');
    if (!filiadoId && !empresaId) throw new ErroValidacao('Selecione o filiado ou a empresa devedora.');
    if (filiadoId && !(await db.filiado.findFirst({ where: { id: filiadoId, sindicatoId } }))) throw new ErroValidacao('Filiado não encontrado.');
    if (empresaId && !(await db.empresa.findFirst({ where: { id: empresaId, sindicatoId } }))) throw new ErroValidacao('Empresa não encontrada.');
    const competencia = obrigatorio(form, 'competencia', 'a competência');
    if (!competenciaValida(competencia)) throw new ErroValidacao('Competência inválida.');
    const valorCentavos = paraCentavos(texto(form, 'valor'));
    if (!valorCentavos) throw new ErroValidacao('Informe um valor maior que zero.');
    const vencimento = paraData(texto(form, 'vencimento'));
    if (!vencimento) throw new ErroValidacao('Informe o vencimento.');
    await db.cobranca.create({
      data: { sindicatoId, tipo, filiadoId, empresaId, competencia, valorCentavos, vencimento, descricao: textoOuNulo(form, 'descricao') },
    });
    revalidar();
    return { ok: 'Cobrança criada.' };
  });
}

/** Baixa uma cobrança e lança a receita no caixa, de forma atômica. */
export async function registrarPagamento(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const id = texto(form, 'id');
    const pagoEm = paraData(texto(form, 'pagoEm')) ?? new Date();
    const formaPagamento = textoOuNulo(form, 'formaPagamento');
    await db.$transaction(async (tx) => {
      const c = await tx.cobranca.findFirst({
        where: { id, sindicatoId },
        include: { filiado: { select: { nome: true } }, empresa: { select: { razaoSocial: true } } },
      });
      if (!c) throw new ErroValidacao('Cobrança não encontrada.');
      const valorPago = paraCentavos(texto(form, 'valorPago')) ?? c.valorCentavos;
      const baixa = await tx.cobranca.updateMany({
        where: { id, status: 'PENDENTE' },
        data: { status: 'PAGA', pagoEm, formaPagamento, valorPagoCentavos: valorPago },
      });
      if (baixa.count === 0) throw new ErroValidacao('Esta cobrança não está mais pendente.');
      await tx.lancamento.create({
        data: {
          sindicatoId,
          tipo: 'RECEITA',
          categoria: c.tipo === 'MENSALIDADE' ? 'Mensalidades' : 'Contribuições',
          descricao: `${TIPO_COBRANCA[c.tipo]} ${formatarCompetencia(c.competencia)} — ${c.filiado?.nome ?? c.empresa?.razaoSocial ?? ''}`,
          valorCentavos: valorPago,
          data: pagoEm,
          cobrancaId: c.id,
        },
      });
    });
    revalidar();
    return { ok: 'Pagamento registrado.' };
  });
}

/** Cancela uma cobrança pendente, ou estorna uma paga (remove a receita do caixa e volta a pendente). */
export async function cancelarCobranca(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const id = texto(form, 'id');
    const c = await db.cobranca.findFirst({ where: { id, sindicatoId } });
    if (!c) throw new ErroValidacao('Cobrança não encontrada.');
    if (c.status === 'PAGA') {
      await db.$transaction([
        db.lancamento.deleteMany({ where: { cobrancaId: id, sindicatoId } }),
        db.cobranca.update({ where: { id }, data: { status: 'PENDENTE', pagoEm: null, valorPagoCentavos: null, formaPagamento: null } }),
      ]);
    } else if (c.status === 'PENDENTE') {
      await db.cobranca.update({ where: { id }, data: { status: 'CANCELADA' } });
    } else {
      await db.cobranca.update({ where: { id }, data: { status: 'PENDENTE' } });
    }
    revalidar();
    return {};
  });
}

export async function criarLancamento(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    const { sindicatoId } = await usuarioAtual();
    const tipo = opcao(form, 'tipo', chaves(TIPO_LANCAMENTO));
    const categoria = obrigatorio(form, 'categoria', 'a categoria');
    const validas = tipo === 'RECEITA' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
    if (!validas.includes(categoria)) throw new ErroValidacao(`Categoria inválida para ${TIPO_LANCAMENTO[tipo].toLowerCase()}.`);
    const valorCentavos = paraCentavos(texto(form, 'valor'));
    if (!valorCentavos) throw new ErroValidacao('Informe um valor maior que zero.');
    await db.lancamento.create({
      data: {
        sindicatoId,
        tipo,
        categoria,
        descricao: obrigatorio(form, 'descricao', 'a descrição'),
        valorCentavos,
        data: paraData(texto(form, 'data')) ?? new Date(),
      },
    });
    revalidar();
    return { ok: 'Lançamento registrado.' };
  });
}

export async function excluirLancamento(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const { sindicatoId } = await usuarioAtual();
  // Lançamentos vindos de cobranças são removidos pelo estorno da cobrança.
  const r = await db.lancamento.deleteMany({ where: { id: texto(form, 'id'), sindicatoId, cobrancaId: null } });
  if (r.count === 0) return { erro: 'Não é possível excluir: estorne a cobrança correspondente.' };
  revalidar();
  return {};
}
