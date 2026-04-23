# Nmap Tutorial: The Swiss Army Knife of Networking

## Introduction

**Nmap** (Network Mapper) is an open-source tool for network exploration and security auditing. It was designed to rapidly scan large networks, although it works fine against single hosts. Nmap uses raw IP packets in novel ways to determine what hosts are available on the network, what services (application name and version) those hosts are offering, what operating systems (and OS versions) they are running, what type of packet filters/firewalls are in use, and dozens of other characteristics.

---

## Key Features

- **Host Discovery**: Identify devices running on a network.
- **Port Scanning**: Enumerate open ports on target hosts.
- **Service/Version Detection**: Interrogate network services to determine application names and version numbers.
- **OS Detection**: Determine the operating system and hardware characteristics of network devices.
- **Nmap Scripting Engine (NSE)**: Extend Nmap's core functionality with scripts for advanced discovery and vulnerability detection.

---

## Essential Commands

### 1. Basic Scanning
Scan a single host for the top 1000 well-known ports:
```bash
nmap scanme.nmap.org
```

Scan a list of active devices on a subnet (Ping Scan):
```bash
nmap -sP 192.168.1.1/24
```

### 2. Stealth Scanning
Send SYN packets without completing the 3-way handshake to remain less visible to logs:
```bash
nmap -sS scanme.nmap.org
```

### 3. Service & OS Detection
Detect versions of services running on open ports:
```bash
nmap -sV scanme.nmap.org
```

Identify the underlying Operating System:
```bash
nmap -O scanme.nmap.org
```

### 4. Aggressive Scanning
Enable OS detection, version detection, script scanning, and traceroute in one command:
```bash
nmap -A scanme.nmap.org
```

### 5. Port Specific Scans
Scan specific ports (e.g., 80 and 443):
```bash
nmap -p 80,443 192.168.1.1
```

Scan the top 10 most common ports:
```bash
nmap --top-ports 10 scanme.nmap.org
```

---

## Output Formats

Exporting results is vital for documentation and further analysis:

- **Normal Output** (`-oN`): Saves output as seen on the screen.
- **XML Output** (`-oX`): Preferred for importing into other tools like Metasploit.
- **Grepable Output** (`-oG`): Optimized for simple text processing.
- **All Formats** (`-oA`): Generates .nmap, .xml, and .gnmap files simultaneously.

Example:
```bash
nmap -oA network_scan_results 192.168.1.0/24
```

---

## Best Practices

> [!WARNING]
> **Legal Disclaimer**: Unauthorized scanning of networks you do not own or have explicit permission to test is illegal and unethical. Always use Nmap responsibly within your lab environment or authorized testing scope.

- Use **Zenmap** if you prefer a Graphical User Interface.
- Start with **Ping Scans** to map the network before doing intensive port scans.
- Use **Verbosity** (`-v`) to see real-time progress of long-running scans.
