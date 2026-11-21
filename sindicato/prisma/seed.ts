// Popula o banco com um sindicato de demonstração.
// Uso: npm run db:seed  (login: admin@demo.org.br / sindicato123)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

// Gerador pseudoaleatório determinístico, para o seed ser reprodutível.
let semente = 42;
const aleatorio = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
const escolher = <T,>(lista: T[]) => lista[Math.floor(aleatorio() * lista.length)];
const entre = (min: number, max: number) => Math.floor(min + aleatorio() * (max - min + 1));

function digitosVerificadores(base: number[], pesos: (i: number, n: number) => number, mod: (s: number) => number) {
  const soma = base.reduce((acc, d, i) => acc + d * pesos(i, base.length), 0);
  return mod(soma);
}
function gerarCpf() {
  const b = Array.from({ length: 9 }, () => entre(0, 9));
  const mod = (s: number) => ((s * 10) % 11) % 10;
  b.push(digitosVerificadores(b, (i, n) => n + 1 - i, mod));
  b.push(digitosVerificadores(b, (i, n) => n + 1 - i, mod));
  return b.join('');
}
function gerarCnpj() {
  const b = [...Array.from({ length: 8 }, () => entre(0, 9)), 0, 0, 0, 1];
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, ...pesos1];
  const mod = (s: number) => (s % 11 < 2 ? 0 : 11 - (s % 11));
  b.push(digitosVerificadores(b, (i) => pesos1[i], mod));
  b.push(digitosVerificadores(b, (i) => pesos2[i], mod));
  return b.join('');
}
const dia = (ano: number, mes: number, d: number) => new Date(Date.UTC(ano, mes - 1, d, 12));
const competencia = (d: Date) => d.toISOString().slice(0, 7);

const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Juliana', 'Lucas', 'Mariana', 'Marcos', 'Natália', 'Otávio', 'Patrícia', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa', 'Wagner', 'Aline', 'Cláudio', 'Daniela', 'Fábio', 'Luciana', 'Rodrigo', 'Simone', 'Paulo'];
const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Gomes', 'Ribeiro', 'Martins', 'Araújo', 'Barbosa', 'Rocha'];
const CARGOS = ['Operador de caixa', 'Repositor', 'Vendedor', 'Estoquista', 'Fiscal de loja', 'Atendente', 'Auxiliar administrativo', 'Açougueiro', 'Padeiro', 'Gerente de setor'];

async function main() {
  const existente = await db.sindicato.findUnique({ where: { cnpj: '11222333000181' } });
  if (existente) {
    console.log('Removendo sindicato de demonstração anterior…');
    await db.sindicato.delete({ where: { id: existente.id } });
  }

  const sindicato = await db.sindicato.create({
    data: {
      nome: 'Sindicato dos Empregados no Comércio de Vila Nova',
      sigla: 'SECVN',
      cnpj: '11222333000181',
      categoria: 'Empregados no comércio varejista e atacadista',
      email: 'contato@demo.org.br',
      telefone: '(11) 3333-4444',
      endereco: 'Rua dos Trabalhadores, 100 — Centro',
      cidade: 'Vila Nova',
      uf: 'SP',
      mensalidadeCentavos: 3500,
      diaVencimento: 10,
    },
  });
  const senhaHash = await bcrypt.hash('sindicato123', 10);
  const admin = await db.usuario.create({ data: { sindicatoId: sindicato.id, nome: 'Maria Presidente', email: 'admin@demo.org.br', senhaHash, papel: 'ADMIN' } });
  const juridico = await db.usuario.create({ data: { sindicatoId: sindicato.id, nome: 'Dr. Carlos Advogado', email: 'juridico@demo.org.br', senhaHash, papel: 'OPERADOR' } });

  const nomesEmpresas = [
    ['Supermercados Bom Preço Ltda', 'Bom Preço', 180],
    ['Magazine Central S.A.', 'Magazine Central', 95],
    ['Atacadão Vila Nova Ltda', 'Atacadão VN', 140],
    ['Farmácias Saúde Já Ltda', 'Saúde Já', 45],
    ['Calçados Passo Firme ME', 'Passo Firme', 12],
  ] as const;
  const empresas = [];
  for (const [razaoSocial, nomeFantasia, numFuncionarios] of nomesEmpresas) {
    empresas.push(
      await db.empresa.create({
        data: { sindicatoId: sindicato.id, razaoSocial, nomeFantasia, numFuncionarios, cnpj: gerarCnpj(), cidade: 'Vila Nova', uf: 'SP', contato: `RH ${nomeFantasia}`, telefone: `(11) 9${entre(1000, 9999)}-${entre(1000, 9999)}` },
      }),
    );
  }

  const hoje = new Date();
  const filiados = [];
  for (let i = 1; i <= 80; i++) {
    const nome = `${escolher(NOMES)} ${escolher(SOBRENOMES)} ${escolher(SOBRENOMES)}`;
    const status = i % 17 === 0 ? 'DESFILIADO' : i % 23 === 0 ? 'AFASTADO' : i % 29 === 0 ? 'APOSENTADO' : 'ATIVO';
    const filiacao = dia(hoje.getUTCFullYear() - entre(0, 8), entre(1, 12), entre(1, 28));
    filiados.push(
      await db.filiado.create({
        data: {
          sindicatoId: sindicato.id,
          matricula: i,
          nome,
          cpf: gerarCpf(),
          dataNascimento: dia(entre(1965, 2004), i === 1 ? hoje.getUTCMonth() + 1 : entre(1, 12), entre(1, 28)),
          email: `${nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}${i}@email.com`,
          telefone: `(11) 9${entre(1000, 9999)}-${entre(1000, 9999)}`,
          cidade: 'Vila Nova',
          uf: 'SP',
          empresaId: escolher(empresas).id,
          cargo: escolher(CARGOS),
          salarioCentavos: entre(1800, 4500) * 100,
          dataAdmissao: filiacao,
          dataFiliacao: filiacao,
          status,
          dataDesfiliacao: status === 'DESFILIADO' ? dia(hoje.getUTCFullYear(), 1, 15) : null,
          mensalidadeCentavos: i % 10 === 0 ? 2000 : null,
        },
      }),
    );
  }
  await db.dependente.createMany({
    data: filiados.slice(0, 20).map((f, i) => ({ filiadoId: f.id, nome: `${escolher(NOMES)} ${f.nome.split(' ').at(-1)}`, parentesco: i % 2 ? 'Filho(a)' : 'Cônjuge', dataNascimento: dia(entre(1975, 2020), entre(1, 12), entre(1, 28)) })),
  });

  // Mensalidades dos últimos 4 meses (a atual inclusive), com parte em atraso.
  const ativos = filiados.filter((f) => f.status === 'ATIVO');
  for (let m = 3; m >= 0; m--) {
    const ref = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - m, 10, 12));
    const comp = competencia(ref);
    for (const f of ativos) {
      const valor = f.mensalidadeCentavos ?? sindicato.mensalidadeCentavos;
      const vencida = ref < hoje;
      const paga = vencida ? aleatorio() > (m === 0 ? 0.35 : 0.12) : aleatorio() > 0.8;
      const pagoEm = new Date(ref.getTime() - entre(0, 5) * 86_400_000);
      const c = await db.cobranca.create({
        data: {
          sindicatoId: sindicato.id, filiadoId: f.id, tipo: 'MENSALIDADE', competencia: comp, valorCentavos: valor, vencimento: ref,
          ...(paga ? { status: 'PAGA', pagoEm, valorPagoCentavos: valor, formaPagamento: escolher(['PIX', 'Desconto em folha', 'Boleto']) } : {}),
        },
      });
      if (paga) {
        await db.lancamento.create({
          data: { sindicatoId: sindicato.id, tipo: 'RECEITA', categoria: 'Mensalidades', descricao: `Mensalidade ${comp.slice(5)}/${comp.slice(0, 4)} — ${f.nome}`, valorCentavos: valor, data: pagoEm, cobrancaId: c.id },
        });
      }
    }
    for (const [categoria, descricao, valor] of [
      ['Aluguel e condomínio', 'Aluguel da sede', 450000],
      ['Pessoal', 'Folha de pagamento — funcionários da sede', 1200000],
      ['Água, luz e telefone', 'Contas de consumo', 85000],
      ['Jurídico', 'Custas processuais', entre(20000, 90000)],
    ] as const) {
      await db.lancamento.create({ data: { sindicatoId: sindicato.id, tipo: 'DESPESA', categoria, descricao, valorCentavos: valor, data: new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 5, 12)) } });
    }
  }
  // Contribuição negocial cobrada de uma empresa
  await db.cobranca.create({ data: { sindicatoId: sindicato.id, empresaId: empresas[0].id, tipo: 'CONTRIBUICAO_NEGOCIAL', competencia: competencia(hoje), valorCentavos: 540000, vencimento: dia(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 28), descricao: 'Contribuição negocial — CCT vigente' } });

  const ano = hoje.getUTCFullYear();
  await db.convencao.create({
    data: {
      sindicatoId: sindicato.id, tipo: 'CCT', titulo: `CCT ${ano}/${ano + 1} — Comércio Varejista`, numeroRegistro: `SP00${entre(1000, 9999)}/${ano}`,
      parteContraria: 'Sindicato do Comércio Varejista de Vila Nova (patronal)',
      vigenciaInicio: new Date(hoje.getTime() - 300 * 86_400_000), vigenciaFim: new Date(hoje.getTime() + 65 * 86_400_000),
      mesDataBase: 1, pisoCentavos: 196000, reajustePercentual: 5.8,
      clausulas: '• Piso salarial: R$ 1.960,00\n• Reajuste de 5,8% sobre salários de dezembro\n• Vale-alimentação: R$ 450,00/mês\n• Horas extras: adicional de 60%\n• Trabalho em feriados mediante acordo e folga compensatória\n• Estabilidade pré-aposentadoria: 24 meses',
    },
  });
  await db.convencao.create({
    data: {
      sindicatoId: sindicato.id, tipo: 'ACT', titulo: `ACT Banco de Horas — ${empresas[0].nomeFantasia}`, empresaId: empresas[0].id,
      vigenciaInicio: dia(ano, 3, 1), vigenciaFim: dia(ano + 1, 2, 28), reajustePercentual: null,
      clausulas: 'Banco de horas com compensação em até 6 meses; limite de 2h extras diárias.',
    },
  });
  await db.convencao.create({
    data: { sindicatoId: sindicato.id, tipo: 'CCT', titulo: `CCT ${ano - 1}/${ano} — Comércio Varejista`, vigenciaInicio: dia(ano - 2, 1, 1), vigenciaFim: dia(ano - 1, 12, 31), mesDataBase: 1, pisoCentavos: 185000, reajustePercentual: 4.5 },
  });

  const assuntos = [
    ['JURIDICO', 'Horas extras não pagas'], ['HOMOLOGACAO', 'Conferência de rescisão'], ['DENUNCIA', 'Assédio moral na loja'],
    ['ORIENTACAO', 'Dúvida sobre férias'], ['JURIDICO', 'Desvio de função'], ['HOMOLOGACAO', 'Cálculo de verbas rescisórias'],
    ['ORIENTACAO', 'Direito a vale-alimentação'], ['DENUNCIA', 'Falta de EPI no açougue'],
  ] as const;
  for (let i = 0; i < assuntos.length; i++) {
    const [tipo, assunto] = assuntos[i];
    const f = escolher(ativos);
    const status = (['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'EM_ANDAMENTO'] as const)[i % 4];
    const abertoEm = new Date(hoje.getTime() - entre(1, 60) * 86_400_000);
    await db.atendimento.create({
      data: {
        sindicatoId: sindicato.id, protocolo: i + 1, tipo, assunto, filiadoId: f.id, empresaId: f.empresaId, status, abertoEm,
        responsavelId: tipo === 'JURIDICO' || tipo === 'HOMOLOGACAO' ? juridico.id : admin.id,
        descricao: `Trabalhador(a) relata: ${assunto.toLowerCase()}.`,
        concluidoEm: status === 'CONCLUIDO' ? new Date(abertoEm.getTime() + 5 * 86_400_000) : null,
        andamentos: status === 'ABERTO' ? undefined : { create: [{ autorId: juridico.id, texto: 'Documentos recebidos e em análise.', criadoEm: new Date(abertoEm.getTime() + 86_400_000) }] },
      },
    });
  }

  const assembleia = await db.evento.create({
    data: {
      sindicatoId: sindicato.id, tipo: 'ASSEMBLEIA', titulo: 'Assembleia geral — prestação de contas', local: 'Sede do sindicato',
      inicio: new Date(hoje.getTime() - 20 * 86_400_000), descricao: '1. Prestação de contas do semestre\n2. Informes da diretoria',
      ata: 'Contas aprovadas por unanimidade dos presentes.',
    },
  });
  await db.presenca.createMany({ data: ativos.slice(0, 27).map((f) => ({ eventoId: assembleia.id, filiadoId: f.id })) });
  await db.evento.create({
    data: {
      sindicatoId: sindicato.id, tipo: 'ASSEMBLEIA', titulo: `Assembleia — pauta de reivindicações ${ano + 1}`, local: 'Sede do sindicato',
      inicio: new Date(hoje.getTime() + 12 * 86_400_000), descricao: '1. Aprovação da pauta de reivindicações\n2. Contribuição negocial\n3. Calendário da campanha salarial',
    },
  });
  await db.evento.create({ data: { sindicatoId: sindicato.id, tipo: 'CURSO', titulo: 'Curso de formação sindical', local: 'Auditório', inicio: new Date(hoje.getTime() + 25 * 86_400_000) } });
  await db.comunicado.create({ data: { sindicatoId: sindicato.id, autorId: admin.id, titulo: 'Campanha salarial começou!', conteudo: 'Participe da assembleia e ajude a construir a pauta de reivindicações.' } });

  console.log(`Sindicato de demonstração criado: ${filiados.length} filiados, ${empresas.length} empresas.`);
  console.log('Login: admin@demo.org.br / sindicato123  (operador: juridico@demo.org.br)');
}

main().finally(() => db.$disconnect());
