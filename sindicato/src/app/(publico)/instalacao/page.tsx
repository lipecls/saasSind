import { redirect } from 'next/navigation';
import { Form } from '@/components/Form';
import { Campo, Grupo, Selecao } from '@/components/Campos';
import { UFS } from '@/lib/rotulos';
import { instalar, sistemaInstalado } from '../acoes';

export const metadata = { title: 'Instalação' };
export const dynamic = 'force-dynamic';

export default async function Instalacao() {
  if (await sistemaInstalado()) redirect('/login');
  return (
    <div className="caixa-publica caixa-larga">
      <h1>Instalação do sistema</h1>
      <p className="texto-apoio">Informe os dados do sindicato e crie o primeiro administrador. Os demais usuários são cadastrados depois, em Configurações.</p>
      <Form acao={instalar} rotulo="Concluir instalação">
        <Grupo titulo="Sindicato">
          <Campo nome="nome" rotulo="Nome do sindicato" obrigatorio largura="cheia" />
          <Campo nome="sigla" rotulo="Sigla" />
          <Campo nome="cnpj" rotulo="CNPJ" obrigatorio placeholder="00.000.000/0000-00" />
          <Campo nome="categoria" rotulo="Categoria profissional" largura="cheia" placeholder="Ex.: Comerciários, Metalúrgicos…" />
          <Campo nome="cidade" rotulo="Cidade" />
          <Selecao nome="uf" rotulo="UF" opcoes={UFS} vazio="—" />
          <Campo nome="mensalidade" rotulo="Mensalidade padrão (R$)" placeholder="0,00" inputMode="decimal" />
        </Grupo>
        <Grupo titulo="Administrador">
          <Campo nome="nomeUsuario" rotulo="Seu nome" obrigatorio largura="cheia" />
          <Campo nome="email" rotulo="E-mail" tipo="email" obrigatorio />
          <Campo nome="senha" rotulo="Senha" tipo="password" obrigatorio minLength={8} dica="Mínimo de 8 caracteres" />
        </Grupo>
      </Form>
    </div>
  );
}
