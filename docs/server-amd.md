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
