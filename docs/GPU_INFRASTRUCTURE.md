# GPU Infrastructure, Sizing, and Economic Unit Cost Analysis

**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Planning (Phase 1)  
**Author:** Principal ML Infrastructure Architect & Financial Modeling Lead  
**Scope:** Mathematical modeling of GPU compute costs, capacity sizing, storage/bandwidth overhead, and break-even subscription economics.

---

## 1. Hardware Candidates & Cloud Rental Market Comparison

To achieve maximum cost efficiency, our infrastructure uses dedicated bare-metal GPU instances and specialized GPU clouds (e.g., RunPod, Vast.ai, Lambda Labs) rather than overpriced general-purpose hyper-scalers (e.g., AWS EC2 on-demand without reserved instances).

| GPU Model | VRAM & Architecture | Typical Rental Rate (On-Demand / Spot) | Strengths | Suitable Platform Role |
| :--- | :--- | :--- | :--- | :--- |
| **NVIDIA RTX 4090** | 24 GB GDDR6X (Ada Lovelace) | **$0.45 – $0.65 / hr** (RunPod / Vast) | Highest FP8/FP16 compute per dollar; 83 TFLOPS; 1008 GB/s memory bandwidth | **Primary Image Pool** (FLUX.2 Klein 4B / Z-Image) & **Draft Video Pool** (Wan 1.3B) |
| **NVIDIA A10G** | 24 GB GDDR6 (Ampere) | **$0.95 – $1.15 / hr** (AWS g5.xlarge) | Enterprise SLA, available on Tier-1 clouds, hardware reliability | Secondary / Enterprise image fallback |
| **NVIDIA L4** | 24 GB GDDR6 (Ada Lovelace) | **$0.70 – $0.85 / hr** (GCP g2-standard) | Low power (72W), good FP8 density, cloud managed | Alternate image worker |
| **NVIDIA RTX 6000 Ada** | 48 GB GDDR6 (Ada Lovelace) | **$1.45 – $1.85 / hr** (RunPod / Lambda) | 48GB VRAM enables unquantized video inference without offloading | **Primary Cinema Video Pool** (Wan 2.1 14B) |
| **NVIDIA A100** | 80 GB HBM2e (Ampere SXM4) | **$1.85 – $2.40 / hr** (RunPod / Lambda) | Massive 2039 GB/s memory bandwidth; native BF16 video rendering | **High-Throughput Cinema Video Pool** |
| **NVIDIA H100** | 80 GB HBM3 (Hopper SXM5) | **$3.20 – $4.50 / hr** | Unmatched transformer speed, FP8 Tensor Cores | Scale-stage batch video generation |

---

## 2. Mathematical Cost Formulations

### 2.1 Compute Cost per Successful Generation Formula
The raw compute cost per generated asset is expressed as:

$$Cost_{compute} = \left( \frac{t_{cycle\_seconds}}{3600} \right) \times \frac{Rate_{GPU\_hourly}}{U_{utilization}}$$

Where:
- $t_{cycle\_seconds} = t_{inference} + t_{io\_encode}$ (Total worker wall-clock seconds consumed per job).
- $Rate_{GPU\_hourly} =$ Effective hourly rental cost of the GPU worker.
- $U_{utilization} =$ Active worker utilization factor ($0.0 < U \le 1.0$) accounting for idle gaps between jobs.

### 2.2 Total Cost of Goods Sold (COGS) Formula
$$Cost_{total} = Cost_{compute} + Cost_{storage} + Cost_{bandwidth} + Cost_{moderation}$$

Where:
- $Cost_{storage} = \text{Asset Size (GB)} \times \$0.015/\text{GB/month} \times \text{Retention Months}$.
- $Cost_{bandwidth} = \text{Asset Size (GB)} \times Rate_{egress}$ (Equal to $\$0.00$ when utilizing Cloudflare R2).
- $Cost_{moderation} \approx \$0.00005$ per invocation for local automated safety embeddings.

---

#
# 3. Unit Generation Cost Analysis

### 3.1 FLUX.2 Klein 4B (Image Generation)
- **Target GPU:** NVIDIA RTX 4090 ($0.50 / hour on-demand).
- **Inference Time ($t_{inference}$):** 1.1 seconds (4 steps, 1024×1024, FP8).
- **I/O & Post-Processing Time ($t_{io}$):** 0.4 seconds (VAE decode, WebP encoding, S3 upload).
- **Total Cycle Time ($t_{cycle}$):** 1.5 seconds.
- **Maximum Theoretical Hourly Throughput:** $3600 / 1.5 = 2,400$ images/hour/GPU.
- **Unit Compute Cost at 100% Saturation:**
  $$\frac{1.5}{3600} \times \$0.50 = \$0.000208 \text{ per image}$$
- **Unit Compute Cost at 50% Real-World Utilization:**
  $$\frac{\$0.000208}{0.50} = \mathbf{\$0.000416} \approx \mathbf{\$0.00042 \text{ per image}}$$
- **Storage & Bandwidth Overhead (Cloudflare R2):**
  - Average WebP asset size: 1.2 MB ($0.0012$ GB).
  - 1-Year storage cost: $0.0012 \times \$0.015 \times 12 = \$0.000216$.
  - Bandwidth egress: $\$0.000000$ (Cloudflare R2 zero-egress policy).
- **Total Blended Cost per Image:** $\mathbf{\$0.00064}$ (Less than one-tenth of one cent).

### 3.2 Wan 2.1 1.3B (Fast Draft Video)
- **Target GPU:** NVIDIA RTX 4090 ($0.50 / hour on-demand).
- **Inference Time ($t_{inference}$):** 22.0 seconds (50 steps, 854×480, 81 frames).
- **I/O & Post-Processing Time ($t_{io}$):** 3.0 seconds (FFmpeg H.264 encode, S3 upload).
- **Total Cycle Time ($t_{cycle}$):** 25.0 seconds.
- **Maximum Theoretical Hourly Throughput:** $3600 / 25 = 144$ videos/hour/GPU.
- **Unit Compute Cost at 100% Saturation:**
  $$\frac{25.0}{3600} \times \$0.50 = \$0.00347 \text{ per 5s video}$$
- **Unit Compute Cost at 50% Real-World Utilization:**
  $$\frac{\$0.00347}{0.50} = \mathbf{\$0.00694} \approx \mathbf{\$0.0070 \text{ per video}}$$
- **Storage Overhead (Cloudflare R2):**
  - Average MP4 size: 4.5 MB ($0.0045$ GB).
  - 1-Year storage cost: $0.0045 \times \$0.015 \times 12 = \$0.00081$.
- **Total Blended Cost per Draft Video:** $\mathbf{\$0.0078}$ (Less than one cent).

### 3.3 Wan 2.1 14B / Wan 2.2 MoE (Cinematic 720p Video)
- **Target GPU:** NVIDIA A100 80GB SXM4 ($2.20 / hour on-demand).
- **Inference Time ($t_{inference}$):** 45.0 seconds (50 steps, 1280×720, 81 frames, native BF16).
- **I/O & Post-Processing Time ($t_{io}$):** 5.0 seconds (FFmpeg H.264 high-profile encode, S3 upload).
- **Total Cycle Time ($t_{cycle}$):** 50.0 seconds.
- **Maximum Theoretical Hourly Throughput:** $3600 / 50 = 72$ videos/hour/GPU.
- **Unit Compute Cost at 100% Saturation:**
  $$\frac{50.0}{3600} \times \$2.20 = \$0.03055 \text{ per 5s video}$$
- **Unit Compute Cost at 50% Real-World Utilization:**
  $$\frac{\$0.03055}{0.50} = \mathbf{\$0.0611} \approx \mathbf{\$0.061 \text{ per video}}$$
- **Storage Overhead (Cloudflare R2):**
  - Average MP4 size: 9.0 MB ($0.009$ GB).
  - 1-Year storage cost: $0.009 \times \$0.015 \times 12 = \$0.00162$.
- **Total Blended Cost per Cinema Video:** $\mathbf{\$0.0627}$ (~$0.063 per 5-second 720p video).

---

## 4. Multi-Stage Operational Scenarios & Monthly Expenses

### Scenario 1: Bootstrap / MVP Stage (100 Active Paid Subscribers)
- **Monthly Usage Volume:**
  - 50,000 FLUX.2 Klein Images.
  - 2,000 Wan 2.1 Draft Videos.
  - 500 Wan 2.1 14B Cinema Videos.
- **Provisioned Infrastructure:**
  - 1× RTX 4090 Dedicated Warm Instance (Images & Draft Video): $0.50/hr \times 730\text{ hrs} = \$365.00$.
  - 1× A100 80GB On-Demand / Spot Instance (active ~15 hours/mo): $\$33.00$.
  - App Server & Database (1× Hetzner Cloud CX41 / 16GB RAM): $\$25.00$.
  - Cloudflare R2 Storage (100 GB media assets): $\$1.50$.
- **Total Monthly Operational Cost:** **$424.50 / month**.
- **Projected Revenue:** 100 subscribers @ $29.00 average blended ARPU = **$2,900.00 / month**.
- **Gross Profit Margin:** **85.4%**.

### Scenario 2: Growth Stage (1,000 Active Paid Subscribers)
- **Monthly Usage Volume:**
  - 600,000 FLUX.2 Klein Images.
  - 25,000 Wan 2.1 Draft Videos.
  - 8,000 Wan 2.1 14B Cinema Videos.
- **Provisioned Infrastructure:**
  - 3× RTX 4090 Dedicated Instances (Image Pool): $3 \times \$365.00 = \$1,095.00$.
  - 2× RTX 4090 Dedicated Instances (Draft Video Pool): $2 \times \$365.00 = \$730.00$.
  - 2× A100 80GB Dedicated Instances (Cinema Video Pool): $2 \times \$1,606.00 = \$3,212.00$.
  - High-Availability MySQL 8.0 Primary + Replica + Redis Cluster: $\$280.00$.
  - Cloudflare R2 Storage (1.5 TB media): $\$22.50$.
- **Total Monthly Operational Cost:** **$5,339.50 / month**.
- **Projected Revenue:** 1,000 subscribers @ $29.00 average ARPU = **$29,000.00 / month**.
- **Gross Profit Margin:** **81.6%**.

### Scenario 3: Scale Stage (10,000 Active Paid Subscribers)
- **Monthly Usage Volume:**
  - 7,000,000 FLUX.2 Klein Images.
  - 300,000 Wan 2.1 Draft Videos.
  - 100,000 Wan 2.1 14B Cinema Videos.
- **Provisioned Infrastructure:**
  - 20× RTX 4090 Image Cluster: $\$7,300.00$.
  - 15× RTX 4090 Draft Video Cluster: $\$5,475.00$.
  - 18× A100 80GB Cinema Video Cluster (Reserved Pricing @ $1.70/hr): $\$22,338.00$.
  - Distributed Database, Redis Shards, Monitoring Cluster: $\$1,800.00$.
  - Storage & CDN Delivery (20 TB): $\$300.00$.
- **Total Monthly Operational Cost:** **$37,213.00 / month**.
- **Projected Revenue:** 10,000 subscribers @ $32.00 blended ARPU = **$320,000.00 / month**.
- **Gross Profit Margin:** **88.4%**.

---

## 5. Subscription Plan Break-Even & Unit Economics

| Subscription Tier | Monthly Price | Monthly Credits Granted | Max Generation Mix per Quota | Total Platform COGS | Gross Profit Margin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Creator** | **$19.00 / mo** | 600 credits | 500 Images (500 cr) + 8 Draft Videos (96 cr) | Compute: $0.21 (Images) + $0.06 (Video) + $0.08 (Storage) = **$0.35** | **98.1%** |
| **Pro Studio** | **$49.00 / mo** | 2,000 credits | 1,500 Images (1,500 cr) + 20 Cinema Videos (500 cr) | Compute: $0.63 (Images) + $1.26 (Video) + $0.24 (Storage) = **$2.13** | **95.6%** |
| **Enterprise** | **$199.00 / mo** | 10,000 credits | 6,000 Images (6,000 cr) + 160 Cinema Videos (4,000 cr) | Compute: $2.52 (Images) + $10.08 (Video) + $1.15 (Storage) = **$13.75** | **93.1%** |

### Key Economic Takeaways:
1. **Incredible Unit Margin:** Self-hosting open-weight models on bare-metal GPU clusters allows the platform to achieve **>90% gross profit margins** on software subscriptions.
2. **Break-Even Analysis:** A single $19/mo Creator plan breaks even on compute after generating only 29,680 FLUX.2 images or 2,714 draft videos—volumes virtually impossible for a single human user to consume in a month under normal usage patterns.
3. **Queue Wait Times:**
   - Image generation queues maintain an average waiting time of $< 1.5$ seconds under normal load.
   - Video generation queues maintain an average waiting time of $< 25$ seconds for priority subscribers.

