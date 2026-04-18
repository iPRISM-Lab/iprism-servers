# Ollama Installation and Deployment Across Systems

## 1. Overview

Ollama is a lightweight framework for running large language models (LLMs) locally. It enables users to download, manage, and execute models such as Llama, Mistral, and other open-weight models directly on their infrastructure.

Ollama is designed for:
- Local AI development
- Offline model execution
- Secure internal deployments
- Edge AI environments
- Research and experimentation

---

# 2. System Requirements (Analytical Breakdown)

## 2.1 Minimum Requirements

| Component | Minimum | Recommended | High-Performance |
|------------|----------|--------------|------------------|
| CPU | 4 cores | 8+ cores | 16+ cores |
| RAM | 8 GB | 16–32 GB | 64+ GB |
| Disk | 10 GB free | 50+ GB SSD | NVMe SSD |
| GPU | Not required | 6–8 GB VRAM | 12–24+ GB VRAM |
| OS | 64-bit only | Latest stable | Latest stable |

---

## 2.2 Memory Requirements by Model Size

| Model Size | RAM Required | VRAM Recommended |
|------------|--------------|------------------|
| 7B | ~8–12 GB | 6–8 GB |
| 13B | ~16–24 GB | 10–16 GB |
| 30B | ~32–48 GB | 24 GB+ |
| 70B | 64+ GB | 40 GB+ |

Note:
- Without GPU, models run fully on CPU (slower inference).
- Quantized models (Q4, Q5) significantly reduce memory usage.

---

## 2.3 GPU Compatibility

### NVIDIA
- CUDA-supported GPUs
- Recommended for high-performance inference
- Requires proper drivers and CUDA runtime

### Apple Silicon
- Uses Metal acceleration
- M1 / M2 / M3 supported
- Unified memory benefits model performance

### AMD
- Limited support (ROCm required)
- Compatibility depends on driver stack

---

# 3. Installation by Operating System

---

# 3.1 macOS (Intel & Apple Silicon)

### Requirements
- macOS 12+
- 8GB+ RAM recommended

### Installation

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify installation:

```bash
ollama --version
```

Start Ollama service:

```bash
ollama serve
```

Run a model:

```bash
ollama run llama3
```

---

# 3.2 Linux (Ubuntu, Debian, RHEL, Arch, etc.)

### Requirements
- 64-bit Linux
- Kernel 5.x+
- systemd recommended

### Installation

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Start service:

```bash
sudo systemctl start ollama
```

Enable at boot:

```bash
sudo systemctl enable ollama
```

Run a model:

```bash
ollama run mistral
```

---

# 3.3 Windows

### Requirements
- Windows 10/11 (64-bit)
- WSL2 recommended for advanced use
- 8GB+ RAM

### Installation

1. Download installer from:
   https://ollama.com/download

2. Run the installer.

3. Open PowerShell and verify:

```powershell
ollama --version
```

Run a model:

```powershell
ollama run llama3
```

---

# 3.4 Docker Deployment (Containerized)

### Requirements
- Docker installed
- 16GB+ RAM recommended

Run container:

```bash
docker run -d \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  ollama/ollama
```

Run model:

```bash
docker exec -it ollama ollama run llama3
```

GPU acceleration (NVIDIA):

```bash
docker run --gpus all \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  ollama/ollama
```

---

# 4. Model Management

List installed models:

```bash
ollama list
```

Pull model:

```bash
ollama pull llama3
```

Remove model:

```bash
ollama rm llama3
```

---

# 5. API Usage

Ollama exposes a local REST API by default:

Endpoint:
http://localhost:11434

Example request:

```bash
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama3",
    "prompt": "Explain reverse tunneling"
  }'
```

---

# 6. Performance Optimization

## 6.1 CPU Optimization
- Use quantized models (Q4_K_M)
- Increase swap cautiously
- Use high-core-count CPUs

## 6.2 GPU Optimization
- Ensure latest NVIDIA drivers
- Use CUDA-enabled environment
- Allocate sufficient VRAM
- Avoid oversubscribing GPU memory

## 6.3 Disk Optimization
- Use NVMe SSD
- Avoid network-mounted storage for model files

---

# 7. Security Considerations

- Default API binds to localhost only
- Do not expose port 11434 publicly without authentication
- Use reverse proxy + authentication for remote access
- Restrict firewall access
- Monitor system resource consumption

---

# 8. Production Deployment Architecture

Recommended setup:

Client → Reverse Proxy (Nginx/Caddy) → Ollama API → Model Runtime

Enhancements:
- Rate limiting
- Access control
- TLS termination
- Logging and monitoring

---

# 9. Common Troubleshooting

### Out of Memory
- Use smaller or quantized model
- Increase RAM
- Close background applications

### Slow Inference
- Use GPU
- Switch to quantized model
- Upgrade storage to NVMe

### GPU Not Detected
- Verify drivers
- Check CUDA installation
- Confirm Docker GPU passthrough

---

# 10. Analytical Summary

Ollama enables secure, local-first AI model execution across macOS, Linux, Windows, and containerized environments. Performance scales linearly with memory, CPU cores, and GPU VRAM availability.

For research and controlled environments, CPU-only deployments are viable. For production or heavy inference workloads, GPU acceleration is strongly recommended.

Ollama’s architecture makes it suitable for:
- Air-gapped systems
- Enterprise AI pipelines
- Development environments
- Edge computing nodes
- Secure research labs

---

Prepared for internal technical reference and operational use by iPRISM Research Group. Distribution or external reproduction is not authorized without prior approval.