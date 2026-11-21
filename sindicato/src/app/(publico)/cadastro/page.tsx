import Link from 'next/link';
import { Form } from '@/components/Form';
import { Campo, Grupo, Selecao } from '@/components/Campos';
import { UFS } from '@/lib/rotulos';
import { cadastrarSindicato } from '../acoes';

export const metadata = { title: 'Cadastrar sindicato' };

export default function Cadastro() {
  return (
    <div className="caixa-publica caixa-larga">
      <h1>Cadastre seu sindicato</h1>
      <Form acao={cadastrarSindicato} rotulo="Criar conta">
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
      <p className="rodape-publico">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </div>
  );
}
