import type { Convencao, Empresa } from '@prisma/client';
import { AreaTexto, Campo, Grupo, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import type { EstadoAcao } from '@/lib/acao';
import { MESES } from '@/lib/convencoes';
import { centavosParaInput, dataParaInput } from '@/lib/formato';
import { TIPO_CONVENCAO } from '@/lib/rotulos';

export function FormConvencao({
  acao,
  convencao,
  empresas,
  empresaPadrao,
}: {
  acao: (e: EstadoAcao, f: FormData) => Promise<EstadoAcao>;
  convencao?: Convencao;
  empresas: Pick<Empresa, 'id' | 'razaoSocial' | 'nomeFantasia'>[];
  empresaPadrao?: string;
}) {
  return (
    <Form acao={acao} rotulo={convencao ? 'Salvar alterações' : 'Cadastrar'}>
      <Grupo titulo="Instrumento coletivo">
        <Selecao nome="tipo" rotulo="Tipo" obrigatorio opcoes={TIPO_CONVENCAO} padrao={convencao?.tipo ?? (empresaPadrao ? 'ACT' : 'CCT')} />
        <Campo nome="numeroRegistro" rotulo="Nº de registro (Mediador/MTE)" padrao={convencao?.numeroRegistro} />
        <Campo nome="titulo" rotulo="Título" obrigatorio largura="cheia" padrao={convencao?.titulo} placeholder="Ex.: CCT 2026/2027 — Comércio varejista" />
        <Campo nome="parteContraria" rotulo="Sindicato patronal (CCT)" largura="cheia" padrao={convencao?.parteContraria} />
        <Selecao
          nome="empresaId"
          rotulo="Empresa signatária (ACT)"
          largura="cheia"
          vazio="—"
          padrao={convencao?.empresaId ?? empresaPadrao}
          opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nomeFantasia || e.razaoSocial }))}
        />
      </Grupo>
      <Grupo titulo="Vigência e condições econômicas">
        <Campo nome="vigenciaInicio" rotulo="Início da vigência" tipo="date" obrigatorio padrao={dataParaInput(convencao?.vigenciaInicio)} />
        <Campo nome="vigenciaFim" rotulo="Fim da vigência" tipo="date" obrigatorio padrao={dataParaInput(convencao?.vigenciaFim)} />
        <Selecao
          nome="mesDataBase"
          rotulo="Data-base"
          vazio="—"
          padrao={convencao?.mesDataBase?.toString()}
          opcoes={MESES.map((m, i) => ({ valor: String(i + 1), rotulo: m }))}
        />
        <Campo nome="piso" rotulo="Piso salarial (R$)" inputMode="decimal" padrao={centavosParaInput(convencao?.pisoCentavos)} />
        <Campo
          nome="reajustePercentual"
          rotulo="Reajuste (%)"
          inputMode="decimal"
          padrao={convencao?.reajustePercentual?.toString().replace('.', ',')}
        />
        <AreaTexto nome="clausulas" rotulo="Principais cláusulas" linhas={8} padrao={convencao?.clausulas} dica="Resumo das cláusulas: jornada, benefícios, estabilidades, contribuições…" />
      </Grupo>
    </Form>
  );
}
