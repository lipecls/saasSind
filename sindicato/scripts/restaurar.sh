#!/bin/sh
# Restaura um backup (instalação com Docker). ATENÇÃO: substitui os dados atuais.
# Uso: scripts/restaurar.sh backups/sindicato-AAAA-MM-DD_HHMM.sql.gz
set -eu
cd "$(dirname "$0")/.."
[ -f "${1:-}" ] || { echo "Uso: $0 arquivo.sql.gz"; exit 1; }
printf "Isto vai SUBSTITUIR todos os dados atuais por %s. Digite SIM para continuar: " "$1"
read -r resposta
[ "$resposta" = "SIM" ] || { echo "Cancelado."; exit 1; }
gunzip -c "$1" | docker compose exec -T db psql -q -v ON_ERROR_STOP=1 -o /dev/null -U sind -d sindicato
echo "Restauração concluída."
