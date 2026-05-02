#!/bin/bash
# Start chisel client tunnel from sandbox to EC2 server.
#
# Usage:
#   CHISEL_SECRET=<secret> bash scripts/sandbox-tunnel.sh
#
# After it prints "Connected", SSH to the server with:
#   ssh rt
#
# Tunnel exposes server's localhost:22 at sandbox's 127.0.0.1:2222.
# All traffic goes over WSS through https://rt.origenclub.cn/_chisel/.

set -euo pipefail

if [ -z "${CHISEL_SECRET:-}" ]; then
    echo "ERROR: set CHISEL_SECRET env var before running this script."
    echo "(secret is the 64-hex-char string printed by the server-side setup)"
    exit 1
fi

VER=1.10.1
ARCH=amd64
BIN=/tmp/chisel

# Download chisel client if missing
if [ ! -x "$BIN" ]; then
    URL="https://github.com/jpillora/chisel/releases/download/v${VER}/chisel_${VER}_linux_${ARCH}.gz"
    curl -fsSL "$URL" -o "${BIN}.gz"
    gunzip -f "${BIN}.gz"
    chmod +x "$BIN"
fi

# Kill any prior client
pkill -f "$BIN client" 2>/dev/null || true
sleep 0.5

# Set up SSH alias if missing
mkdir -p ~/.ssh
if ! grep -q '^Host rt$' ~/.ssh/config 2>/dev/null; then
    cat >> ~/.ssh/config <<'SSHCFG'

Host rt
    HostName 127.0.0.1
    Port 2222
    User ubuntu
    IdentityFile ~/.ssh/id_key
    StrictHostKeyChecking accept-new
    UserKnownHostsFile ~/.ssh/known_hosts
    ServerAliveInterval 30
    ServerAliveCountMax 4
SSHCFG
    chmod 600 ~/.ssh/config
fi

# Start tunnel in background
LOG=/tmp/chisel-client.log
"$BIN" client \
    --auth "claude:${CHISEL_SECRET}" \
    --keepalive 25s \
    "https://rt.origenclub.cn/_chisel/" \
    2222:127.0.0.1:22 \
    >"$LOG" 2>&1 &

# Wait for connection (up to ~10s)
for i in $(seq 1 20); do
    if grep -q "Connected" "$LOG" 2>/dev/null; then
        echo "tunnel up:"
        grep -E "Connecting|Listening|Connected" "$LOG"
        echo
        echo "test: ssh rt 'whoami; hostname'"
        exit 0
    fi
    sleep 0.5
done

echo "ERROR: tunnel did not come up within 10s. Last log:"
tail -20 "$LOG"
exit 1
