# NVIDIA Server

## General Information

* **IP Address:** `195.251.75.17`
* **Default Port:** `22`
* **Hostname:** `iprism-nvidia`
* **Access Level:** External (restricted via SSH)


## Specifications

* **CPU:** `Intel(R) Xeon(R) W-2235 CPU @ 3.80GHz`
* **GPU:** ` RTX 4090`
* **RAM:** `123 Gb`
* **Storage:** `5.5 TB`
* **OS:** `Ubuntu 22.04 LTS`
* **CUDA Version:** `12.4`
* **Docker:** `Installed`


## SSH Access

```bash
ssh <username>@195.251.57.17 -p <port>
```

* **Authentication:** Password Based


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
| N/A  | N/A     | N/A         |


## Running Services / Containers

| Service Name | Port | Description |
| ------------ | ---- | ----------- |
| N/A          | N/A  | N/A         |


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
