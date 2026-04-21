# Grafana Tutorial: Installation and Connection to InfluxDB

## Table of Contents
1. [What is Grafana?](#what-is-grafana)
2. [Key Features](#key-features)
3. [Installation on Ubuntu](#installation-on-ubuntu)
4. [Post-Installation Setup](#post-installation-setup)
5. [Connecting to InfluxDB](#connecting-to-influxdb)
6. [Creating Your First Dashboard](#creating-your-first-dashboard)
7. [Troubleshooting](#troubleshooting)

---

## What is Grafana?

Grafana is an open-source **observability platform** for querying, visualizing, and alerting on metrics from multiple data sources. It transforms time-series data from databases like InfluxDB, Prometheus, and PostgreSQL into interactive dashboards with charts, graphs, and alerts.

**Why use Grafana?**
- **Unified view**: Combine metrics from multiple sources in one dashboard
- **Real-time monitoring**: Live updates of system metrics
- **Alerting**: Set thresholds and get notified via email, Slack, etc.
- **Query flexibility**: Support for multiple query languages (Flux, PromQL, SQL)
- **Customizable**: Hundreds of community dashboards and plugins

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Data Sources** | Supports 30+ data sources including InfluxDB, Prometheus, MySQL, PostgreSQL, Elasticsearch |
| **Visualizations** | Time series, bar charts, heatmaps, gauges, stat panels, tables |
| **Alerting** | Centralized alert management with multiple notification channels |
| **Dashboard Variables** | Interactive filters for dynamic dashboards |
| **Annotations** | Mark events on graphs from external sources |
| **User Management** | Role-based access control (Viewer, Editor, Admin) |
| **API Access** | Full REST API for automation |

---

## Installation on Ubuntu

### Prerequisites
- Ubuntu 20.04, 22.04, or 24.04
- 2GB+ RAM recommended
- Root or sudo access

### Method 1: APT Repository Installation (Recommended)

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y adduser libfontconfig1 musl wget

# Add Grafana GPG key and repository
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

# Install Grafana
sudo apt-get update
sudo apt-get install -y grafana

# Start and enable Grafana service
sudo systemctl daemon-reload
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Check status
sudo systemctl status grafana-server
```

### Method 2: Direct .deb Download

```bash
# Download latest OSS version
wget https://dl.grafana.com/oss/release/grafana_11.3.0_amd64.deb

# Install
sudo dpkg -i grafana_11.3.0_amd64.deb

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

### Configure Firewall

```bash
# Allow Grafana's default port (3000)
sudo ufw allow 3000/tcp

# If you changed the port, allow that instead
sudo ufw allow 3030/tcp
```

### Change Default Port (Optional)

Edit the configuration file:
```bash
sudo nano /etc/grafana/grafana.ini
```

Find the `[server]` section and uncomment/change:
```ini
[server]
http_port = 3030
```

Restart Grafana:
```bash
sudo systemctl restart grafana-server
```

---

## Post-Installation Setup

### Access Grafana Web Interface

1. Open your browser and navigate to:
   ```
   http://your-server-ip:3000
   ```
   (Use your custom port if changed)

2. **Login credentials:**
   - Username: `admin`
   - Password: `admin`

3. **Change password** when prompted

### First Login Steps

1. Complete password change
2. You'll see the default Grafana home page
3. Click "Add your first data source" to begin

---

## Connecting to InfluxDB

### Prerequisites for InfluxDB Connection

Before connecting, ensure you have:
- InfluxDB v2 installed and running (check with `curl http://localhost:8086/health`)
- Your InfluxDB **organization name**
- Your InfluxDB **API token**
- Your **bucket name**

### Finding Your InfluxDB Credentials

```bash
# Check if InfluxDB is running on default port 8086 or custom port 9999
curl http://localhost:8086/health
curl http://localhost:9999/health

# List InfluxDB organizations
influx org list

# List buckets
influx bucket list

# List or create tokens
influx auth list
influx auth create --all-access
```

### Step-by-Step Connection

1. **Log into Grafana** (`http://your-server-ip:3000`)

2. **Add data source:**
   - Click **Connections** (lightning bolt icon in left sidebar)
   - Click **Data sources**
   - Click **Add data source**
   - Search for and select **InfluxDB**

3. **Configure the connection:**

| Field | Value |
|-------|-------|
| **Name** | `InfluxDB` (or any descriptive name) |
| **Query Language** | `Flux` (recommended for v2) or `InfluxQL` |
| **URL** | `http://localhost:8086` (or `http://localhost:9999` if using Snap) |
| **Organization** | Your InfluxDB organization name |
| **Token** | Your InfluxDB API token |
| **Default bucket** | Your bucket name (e.g., `sysmonitor`) |

4. **Test the connection:**
   - Click **Save & Test**
   - You should see: `"InfluxDB connection successful"`

### Direct URL Method (If UI Option is Missing)

If InfluxDB doesn't appear in the data source list, use the direct URL:
```
http://your-server-ip:3000/datasources/new?type=influxdb
```

### Verify Data is Accessible

Go to **Explore** (compass icon) and run a test query:

```flux
from(bucket: "your-bucket-name")
  |> range(start: -15m)
  |> filter(fn: (r) => r._measurement == "cpu")
  |> limit(n: 10)
```

If you see data, the connection is working correctly.

---

## Creating Your First Dashboard

### Option 1: Import a Pre-built Dashboard (Quickest)

1. Hover over **+** icon → **Import**
2. Enter Dashboard ID (e.g., `15650` for Telegraf + InfluxDB v2)
3. Click **Load**
4. Select your InfluxDB data source
5. Click **Import**

**Popular Dashboard IDs:**

| ID | Name | Use Case |
|----|------|----------|
| 15650 | Telegraf Metrics for InfluxDB 2.0 | Telegraf system metrics |
| 14469 | Telegraf System Metrics Dashboard | General system monitoring |
| 928 | Telegraf System Dashboard | Legacy InfluxQL queries |

### Option 2: Create a Manual Dashboard

1. Click **+** → **Dashboard** → **Add visualization**
2. Select your InfluxDB data source
3. Enter a Flux query:

**CPU Usage:**
```flux
from(bucket: "sysmonitor")
  |> range(start: v.timeRangeStart)
  |> filter(fn: (r) => r._measurement == "cpu")
  |> filter(fn: (r) => r.cpu == "cpu-total")
  |> filter(fn: (r) => r._field == "usage_active")
```

**Memory Usage:**
```flux
from(bucket: "sysmonitor")
  |> range(start: v.timeRangeStart)
  |> filter(fn: (r) => r._measurement == "mem")
  |> filter(fn: (r) => r._field == "used_percent")
```

**Network Traffic:**
```flux
from(bucket: "sysmonitor")
  |> range(start: v.timeRangeStart)
  |> filter(fn: (r) => r._measurement == "net")
  |> filter(fn: (r) => r._field == "bytes_recv" or r._field == "bytes_sent")
  |> derivative(unit: 1s, nonNegative: true)
```

4. Choose visualization type (Time series, Gauge, Stat, etc.)
5. Click **Save** (disk icon) and name your dashboard

---

## Basic Grafana Operations

### Dashboard Management

| Action | Method |
|--------|--------|
| Create dashboard | **+** → **Dashboard** |
| Import dashboard | **+** → **Import** |
| Save dashboard | Disk icon or **Ctrl+S** |
| Add panel | Click **Add** → **Visualization** |
| Set time range | Top-right corner dropdown |
| Set auto-refresh | Top-right refresh icon → select interval |

### Panel Settings

- **Edit panel**: Click panel title → **Edit**
- **Duplicate panel**: Click panel title → **More** → **Duplicate**
- **Delete panel**: Click panel title → **More** → **Remove**
- **Resize/Move**: Drag panel edges or title bar

### Variables (Dynamic Dashboards)

1. Dashboard **Settings** (gear) → **Variables** → **Add variable**
2. **Query variable example** for interfaces:
   ```flux
   import "influxdata/influxdb/v1"
   v1.tagValues(bucket: "sysmonitor", tag: "interface")
   ```
3. Use in queries as `${variable_name}`

---

## Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Can't access Grafana (port 3000)** | Check firewall: `sudo ufw allow 3000/tcp` |
| | Check service: `sudo systemctl status grafana-server` |
| | Check listening: `sudo ss -tlnp \| grep 3000` |
| **"No data" in dashboard** | Verify time range includes data collection period |
| | Test query in Explore first |
| | Check field names match your data schema |
| **InfluxDB connection fails** | Verify InfluxDB is running: `curl http://localhost:8086/health` |
| | Check URL port (8086 vs 9999) |
| | Verify token and organization are correct |
| **"No outputs found" (Telegraf)** | Check config file has uncommented `[[outputs.influxdb_v2]]` |
| **Dashboard shows "N/A" | Field name mismatch - check actual field names in Explore |
| **Host filter undefined** | Remove host filter for single-server setups |

### Useful Commands

```bash
# Check Grafana status
sudo systemctl status grafana-server

# View Grafana logs
sudo journalctl -u grafana-server -f

# Restart Grafana
sudo systemctl restart grafana-server

# Check Grafana version
grafana-server -v

# Reset admin password
sudo grafana-cli admin reset-admin-password newpassword
```

### Getting Help

- **Grafana Documentation**: https://grafana.com/docs/
- **Community Forums**: https://community.grafana.com/
- **GitHub Issues**: https://github.com/grafana/grafana/issues

---

## Quick Reference

### Default Ports

| Service | Default Port |
|---------|--------------|
| Grafana | 3000 |
| InfluxDB v2 | 8086 (sometimes 9999 for Snap) |
| Telegraf (Prometheus output) | 9273 |

### Login Defaults
- **Username**: `admin`
- **Password**: `admin` (change on first login)

### Service Commands

```bash
sudo systemctl start grafana-server
sudo systemctl stop grafana-server
sudo systemctl restart grafana-server
sudo systemctl enable grafana-server
sudo systemctl status grafana-server
```

---

## Next Steps

After basic setup is complete:

1. **Add alerting rules** for critical thresholds (CPU > 80%, disk < 10%)
2. **Configure notification channels** (email, Slack, webhook)
3. **Set up authentication** (LDAP, OAuth, SAML)
4. **Enable Grafana Live** for real-time streaming
5. **Install additional plugins** from Grafana Marketplace

---

*This tutorial covers Grafana OSS (Open Source) version 10+. Enterprise features require a license.*
