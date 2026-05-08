# AMD Server

## General Information

* **IP Address:** `195.251.75.20`
* **Default Port:** `22`
* **Hostname:** `iprism-amd`
* **Access Level:** Internal (restricted via SSH)


## Specifications

* **CPU:** `AMD Ryzen Threadripper PRO 5955WX 16-Cores`
* **GPU:** `Navi 31 [Radeon RX 7900 XT/7900 XTX/7900M]`
* **RAM:** `251 GB`
* **RAM Swap:** `8 GB`
* **Storage:** `TBD`
* **OS:** `Dual Boot on Ubuntu/Windows`

> [!WARNING]
> Please after Windows usage always revert the server back to Ubuntu OS.

## SSH Access

```bash
ssh <username>@195.251.75.20
```
## Users
* iprism
* terra
* trace
* escort
* ellie

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

| Port | Service  | Description       |
| ---- | -------- | ----------------- |
| 3030 | GRAFANA  | Server Monitoring |
| 9443 | Portainer | Docker Governance |


## Running Services

| Service Name | Port | Description        |
| ------------ | ---- | ------------------ |
|      Stavros-Thesis     | N/A  | 15 Days |


## Important Storage Structure

```text
/home/
/projects/
/datasets/
/backups/
```


## Usage Guidelines

* Primarily for:
  * Internal Development
  * Datasets Storage
