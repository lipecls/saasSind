#!/bin/sh
# Configura o envio automático dos backups para o Google Drive, com criptografia.
# Executar uma única vez, no servidor, dentro da pasta do sistema:  ./scripts/configurar-google-drive.sh
set -eu
cd "$(dirname "$0")/.."
# Lê uma variável do .env sem executá-lo como script (valores podem ter espaços).
ler_env() { [ -f .env ] && sed -n "s/^$1=//p" .env | tail -n 1 | sed 's/^"\(.*\)"$/\1/' || true; }
PASTA="$(ler_env GDRIVE_PASTA)"; PASTA="${PASTA:-Backups Sindicato}"
RCLONE="docker compose run --rm -T rclone"

cat <<TEXTO

=== Backup no Google Drive ===

1) Num computador COM NAVEGADOR (pode ser o seu, com Windows):
   - Baixe o rclone em https://rclone.org/downloads/ e descompacte.
   - Abra o terminal (no Windows: Prompt de Comando) na pasta do rclone e rode:

       rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"

   - O navegador vai abrir: entre com a conta Google do sindicato e clique em Permitir.
     (O sistema só terá acesso aos arquivos que ele mesmo criar no Drive.)

2) O terminal vai mostrar um texto entre "--->" e "<---", que começa com {"access_token"
   Copie esse texto inteiro e cole abaixo.

TEXTO
printf 'Token: '
read -r TOKEN < /dev/tty
case "$TOKEN" in
  \{*access_token*\}) ;;
  *) echo "Token inválido: deve começar com {\"access_token\" e terminar com }"; exit 1 ;;
esac

cat <<TEXTO

3) Escolha uma SENHA DE CRIPTOGRAFIA para os backups (mínimo 12 caracteres).
   Sem ela, ninguém consegue ler os backups — nem o Google, nem quem acessar o Drive.
   ATENÇÃO: guarde-a em local seguro (fora deste servidor). Se perdê-la, os
   backups do Drive NÃO poderão ser recuperados.

TEXTO
stty -echo < /dev/tty
printf 'Senha: ';            read -r SENHA  < /dev/tty; echo
printf 'Repita a senha: ';   read -r SENHA2 < /dev/tty; echo
stty echo < /dev/tty
[ "$SENHA" = "$SENHA2" ] || { echo "As senhas não conferem."; exit 1; }
[ ${#SENHA} -ge 12 ] || { echo "A senha deve ter pelo menos 12 caracteres."; exit 1; }

mkdir -p rclone backups
$RCLONE config create gdrive drive scope=drive.file "token=$TOKEN" --non-interactive > /dev/null
$RCLONE config create gdrive-cripto crypt "remote=gdrive:$PASTA" "password=$SENHA" --obscure --non-interactive > /dev/null
docker compose run --rm -T --entrypoint chmod rclone 600 /config/rclone/rclone.conf

echo
echo "Testando o acesso ao Google Drive..."
if $RCLONE mkdir gdrive-cripto: && $RCLONE lsd gdrive: > /dev/null; then
  echo "Pronto! Os próximos backups (scripts/backup.sh) serão enviados para a pasta \"$PASTA\" do Google Drive."
  echo "Dica: rode ./scripts/backup.sh agora para enviar o primeiro."
else
  docker compose run --rm -T --entrypoint rm rclone -f /config/rclone/rclone.conf
  echo "Não foi possível acessar o Google Drive; a configuração foi desfeita (os backups continuam só no servidor)."
  echo "Verifique a internet do servidor e rode este script de novo, gerando um novo token."
  exit 1
fi
