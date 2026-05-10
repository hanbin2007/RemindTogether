# Letting Claude Code (sandbox) operate an AWS server

A reusable recipe for giving a Claude Code agent running in the
Anthropic sandbox shell-level access to a single AWS EC2 host
(or any server reachable on 80/443) so it can `ssh`, `git pull`,
build, reload PM2/systemd, tail logs, etc.

This was set up for `rt.origenclub.cn` (this repo's prod box). Copy
the file into a new project and globally search/replace:

| placeholder | this repo's value | what it is |
|---|---|---|
| `<DOMAIN>` | `rt.origenclub.cn` | public DNS pointed at the EC2 instance |
| `<SERVER_USER>` | `ubuntu` | SSH login user on the server |
| `<TUNNEL_USER>` | `claude` | chisel auth user (anything; just an opaque label) |
| `<APP_DIR>` | `/home/ubuntu/app` | repo checkout on the server |
| `<APP_PROCESS>` | `remindtogether` | PM2 / systemd unit name |

---

## Why this is necessary

Claude Code's sandbox **only allows outbound 80/443**. Direct `ssh
user@host` (port 22) is blocked by the sandbox's egress proxy
(Anthropic's Envoy). Moving sshd to port 443 doesn't help either —
the proxy speaks HTTP, sees a non-HTTP TLS handshake on 443, and
drops the connection.

The fix: tunnel SSH **inside** an HTTPS / WebSocket connection that
goes through your existing nginx (port 443 → /_chisel/ → local
chisel server → loopback 22).

```
sandbox  ─ WSS ─►  https://<DOMAIN>/_chisel/
                       │
                       └── nginx ── 127.0.0.1:8090 (chisel server)
                                        │
                                        └── 127.0.0.1:22 (sshd)
```

`chisel` (https://github.com/jpillora/chisel) is a single static
Go binary that handles both ends. Authentication is a shared
secret in an `auth.json` file. Trust comes from your existing TLS
cert — the sandbox sees a valid LE/etc. certificate to your
domain, and chisel does its own auth on top.

---

## Server-side setup (one-time)

Run **on the server**. Requires a working nginx + SSL vhost for
`<DOMAIN>` already serving 443; if you haven't, set that up first
(certbot + Let's Encrypt, this repo's `docs/07-DEPLOYMENT.md`
covers a minimal version).

### 1. Install chisel

```bash
sudo curl -fsSL https://github.com/jpillora/chisel/releases/download/v1.10.1/chisel_1.10.1_linux_amd64.gz \
  -o /tmp/chisel.gz
sudo gunzip -f /tmp/chisel.gz
sudo install -m 0755 /tmp/chisel /usr/local/bin/chisel
chisel --version
```

### 2. Generate the shared secret

```bash
sudo mkdir -p /etc/chisel
SECRET=$(openssl rand -hex 32)
echo "{\"<TUNNEL_USER>:${SECRET}\": [\".*\"]}" | sudo tee /etc/chisel/auth.json >/dev/null
sudo chmod 600 /etc/chisel/auth.json
echo "SAVE THIS — Claude needs it once per session: $SECRET"
```

The `[".*"]` value lets this user request any forwarding rule. If
you want to lock it down to just SSH, use `["^127\\.0\\.0\\.1:22$"]`.

**Never commit the secret.** If you suspect it leaked: regen,
overwrite `/etc/chisel/auth.json`, `sudo systemctl restart chisel`.

### 3. systemd unit

```bash
sudo tee /etc/systemd/system/chisel.service >/dev/null <<'EOF'
[Unit]
Description=chisel HTTP-tunnel server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/chisel server \
  --host 127.0.0.1 \
  --port 8090 \
  --authfile /etc/chisel/auth.json \
  --keepalive 25s
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now chisel
sudo systemctl status chisel --no-pager | head -15
```

`--host 127.0.0.1` keeps chisel off the public internet — the
only way in is via nginx, which terminates TLS and adds the
WebSocket upgrade.

### 4. nginx vhost snippet

Add this to your existing `<DOMAIN>` 443 server block (the file
that already has SSL termination):

```nginx
# /etc/nginx/snippets/chisel.conf
location /_chisel/ {
    proxy_pass http://127.0.0.1:8090/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

Then in `/etc/nginx/sites-enabled/<DOMAIN>` (or wherever the 443
vhost lives), inside `server { ... }`:

```nginx
include /etc/nginx/snippets/chisel.conf;
```

`sudo nginx -t && sudo systemctl reload nginx`.

The trailing slash on `location /_chisel/` and `proxy_pass
.../` are both required — without them nginx 301s and the WSS
upgrade dies.

### 5. SSH key for the agent

Claude needs to authenticate as `<SERVER_USER>` on the server.
Either:

a) Add the agent's existing public key to the server (recommended):
   ```bash
   # in sandbox
   cat ~/.ssh/id_key.pub
   # paste into server's ~<SERVER_USER>/.ssh/authorized_keys
   ```

b) Or generate a dedicated key on the server, copy private to
   sandbox: `ssh-keygen -t ed25519 -f /tmp/agent_key -N ""`, append
   `.pub` to authorized_keys, hand the private key to the user
   (paste into Claude once, Claude writes it to `~/.ssh/id_key`,
   `chmod 600`).

### 6. Verification

From outside (laptop):

```bash
curl -fsSI "https://<DOMAIN>/_chisel/" | head -3
# Expect: 400 Bad Request (chisel rejects non-WS GETs — confirms it's reachable)
```

---

## Sandbox-side setup (per Claude session)

Claude sessions are stateless. Each session needs the secret
and the tunnel re-established. The user pastes the secret into
Claude once at session start; Claude writes it to an env var
(never to disk, never to git).

### 1. Bring `scripts/sandbox-tunnel.sh` into the new project

Copy `scripts/sandbox-tunnel.sh` from this repo. The script:

- Downloads chisel client to `/tmp/chisel` (cached)
- Adds `Host rt` to `~/.ssh/config` if missing
- Kills any prior chisel client process
- Starts a new client connecting to `wss://<DOMAIN>/_chisel/`
- Waits for "Connected" before returning

Edit the `<DOMAIN>` in the script for the new project.

### 2. User-facing instructions in CLAUDE.md

Tell future Claude sessions exactly what to do. Add to `CLAUDE.md`:

```markdown
## Server access

- Public IP: <ip>
- Domain: <DOMAIN>
- SSH user: <SERVER_USER>

### Bring up the tunnel

User pastes the chisel secret at session start, then Claude runs:
\`\`\`bash
CHISEL_SECRET=<the-64-hex-string> bash scripts/sandbox-tunnel.sh
\`\`\`

After "Connected", `ssh rt 'whoami'` should print `<SERVER_USER>`.
```

### 3. Day-to-day commands

```bash
# Pull latest, build, reload
ssh rt 'cd <APP_DIR> && git pull && pnpm build && pm2 reload <APP_PROCESS>'

# Tail prod logs
ssh rt 'pm2 logs <APP_PROCESS> --lines 50 --nostream'

# Apply a Prisma migration
ssh rt 'cd <APP_DIR> && pnpm exec prisma migrate deploy'

# One-shot Postgres query
ssh rt "PGPASSWORD=… psql -h 127.0.0.1 -p 5432 -U <db_user> -d <db_name> -c 'SELECT count(*) FROM \"User\";'"
```

The user terminal habit gotcha (per this repo's CLAUDE.md): some
shells eagerly interpret bare URLs / `<domain>` as redirect
targets. Avoid bare `https://...` or `<domain>` in command blocks
Claude prints back to the user; build them up via variables:

```bash
A=rt; B=origenclub; T=cn; DOMAIN="$A.$B.$T"
ssh "$DOMAIN" ...
```

---

## Security notes

- **Secret rotation**: any time you suspect leak, regen + restart
  chisel. Old sessions die cleanly.
- **Secret never goes to git or to the model's training data**.
  User pastes it once per session, Claude reads `$CHISEL_SECRET`
  from env. The transcript will contain it, but transcripts are
  per-session and discarded.
- **chisel listens on 127.0.0.1 only**. The only public surface
  is `/_chisel/` behind nginx + TLS. nginx logs will show the
  upgrade requests.
- **TLS inspection in the sandbox**: Anthropic's egress proxy
  MITMs HTTPS with its own CA, so `openssl s_client
  -connect <DOMAIN>:443` from sandbox shows
  `Anthropic sandbox-egress-production TLS Inspection CA` —
  this is normal and only affects the sandbox's view; real
  users still get your Let's Encrypt cert. chisel auth happens
  inside the WSS tunnel, after TLS, so MITM doesn't help an
  attacker.
- **Why not just give Claude the SSH key directly**: works only
  if you can route 22 through the sandbox's egress, which you
  can't. Even putting sshd on 443 fails because the egress proxy
  treats 443 as HTTP.
- **Why not VPN / WireGuard**: those need UDP or non-80/443 TCP
  out of the sandbox; not allowed.
- **Why not GitHub Actions runner / pull-based deploy**: better
  long-term answer, but doesn't help when Claude needs to
  *interactively* poke the box (read logs, run prisma, etc.).
  The tunnel is for the *interactive* path; CI is still the
  right answer for production deploys.

---

## Failure modes seen in practice

- `bash scripts/sandbox-tunnel.sh` exits with `did not come up
  within 10s` → check `tail /tmp/chisel-client.log`. Common
  causes: wrong secret (auth failure), nginx 301 (missing
  trailing slash on `/_chisel/`), chisel.service down on server.
- `ssh rt` works but `ssh rt 'cd app && git pull'` hangs → the
  `&&` chained git pull is fine; if you wrapped the command with
  `cd <relative path>`, switch to absolute path. Some terminal
  setups also trip on bare URLs/domains in printed commands;
  variable-build them as shown above.
- `Permission denied (publickey)` → public key isn't in server's
  authorized_keys for `<SERVER_USER>`, or sandbox's `~/.ssh/id_key`
  perms aren't 600.
- chisel suddenly drops connection → keepalive too short for
  some intermediate proxy, or sandbox itself recycled. Just
  re-run `sandbox-tunnel.sh`; idempotent.

---

## Bootstrapping a brand-new project from scratch

1. Provision EC2, point DNS at it, install nginx + certbot, get a
   working `https://<DOMAIN>/`.
2. Do the **Server-side setup (one-time)** section above.
3. Add the agent's SSH public key to `~<SERVER_USER>/.ssh/authorized_keys`.
4. Hand the chisel secret to the developer once (printed in step 2).
5. Copy `scripts/sandbox-tunnel.sh` from this repo into the new
   project; edit the domain.
6. Add a "Server access" section to the new project's `CLAUDE.md`
   pointing at the script and listing the public IP / domain /
   user / app-dir / process-name.
7. First Claude session: developer pastes the secret, Claude
   runs the script, then `ssh rt 'whoami'` to verify, then
   carries on with the actual work.

Total time, server-side, if nginx + DNS already work: ~10 minutes.
