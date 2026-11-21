-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusFiliado" AS ENUM ('ATIVO', 'AFASTADO', 'APOSENTADO', 'DESFILIADO');

-- CreateEnum
CREATE TYPE "TipoConvencao" AS ENUM ('CCT', 'ACT');

-- CreateEnum
CREATE TYPE "TipoCobranca" AS ENUM ('MENSALIDADE', 'CONTRIBUICAO_ASSISTENCIAL', 'CONTRIBUICAO_NEGOCIAL', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusCobranca" AS ENUM ('PENDENTE', 'PAGA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('JURIDICO', 'HOMOLOGACAO', 'DENUNCIA', 'ORIENTACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('ASSEMBLEIA', 'REUNIAO', 'CURSO', 'EVENTO');

-- CreateTable
CREATE TABLE "Sindicato" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "cnpj" TEXT NOT NULL,
    "categoria" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "mensalidadeCentavos" INTEGER NOT NULL DEFAULT 0,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sindicato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "contato" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "numFuncionarios" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filiado" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "matricula" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "empresaId" TEXT,
    "cargo" TEXT,
    "salarioCentavos" INTEGER,
    "dataAdmissao" TIMESTAMP(3),
    "dataFiliacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataDesfiliacao" TIMESTAMP(3),
    "status" "StatusFiliado" NOT NULL DEFAULT 'ATIVO',
    "mensalidadeCentavos" INTEGER,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Filiado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependente" (
    "id" TEXT NOT NULL,
    "filiadoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "cpf" TEXT,

    CONSTRAINT "Dependente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convencao" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "tipo" "TipoConvencao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "numeroRegistro" TEXT,
    "parteContraria" TEXT,
    "empresaId" TEXT,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3) NOT NULL,
    "mesDataBase" INTEGER,
    "pisoCentavos" INTEGER,
    "reajustePercentual" DOUBLE PRECISION,
    "clausulas" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobranca" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "tipo" "TipoCobranca" NOT NULL DEFAULT 'MENSALIDADE',
    "filiadoId" TEXT,
    "empresaId" TEXT,
    "competencia" TEXT NOT NULL,
    "descricao" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "pagoEm" TIMESTAMP(3),
    "valorPagoCentavos" INTEGER,
    "formaPagamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "cobrancaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "protocolo" INTEGER NOT NULL,
    "tipo" "TipoAtendimento" NOT NULL,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'ABERTO',
    "filiadoId" TEXT,
    "solicitante" TEXT,
    "empresaId" TEXT,
    "responsavelId" TEXT,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AndamentoAtendimento" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "autorId" TEXT,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AndamentoAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "ata" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "filiadoId" TEXT NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comunicado" (
    "id" TEXT NOT NULL,
    "sindicatoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "autorId" TEXT,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sindicato_cnpj_key" ON "Sindicato"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_sindicatoId_idx" ON "Usuario"("sindicatoId");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_sindicatoId_cnpj_key" ON "Empresa"("sindicatoId", "cnpj");

-- CreateIndex
CREATE INDEX "Filiado_sindicatoId_status_idx" ON "Filiado"("sindicatoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Filiado_sindicatoId_matricula_key" ON "Filiado"("sindicatoId", "matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Filiado_sindicatoId_cpf_key" ON "Filiado"("sindicatoId", "cpf");

-- CreateIndex
CREATE INDEX "Convencao_sindicatoId_vigenciaFim_idx" ON "Convencao"("sindicatoId", "vigenciaFim");

-- CreateIndex
CREATE INDEX "Cobranca_sindicatoId_status_vencimento_idx" ON "Cobranca"("sindicatoId", "status", "vencimento");

-- CreateIndex
CREATE INDEX "Cobranca_sindicatoId_competencia_idx" ON "Cobranca"("sindicatoId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "Lancamento_cobrancaId_key" ON "Lancamento"("cobrancaId");

-- CreateIndex
CREATE INDEX "Lancamento_sindicatoId_data_idx" ON "Lancamento"("sindicatoId", "data");

-- CreateIndex
CREATE INDEX "Atendimento_sindicatoId_status_idx" ON "Atendimento"("sindicatoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Atendimento_sindicatoId_protocolo_key" ON "Atendimento"("sindicatoId", "protocolo");

-- CreateIndex
CREATE INDEX "Evento_sindicatoId_inicio_idx" ON "Evento"("sindicatoId", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "Presenca_eventoId_filiadoId_key" ON "Presenca"("eventoId", "filiadoId");

-- CreateIndex
CREATE INDEX "Comunicado_sindicatoId_publicadoEm_idx" ON "Comunicado"("sindicatoId", "publicadoEm");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filiado" ADD CONSTRAINT "Filiado_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filiado" ADD CONSTRAINT "Filiado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependente" ADD CONSTRAINT "Dependente_filiadoId_fkey" FOREIGN KEY ("filiadoId") REFERENCES "Filiado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convencao" ADD CONSTRAINT "Convencao_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convencao" ADD CONSTRAINT "Convencao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_filiadoId_fkey" FOREIGN KEY ("filiadoId") REFERENCES "Filiado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES "Cobranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_filiadoId_fkey" FOREIGN KEY ("filiadoId") REFERENCES "Filiado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AndamentoAtendimento" ADD CONSTRAINT "AndamentoAtendimento_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AndamentoAtendimento" ADD CONSTRAINT "AndamentoAtendimento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_filiadoId_fkey" FOREIGN KEY ("filiadoId") REFERENCES "Filiado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_sindicatoId_fkey" FOREIGN KEY ("sindicatoId") REFERENCES "Sindicato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
