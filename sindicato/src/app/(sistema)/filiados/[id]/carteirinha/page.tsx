import { db } from '@/lib/db';
import { formatarCpf, formatarData } from '@/lib/formato';
import { STATUS_FILIADO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { BotaoImprimir } from '@/components/BotaoImprimir';
import Link from 'next/link';
import { MARCA } from '@/lib/marca';

export const metadata = { title: 'Carteirinha' };

export default async function Carteirinha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId, sindicato } = await usuarioAtual();
  const f = garantir(await db.filiado.findFirst({ where: { id, sindicatoId }, include: { empresa: true } }));
  const validade = new Date();
  validade.setUTCFullYear(validade.getUTCFullYear() + 1);

  return (
    <div className="pagina-carteirinha">
      <div className="nao-imprimir barra-impressao">
        <Link href={`/filiados/${id}`}>← Voltar à ficha</Link>
        <BotaoImprimir />
      </div>
      <div className="carteirinha">
        <div className="carteirinha-topo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARCA.simbolo} alt="" className="simbolo" />
          <div>
            <strong>{sindicato.sigla || sindicato.nome}</strong>
            <small>{sindicato.sigla ? sindicato.nome : sindicato.categoria}</small>
          </div>
        </div>
        <div className="carteirinha-corpo">
          <div className="carteirinha-nome">{f.nome}</div>
          <div className="carteirinha-grade">
            <div>
              <small>Matrícula</small>
              {String(f.matricula).padStart(6, '0')}
            </div>
            <div>
              <small>CPF</small>
              {formatarCpf(f.cpf)}
            </div>
            <div>
              <small>Filiado desde</small>
              {formatarData(f.dataFiliacao)}
            </div>
            <div>
              <small>Validade</small>
              {formatarData(validade)}
            </div>
            <div className="carteirinha-largo">
              <small>Empresa</small>
              {f.empresa ? f.empresa.nomeFantasia || f.empresa.razaoSocial : '—'}
            </div>
          </div>
        </div>
        <div className={`carteirinha-rodape ${f.status === 'ATIVO' ? '' : 'inativo'}`}>{STATUS_FILIADO[f.status].toUpperCase()}</div>
      </div>
    </div>
  );
}
