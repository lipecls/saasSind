import { AreaTexto, Campo, Grupo, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import { Cabecalho } from '@/components/Ui';
import { TIPO_EVENTO } from '@/lib/rotulos';
import { criarEvento } from '../acoes';

export const metadata = { title: 'Novo evento' };

export default function NovoEvento() {
  return (
    <>
      <Cabecalho titulo="Novo evento / assembleia" voltar={{ href: '/eventos', rotulo: 'Eventos' }} />
      <Form acao={criarEvento} rotulo="Agendar">
        <Grupo titulo="Dados do evento">
          <Selecao nome="tipo" rotulo="Tipo" obrigatorio opcoes={TIPO_EVENTO} />
          <Campo nome="local" rotulo="Local" />
          <Campo nome="titulo" rotulo="Título" obrigatorio largura="cheia" placeholder="Ex.: Assembleia geral — campanha salarial 2027" />
          <Campo nome="inicio" rotulo="Início" tipo="datetime-local" obrigatorio />
          <Campo nome="fim" rotulo="Término" tipo="datetime-local" />
          <AreaTexto nome="descricao" rotulo="Pauta / descrição" linhas={6} />
        </Grupo>
      </Form>
    </>
  );
}
