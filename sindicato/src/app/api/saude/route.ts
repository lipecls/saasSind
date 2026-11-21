import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Verificação de saúde (usada pelo Docker e por monitoramento): app no ar e banco respondendo. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, erro: 'banco indisponível' }, { status: 503 });
  }
}
