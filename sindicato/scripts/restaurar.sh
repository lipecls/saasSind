#!/bin/sh
# Restaura um backup (instalação com Docker). ATENÇÃO: substitui os dados atuais.
# Uso:
#   scripts/restaurar.sh backups/sindicato-AAAA-MM-DD_HHMM.sql.gz    (backup do servidor)
#   scripts/restaurar.sh --drive                                     (lista os backups do Google Drive)
#   scripts/restaurar.sh --drive sindicato-AAAA-MM-DD_HHMM.sql.gz    (baixa do Drive e restaura)
set -eu
cd "$(dirname "$0")/.."
rclone() { docker compose run --rm -T rclone "$@" < /dev/null; }

if [ "${1:-}" = "--drive" ]; then
  [ -f rclone/rclone.conf ] || { echo "Google Drive não configurado (rode scripts/configurar-google-drive.sh)."; exit 1; }
  if [ -z "${2:-}" ]; then
    echo "Backups disponíveis no Google Drive:"
    rclone lsf gdrive-cripto: --include 'sindicato-*.sql.gz' | sort
    exit 0
  fi
  mkdir -p backups
  echo "Baixando $2 do Google Drive..."
  rclone copy "gdrive-cripto:$2" /data/
  set -- "backups/$2"
fi

[ -f "${1:-}" ] || { echo "Uso: $0 arquivo.sql.gz  |  $0 --drive [arquivo]"; exit 1; }
printf "Isto vai SUBSTITUIR todos os dados atuais por %s. Digite SIM para continuar: " "$1"
read -r resposta
[ "$resposta" = "SIM" ] || { echo "Cancelado."; exit 1; }
gunzip -c "$1" | docker compose exec -T db psql -q -v ON_ERROR_STOP=1 -o /dev/null -U sind -d sindicato
echo "Restauração concluída."
