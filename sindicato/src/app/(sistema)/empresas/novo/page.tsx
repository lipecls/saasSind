import { Cabecalho } from '@/components/Ui';
import { criarEmpresa } from '../acoes';
import { FormEmpresa } from '../FormEmpresa';

export const metadata = { title: 'Nova empresa' };

export default function NovaEmpresa() {
  return (
    <>
      <Cabecalho titulo="Nova empresa" voltar={{ href: '/empresas', rotulo: 'Empresas' }} />
      <FormEmpresa acao={criarEmpresa} />
    </>
  );
}
