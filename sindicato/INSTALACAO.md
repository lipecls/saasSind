# Instalação em servidor local

Dois caminhos:

- **[A) Docker](#a-com-docker-recomendado)** — recomendado. Funciona em Linux, Windows e macOS; o banco de dados já vem junto.
- **[B) Manual no Ubuntu](#b-manual-no-ubuntu-sem-docker)** — sem Docker, instalando Node.js e PostgreSQL direto no servidor.

Depois de instalado, os computadores da rede acessam por `http://IP-DO-SERVIDOR:3000`.

## Requisitos do servidor

- 2 GB de RAM e 10 GB de disco já atendem bem um sindicato com milhares de filiados.
- **IP fixo** na rede local (configure no roteador uma reserva de DHCP para o servidor), para o endereço não mudar.
- Liberar a porta **3000** no firewall do servidor.

---

## A) Com Docker (recomendado)

### 1. Instale o Docker

- **Ubuntu/Debian:**
  ```bash
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker $USER   # depois saia e entre de novo na sessão
  ```
- **Windows:** instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e marque “iniciar com o Windows”.

### 2. Baixe o sistema

```bash
git clone https://github.com/lipecls/saasSind.git
cd saasSind/sindicato
```

(Ou copie a pasta `sindicato` para o servidor por pendrive/rede.)

### 3. Configure

```bash
cp .env.example .env
```

Edite o `.env` e troque **obrigatoriamente**:

| Variável | O que colocar |
| --- | --- |
| `POSTGRES_PASSWORD` | Uma senha forte para o banco |
| `SESSION_SECRET` | Texto aleatório de 32+ caracteres. Gere com `openssl rand -base64 32` |
| `APP_PORT` | Porta de acesso (padrão `3000`) |
| `COOKIE_SECURE` | Deixe `false` para acesso por `http://IP`. Use `true` só se configurar HTTPS |

### 4. Suba o sistema

```bash
docker compose up -d --build
```

A primeira vez leva alguns minutos. Confira:

```bash
docker compose ps                         # app e db devem aparecer como "healthy"
curl http://localhost:3000/api/saude      # {"ok":true}
```

### 5. Primeiro acesso

Abra `http://IP-DO-SERVIDOR:3000` em qualquer computador da rede. Vai aparecer a **instalação**: informe os dados do sindicato e crie o administrador. Depois, cadastre os demais usuários em **Configurações**.

O sistema reinicia sozinho se o servidor for religado (`restart: unless-stopped`).

### Comandos do dia a dia

```bash
docker compose logs -f app       # ver logs
docker compose restart app       # reiniciar
docker compose down              # parar (os dados são mantidos)
```

### Atualizar para uma nova versão

```bash
./scripts/backup.sh              # por segurança
git pull
docker compose up -d --build     # migrações do banco são aplicadas automaticamente
```

### Backup

```bash
./scripts/backup.sh              # gera backups/sindicato-DATA.sql.gz (guarda os 30 mais recentes)
```

Agende um backup diário (Linux) com `crontab -e`:

```
0 2 * * * /caminho/para/saasSind/sindicato/scripts/backup.sh >> /var/log/backup-sindicato.log 2>&1
```

> **Importante:** guarde cópias **fora do servidor** — backup que fica só no próprio servidor se perde junto com ele. A forma recomendada é o envio automático ao Google Drive, abaixo.

### Backup automático no Google Drive

Depois de configurado, cada execução do `backup.sh` (inclusive a agendada no cron) também envia o backup para uma pasta do Google Drive:

- **Criptografado:** filiação sindical é dado pessoal sensível (LGPD, art. 5º, II). No Drive, nomes e conteúdo dos arquivos ficam ilegíveis — nem o Google nem quem tiver acesso à conta consegue lê-los sem a senha de criptografia.
- **Acesso mínimo:** o sistema só enxerga os arquivos que ele mesmo criou no Drive.
- **Retenção:** backups com mais de 90 dias são apagados do Drive (ajuste `GDRIVE_RETENCAO_DIAS` no `.env`). No servidor ficam os 30 mais recentes.

**Configurar (uma vez):**

```bash
./scripts/configurar-google-drive.sh
```

O script guia o processo:

1. Num computador **com navegador** (pode ser o seu, com Windows), baixe o [rclone](https://rclone.org/downloads/), abra o terminal na pasta dele e rode:
   ```
   rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"
   ```
   Entre com a **conta Google do sindicato** e clique em *Permitir*.
2. Copie o texto que aparece entre `--->` e `<---` (começa com `{"access_token"`) e cole no servidor.
3. Escolha a **senha de criptografia** (mínimo 12 caracteres).

> ⚠️ **Guarde a senha de criptografia em local seguro, fora do servidor** (ex.: cofre de senhas, envelope lacrado com a diretoria). Sem ela, os backups do Drive **não podem ser recuperados**.

O script testa o acesso no final; se falhar, a configuração é desfeita e os backups continuam apenas no servidor.

Depois, rode `./scripts/backup.sh` para enviar o primeiro e confira a pasta **Backups Sindicato** no Drive.

**Restaurar a partir do Drive:**

```bash
./scripts/restaurar.sh --drive                                   # lista os backups no Drive
./scripts/restaurar.sh --drive sindicato-AAAA-MM-DD_HHMM.sql.gz  # baixa e restaura
```

**Se o servidor for perdido:** instale o sistema num servidor novo (passos 1 a 4), rode `./scripts/configurar-google-drive.sh` com a **mesma conta Google e a mesma senha de criptografia**, e restaure com `./scripts/restaurar.sh --drive`.

---

## B) Manual no Ubuntu (sem Docker)

Testado em Ubuntu 22.04/24.04.

### 1. Instale Node.js 22 e PostgreSQL

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql git
```

### 2. Crie o banco

```bash
sudo -u postgres psql -c "CREATE USER sind WITH PASSWORD 'SUA_SENHA_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE sindicato OWNER sind;"
```

### 3. Instale o sistema

```bash
sudo mkdir -p /opt && cd /opt
sudo git clone https://github.com/lipecls/saasSind.git
sudo chown -R $USER /opt/saasSind
cd /opt/saasSind/sindicato
cp .env.example .env
```

No `.env`, ajuste `DATABASE_URL` com a senha do passo 2 (`postgresql://sind:SUA_SENHA_FORTE@localhost:5432/sindicato`) e o `SESSION_SECRET`.

```bash
npm ci
npx prisma migrate deploy
npm run build
```

### 4. Rode como serviço (inicia junto com o servidor)

Crie `/etc/systemd/system/sindicato.service`:

```ini
[Unit]
Description=Sistema do sindicato
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/saasSind/sindicato
EnvironmentFile=/opt/saasSind/sindicato/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx next start -H 0.0.0.0 -p 3000
Restart=always
User=SEU_USUARIO

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sindicato
sudo ufw allow 3000/tcp          # se o firewall estiver ativo
```

Logs: `journalctl -u sindicato -f`.

**Atualizar:** `git pull && npm ci && npx prisma migrate deploy && npm run build && sudo systemctl restart sindicato`

**Backup:** `pg_dump -U sind -h localhost sindicato | gzip > backup-$(date +%F).sql.gz`

**Google Drive sem Docker:** os scripts de backup acima são para a instalação com Docker. Na instalação manual, instale o rclone (`sudo apt-get install -y rclone`), crie os remotos com os mesmos comandos do `scripts/configurar-google-drive.sh` (trocando `docker compose run --rm -T rclone` por `rclone`) e envie com `rclone copy backup-DATA.sql.gz gdrive-cripto:`.

---

## Acesso de fora do sindicato / HTTPS (opcional)

Para uso apenas na rede interna, `http://IP:3000` é suficiente. Se precisar acessar pela internet, **não** abra a porta 3000 no roteador diretamente: use uma VPN (ex.: Tailscale, WireGuard) ou um proxy com HTTPS (ex.: Caddy, Nginx) e então defina `COOKIE_SECURE=true` no `.env`.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| Faz login e volta para a tela de login | `COOKIE_SECURE=true` com acesso por `http://`. Use `false` ou configure HTTPS |
| Outros computadores não abrem a página | Firewall do servidor bloqueando a porta 3000, ou IP do servidor mudou |
| `defina POSTGRES_PASSWORD no arquivo .env` | O arquivo `.env` não foi criado na pasta `sindicato` |
| Backup não chega no Drive | Rode `./scripts/backup.sh` manualmente e veja a mensagem; se o acesso ao Google expirou ou foi revogado, rode `./scripts/configurar-google-drive.sh` de novo (mesma senha) |
| App não fica `healthy` | Veja `docker compose logs app` (geralmente senha do banco diferente da usada na 1ª instalação) |
