import type { Empresa, Filiado } from '@prisma/client';
import { AreaTexto, Campo, Grupo, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import type { EstadoAcao } from '@/lib/acao';
import { centavosParaInput, dataParaInput, formatarCpf } from '@/lib/formato';
import { STATUS_FILIADO, UFS } from '@/lib/rotulos';

export function FormFiliado({
  acao,
  filiado,
  empresas,
}: {
  acao: (e: EstadoAcao, f: FormData) => Promise<EstadoAcao>;
  filiado?: Filiado;
  empresas: Pick<Empresa, 'id' | 'razaoSocial' | 'nomeFantasia'>[];
}) {
  return (
    <Form acao={acao} rotulo={filiado ? 'Salvar alterações' : 'Cadastrar filiado'}>
      <Grupo titulo="Dados pessoais">
        <Campo nome="nome" rotulo="Nome completo" obrigatorio largura="cheia" padrao={filiado?.nome} />
        <Campo nome="cpf" rotulo="CPF" obrigatorio padrao={formatarCpf(filiado?.cpf)} placeholder="000.000.000-00" />
        <Campo nome="rg" rotulo="RG" padrao={filiado?.rg} />
        <Campo nome="dataNascimento" rotulo="Data de nascimento" tipo="date" padrao={dataParaInput(filiado?.dataNascimento)} />
        <Campo nome="email" rotulo="E-mail" tipo="email" padrao={filiado?.email} />
        <Campo nome="telefone" rotulo="Telefone / WhatsApp" padrao={filiado?.telefone} />
      </Grupo>
      <Grupo titulo="Endereço">
        <Campo nome="endereco" rotulo="Endereço" largura="cheia" padrao={filiado?.endereco} />
        <Campo nome="cidade" rotulo="Cidade" padrao={filiado?.cidade} />
        <Selecao nome="uf" rotulo="UF" opcoes={UFS} vazio="—" padrao={filiado?.uf} />
        <Campo nome="cep" rotulo="CEP" padrao={filiado?.cep} />
      </Grupo>
      <Grupo titulo="Vínculo profissional">
        <Selecao
          nome="empresaId"
          rotulo="Empresa"
          largura="cheia"
          vazio="— Sem empresa vinculada —"
          padrao={filiado?.empresaId}
          opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nomeFantasia || e.razaoSocial }))}
        />
        <Campo nome="cargo" rotulo="Cargo / função" padrao={filiado?.cargo} />
        <Campo nome="salario" rotulo="Salário (R$)" inputMode="decimal" padrao={centavosParaInput(filiado?.salarioCentavos)} />
        <Campo nome="dataAdmissao" rotulo="Data de admissão" tipo="date" padrao={dataParaInput(filiado?.dataAdmissao)} />
      </Grupo>
      <Grupo titulo="Filiação">
        <Campo
          nome="dataFiliacao"
          rotulo="Data de filiação"
          tipo="date"
          padrao={dataParaInput(filiado?.dataFiliacao ?? new Date())}
        />
        <Selecao nome="status" rotulo="Situação" opcoes={STATUS_FILIADO} padrao={filiado?.status ?? 'ATIVO'} />
        <Campo
          nome="mensalidade"
          rotulo="Mensalidade específica (R$)"
          inputMode="decimal"
          padrao={centavosParaInput(filiado?.mensalidadeCentavos)}
          dica="Deixe em branco para usar o valor padrão do sindicato"
        />
        <AreaTexto nome="observacoes" rotulo="Observações" padrao={filiado?.observacoes} linhas={3} />
      </Grupo>
    </Form>
  );
}
