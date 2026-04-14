# iPRISM Servers Handbook

> Internal documentation for server infrastructure, access, and resource management within the iPRISM Lab.


# Server Overview

| Server Name | Type     | Access Scope | Purpose                                                                      |
| ----------- | -------- | ------------ | ---------------------------------------------------------------------------- |
| NVIDIA      | External | Public       | External accesses (eg. BSc Thesis, Projects Shared resources), NVIDIA usage  |
| AMD         | Internal | Private      | Interal accesses                                                             |

---

# NVIDIA Server

## General Information

* **IP Address:** `TBD`
* **Hostname:** `TBD`
* **Access Level:** External (restricted via SSH)


## Specifications

* **CPU:** `TBD`
* **GPU:** ` RTX 4090`
* **RAM:** `TBD`
* **Storage:** `TBD`
* **OS:** `Ubuntu 22.04 LTS`
* **CUDA Version:** `TBD`
* **Docker:** `Installed / Not Installed`


## SSH Access

```bash
ssh <username>@<ip_address> -p <port>
```

* **Default Port:** `TBD`
* **Authentication:** Password


## Network Configuration

### Available Ports

| Service        | Port         |
| -------------- | ------------ |
| HTTP           | 80           |
| HTTPS          | 443          |
| SMTP           | 25, 465, 587 |
| POP3           | 110, 995     |
| IMAP           | 143, 993     |
| FTP            | 21           |
| FTPS           | 990          |
| Custom TCP/UDP | 1025, 2525   |


### Occupied Ports

| Port | Service | Description |
| ---- | ------- | ----------- |
| TBD  | TBD     | TBD         |


## Running Services / Containers

| Service Name | Port | Description |
| ------------ | ---- | ----------- |
| TBD          | TBD  | TBD         |


## Important Storage Structures

```
/home/           # User directories
/data/           # Shared datasets
/models/         # Trained ML models
/backups/        # Backup storage
/docker/         # Containers & volumes
```


## Usage Guidelines

* Use **Docker containers** for all experiments
* Use `/data` for datasets (not `/home`)


---

# AMD Server

## General Information

* **IP Address:** `TBD`
* **Hostname:** `TBD`
* **Access Level:** Internal (restricted via SSH)


## Specifications

* **CPU:** `TBD`
* **GPU:** `TBD`
* **RAM:** `TBD`
* **Storage:** `TBD`
* **OS:** `Dual Boot on Ubuntu/Windows`

> [!WARNING]  
> Please after Windows usage always revert the server back to Ubuntu OS.

## SSH Access

```bash
ssh <username>@<internal_ip>
```

## Network Configuration

### Available Ports

| Service        | Port         |
| -------------- | ------------ |
| HTTP           | 80           |
| HTTPS          | 443          |
| SMTP           | 25, 465, 587 |
| POP3           | 110, 995     |
| IMAP           | 143, 993     |
| FTP            | 21           |
| FTPS           | 990          |
| Custom TCP/UDP | 1025, 2525   |


### Occupied Ports

| Port | Service | Description |
| ---- | ------- | ----------- |
| TBD  | TBD     | TBD         |


## Running Services

| Service Name | Port | Description |
| ------------ | ---- | ----------- |
| TBD          | TBD  | TBD         |


## Important Storage Structure

```
/home/
/projects/
/datasets/
/backups/
```


## Usage Guidelines

* Primarily for:
  * Internal Development
  * Datasets Storage

---

# Backup Strategy

| Type            | Frequency      | Location         |
| --------------- | -------------- | ---------------- |
| User Data       | Daily          | eg. `/backups`   |
| Models          | Weekly         | External Storage |
| System Snapshot | Weekly/Daily   | Image-based      |


# Monitoring & Logging

* **GPU Monitoring:** `nvidia-smi`
* **System Monitoring:** `htop`, `glances`
* **Logs:** `/var/log/`
* **Docker:** `docker stats`, `docker logs`


# Useful Commands

```bash
# Check GPU usage
nvidia-smi

# Check open ports
sudo netstat -tulnp

# Docker containers
docker ps

# Disk usage
df -h

# Active processes
htop
```


# Notes

* Keep this document updated after any infrastructure change
* Report issues immediately


