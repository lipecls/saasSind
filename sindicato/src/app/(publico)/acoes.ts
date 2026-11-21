'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { EstadoAcao, ErroValidacao, executar, obrigatorio, texto, textoOuNulo } from '@/lib/acao';
import { cnpjValido, paraCentavos, somenteDigitos } from '@/lib/formato';
import { encerrarSessao, iniciarSessao } from '@/lib/sessao';

export async function entrar(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const email = texto(form, 'email').toLowerCase();
  const senha = texto(form, 'senha');
  const usuario = await db.usuario.findUnique({ where: { email } });
  // Compara mesmo quando o usuário não existe, para não revelar e-mails cadastrados pelo tempo de resposta.
  const hash = usuario?.senhaHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const confere = await bcrypt.compare(senha, hash);
  if (!usuario || !confere || !usuario.ativo) return { erro: 'E-mail ou senha incorretos.' };

  await iniciarSessao({ usuarioId: usuario.id, sindicatoId: usuario.sindicatoId, papel: usuario.papel });
  const voltar = texto(form, 'voltar');
  redirect(voltar.startsWith('/') && !voltar.startsWith('//') ? voltar : '/painel');
}

/**
 * Instalação inicial: cria o sindicato e o primeiro administrador.
 * O sistema atende um único sindicato, então só funciona enquanto o banco estiver vazio.
 */
export async function instalar(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  return executar(async () => {
    if (await sistemaInstalado()) redirect('/login');
    const nome = obrigatorio(form, 'nome', 'o nome do sindicato');
    const cnpj = somenteDigitos(obrigatorio(form, 'cnpj', 'o CNPJ'));
    if (!cnpjValido(cnpj)) throw new ErroValidacao('CNPJ inválido.');
    const nomeUsuario = obrigatorio(form, 'nomeUsuario', 'seu nome');
    const email = obrigatorio(form, 'email', 'seu e-mail').toLowerCase();
    const senha = texto(form, 'senha');
    if (senha.length < 8) throw new ErroValidacao('A senha deve ter pelo menos 8 caracteres.');

    const sindicato = await db.$transaction(async (tx) => {
      // Reconfere dentro da transação para evitar duas instalações simultâneas.
      if ((await tx.sindicato.count()) > 0) throw new ErroValidacao('O sistema já foi instalado.');
      return tx.sindicato.create({
      data: {
        nome,
        cnpj,
        sigla: textoOuNulo(form, 'sigla'),
        categoria: textoOuNulo(form, 'categoria'),
        cidade: textoOuNulo(form, 'cidade'),
        uf: textoOuNulo(form, 'uf'),
        mensalidadeCentavos: paraCentavos(texto(form, 'mensalidade')) ?? 0,
        usuarios: {
          create: { nome: nomeUsuario, email, senhaHash: await bcrypt.hash(senha, 10), papel: 'ADMIN' },
        },
      },
      include: { usuarios: true },
      });
    });
    const admin = sindicato.usuarios[0];
    await iniciarSessao({ usuarioId: admin.id, sindicatoId: sindicato.id, papel: 'ADMIN' });
    redirect('/painel');
  });
}

export async function sistemaInstalado() {
  return (await db.sindicato.count()) > 0;
}

export async function sair() {
  await encerrarSessao();
  redirect('/login');
}
