# Concept Overview: Cloudflare Reverse Tunneling

Cloudflare Reverse Tunneling (commonly implemented using `cloudflared`) allows you to securely expose a local service to the internet without opening inbound firewall ports or configuring traditional port forwarding.

---

## Complete Setup Guide

This guide covers the installation and configuration of `cloudflared` for both temporary testing and permanent production environments.

### Prerequisites
- A Cloudflare account (free tier works)
- A domain managed by Cloudflare (for named tunnels)
- A Linux server with the service you want to expose

---

### Installation

#### Option 1: Download Binary (Recommended)
```bash
# Download the latest cloudflared binary
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Make it executable
chmod +x cloudflared-linux-amd64

# Move to system path
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

#### Option 2: Package Manager (Debian/Ubuntu)
```bash
# Add Cloudflare's GPG key
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add the repository
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared focal main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install
sudo apt update && sudo apt install cloudflared
```

---

### Quick Tunnel (Temporary)
Quick tunnels are perfect for testing. They create a random `*.trycloudflare.com` subdomain.

**Basic Usage:**
```bash
# Expose a local HTTP service on port 8080
cloudflared tunnel --url http://localhost:8080
```

---

### Named Tunnel (Persistent)
Named tunnels provide a permanent ID and can be mapped to your own domain.

#### Step 1: Authenticate
```bash
cloudflared tunnel login
# This opens a browser to authorize the server
```

#### Step 2: Create the Tunnel
```bash
cloudflared tunnel create my-tunnel
# This creates a credentials JSON in ~/.cloudflared/
```

#### Step 3: Configure
Create a config file at `~/.cloudflared/config.yml`:
```yaml
tunnel: my-tunnel
credentials-file: /home/user/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:8080
  - hostname: ws.yourdomain.com
    service: http://localhost:8081
  - service: http_status:404
```

#### Step 4: Route DNS
```bash
cloudflared tunnel route dns my-tunnel app.yourdomain.com
```

#### Step 5: Run the Tunnel
```bash
cloudflared tunnel run my-tunnel
```

---

### Systemd Service (Autostart)
To ensure the tunnel starts automatically on boot, create `/etc/systemd/system/cloudflared-tunnel.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=YOUR_USERNAME
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/YOUR_USERNAME/.cloudflared/config.yml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

### Troubleshooting & Best Practices

| Issue | Resolution |
| :--- | :--- |
| **Buffer errors** | `sudo sysctl -w net.core.rmem_max=2500000` |
| **Site unreachable** | Verify local service status and port number in config |
| **Cert expired** | Run `cloudflared tunnel login` again |

**Security Best Practices:**
1. Use **Named Tunnels** for production.
2. Enable **Cloudflare Access (Zero Trust)** for sensitive internal tools.
3. Restrict service binding to `127.0.0.1` where possible.
4. Rotate credentials periodically.

---

Prepared for internal technical reference by iPRISM Research Group.