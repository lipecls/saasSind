#!/bin/sh
# Backup do banco (instalação com Docker). Mantém os últimos 30 arquivos.
# Agendar diariamente às 2h:  crontab -e  →  0 2 * * * /caminho/para/sindicato/scripts/backup.sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
ARQUIVO="backups/sindicato-$(date +%Y-%m-%d_%H%M).sql.gz"
docker compose exec -T db pg_dump -U sind -d sindicato --clean --if-exists | gzip > "$ARQUIVO"
ls -1t backups/sindicato-*.sql.gz | tail -n +31 | xargs -r rm --
echo "Backup salvo em $ARQUIVO"
