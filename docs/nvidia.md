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

```text
/home/           # User directories
/data/           # Shared datasets
/models/         # Trained ML models
/backups/        # Backup storage
/docker/         # Containers & volumes
```


## Usage Guidelines

* Use **Docker containers** for all experiments
* Use `/data` for datasets (not `/home`)
