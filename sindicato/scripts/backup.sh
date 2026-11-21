#!/bin/sh
# Backup do banco (instalação com Docker). Mantém os últimos 30 arquivos no servidor e,
# se configurado (scripts/configurar-google-drive.sh), envia uma cópia criptografada ao Google Drive.
# Agendar diariamente às 2h:  crontab -e  →  0 2 * * * /caminho/para/sindicato/scripts/backup.sh >> /var/log/backup-sindicato.log 2>&1
set -eu
cd "$(dirname "$0")/.."
# Lê uma variável do .env sem executá-lo como script (valores podem ter espaços).
ler_env() { [ -f .env ] && sed -n "s/^$1=//p" .env | tail -n 1 | sed 's/^"\(.*\)"$/\1/' || true; }
RETENCAO="$(ler_env GDRIVE_RETENCAO_DIAS)"; RETENCAO="${RETENCAO:-90}"
mkdir -p backups
NOME="sindicato-$(date +%Y-%m-%d_%H%M).sql.gz"
docker compose exec -T db pg_dump -U sind -d sindicato --clean --if-exists | gzip > "backups/$NOME"
ls -1t backups/sindicato-*.sql.gz | tail -n +31 | xargs -r rm --
echo "$(date '+%F %T') Backup salvo em backups/$NOME"

if [ -f rclone/rclone.conf ]; then
  rclone() { docker compose run --rm -T rclone "$@" < /dev/null; }
  rclone copy "/data/$NOME" gdrive-cripto: --retries 5
  rclone delete gdrive-cripto: --min-age "${RETENCAO}d" --include 'sindicato-*.sql.gz' --drive-use-trash=false
  echo "$(date '+%F %T') Enviado ao Google Drive (criptografado)."
fi
