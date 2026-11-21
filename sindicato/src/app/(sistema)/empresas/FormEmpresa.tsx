import type { Empresa } from '@prisma/client';
import { Campo, Grupo, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import type { EstadoAcao } from '@/lib/acao';
import { formatarCnpj } from '@/lib/formato';
import { UFS } from '@/lib/rotulos';

export function FormEmpresa({ acao, empresa }: { acao: (e: EstadoAcao, f: FormData) => Promise<EstadoAcao>; empresa?: Empresa }) {
  return (
    <Form acao={acao} rotulo={empresa ? 'Salvar alterações' : 'Cadastrar empresa'}>
      <Grupo titulo="Identificação">
        <Campo nome="razaoSocial" rotulo="Razão social" obrigatorio largura="cheia" padrao={empresa?.razaoSocial} />
        <Campo nome="nomeFantasia" rotulo="Nome fantasia" padrao={empresa?.nomeFantasia} />
        <Campo nome="cnpj" rotulo="CNPJ" obrigatorio padrao={formatarCnpj(empresa?.cnpj)} placeholder="00.000.000/0000-00" />
        <Campo nome="numFuncionarios" rotulo="Nº de trabalhadores" tipo="number" min={0} padrao={empresa?.numFuncionarios} />
        <Selecao nome="ativa" rotulo="Situação" opcoes={{ sim: 'Ativa', nao: 'Inativa' }} padrao={empresa?.ativa === false ? 'nao' : 'sim'} />
      </Grupo>
      <Grupo titulo="Contato">
        <Campo nome="contato" rotulo="Responsável (RH)" padrao={empresa?.contato} />
        <Campo nome="email" rotulo="E-mail" tipo="email" padrao={empresa?.email} />
        <Campo nome="telefone" rotulo="Telefone" padrao={empresa?.telefone} />
        <Campo nome="endereco" rotulo="Endereço" largura="cheia" padrao={empresa?.endereco} />
        <Campo nome="cidade" rotulo="Cidade" padrao={empresa?.cidade} />
        <Selecao nome="uf" rotulo="UF" opcoes={UFS} vazio="—" padrao={empresa?.uf} />
      </Grupo>
    </Form>
  );
}
