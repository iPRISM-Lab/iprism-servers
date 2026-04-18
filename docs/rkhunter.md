# Download and Execute RKHunter

RKHunter (Rootkit Hunter) is a security tool for Unix/Linux systems that scans for rootkits, backdoors, and known local exploits.

---

## 1. Install RKHunter

### Debian / Ubuntu
```bash
sudo apt update
sudo apt install rkhunter -y
```

### CentOS / RHEL / Rocky Linux / AlmaLinux
```bash
sudo dnf install epel-release -y
sudo dnf install rkhunter -y
```

(Use `yum` instead of `dnf` on older systems.)

### Arch Linux
```bash
sudo pacman -S rkhunter
```

---

## 2. Update RKHunter Database

Update file properties database:
```bash
sudo rkhunter --propupd
```

Update signatures:
```bash
sudo rkhunter --update
```

---

## 3. Run a System Scan

Full system scan:
```bash
sudo rkhunter --check
```

Non-interactive scan:
```bash
sudo rkhunter --check --sk
```

---

## 4. View Scan Results

View log file:
```bash
sudo less /var/log/rkhunter.log
```

---

## 5. Install from Source (Alternative Method)

```bash
wget https://sourceforge.net/projects/rkhunter/files/latest/download -O rkhunter.tar.gz
tar -xzf rkhunter.tar.gz
cd rkhunter-*
sudo ./installer.sh --install
```

Then:
```bash
sudo rkhunter --update
sudo rkhunter --propupd
sudo rkhunter --check
```

---

## Quick Command Summary

```bash
sudo rkhunter --update
sudo rkhunter --propupd
sudo rkhunter --check --sk
```

---

Prepared for internal technical reference and operational use by iPRISM Research Group. Distribution or external reproduction is not authorized without prior approval.