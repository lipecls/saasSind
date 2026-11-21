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

> **Importante:** copie a pasta `backups/` para **fora do servidor** (HD externo, Google Drive, outro computador). Backup que fica só no próprio servidor se perde junto com ele.

Para restaurar (substitui os dados atuais):

```bash
./scripts/restaurar.sh backups/sindicato-AAAA-MM-DD_HHMM.sql.gz
```

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

---

## Acesso de fora do sindicato / HTTPS (opcional)

Para uso apenas na rede interna, `http://IP:3000` é suficiente. Se precisar acessar pela internet, **não** abra a porta 3000 no roteador diretamente: use uma VPN (ex.: Tailscale, WireGuard) ou um proxy com HTTPS (ex.: Caddy, Nginx) e então defina `COOKIE_SECURE=true` no `.env`.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| Faz login e volta para a tela de login | `COOKIE_SECURE=true` com acesso por `http://`. Use `false` ou configure HTTPS |
| Outros computadores não abrem a página | Firewall do servidor bloqueando a porta 3000, ou IP do servidor mudou |
| `defina POSTGRES_PASSWORD no arquivo .env` | O arquivo `.env` não foi criado na pasta `sindicato` |
| App não fica `healthy` | Veja `docker compose logs app` (geralmente senha do banco diferente da usada na 1ª instalação) |
