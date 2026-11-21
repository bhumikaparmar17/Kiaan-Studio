# Product Requirements Document (PRD)
## Self-Hosted AI Image & Video Generation SaaS Platform

**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Planning (Phase 1)  
**Author:** Principal AI Systems & SaaS Architect  
**Target Environment:** Self-Hosted Private Cloud / Dedicated GPU Cluster  

---

## 1. Executive Summary

The Self-Hosted AI Image & Video Generation SaaS is a high-performance, cost-efficient, enterprise-ready creative production platform. It enables individual digital artists, creative agencies, game developers, marketing teams, and enterprise clients to generate, edit, and orchestrate visual media using state-of-the-art open-weight generative diffusion models.

Unlike third-party wrapper SaaS products that rely on closed vendor APIs (e.g., OpenAI DALL-E 3, Midjourney API proxies, or RunwayML APIs), this platform is completely self-hosted on bare-metal and cloud GPU infrastructure. It achieves:
1. **Zero External API Margin Loss:** Eliminates per-generation vendor markup, slashing inference unit costs by 60%–85%.
2. **Predictable Latency & Guaranteed Capacity:** Dedicated GPU worker pools eliminate external API rate limiting and queue starvation.
3. **Enterprise Compliance & Data Sovereignty:** Prompts, reference images, and generated assets remain strictly within our private virtual cloud (VPC) and object storage.
4. **Permissive Commercial Licensing:** Built exclusively upon models licensed for commercial use (Apache 2.0 and approved open-weight commercial licenses).

---

## 2. Product Vision & Value Proposition

### 2.1 Core Vision
To provide a fast, studio-grade generative AI workstation combining sub-second image synthesis and cinematic video generation with seamless credit-based billing, robust project asset management, and enterprise-grade administration.

### 2.2 Key Value Propositions
- **Unified Creative Studio:** Text-to-Image (T2I), Image-to-Image (I2I), Inpainting, Outpainting, Text-to-Video (T2V), and Image-to-Video (I2V) in a single unified canvas and studio interface.
- **Transparent Credit Economy:** Pay-as-you-go top-ups and recurring subscription tiers with strict transactional idempotency, zero double-billing, and immediate refunds upon job failure.
- **Ultra-Fast Generation Times:**
  - Standard Image (1024×1024): 0.8s – 2.5s via distilled flow-matching/turbo architectures.
  - Cinematic Video (5s, 720p/480p): 45s – 120s on dedicated GPU clusters.
- **Team & Asset Management:** Nested project folders, versioned generations, side-by-side comparison, metadata inspection (seed, prompt, sampler, steps), and one-click asset downloads.

---

## 3. User Personas & Target Segments

| Persona | Description | Primary Needs | Key Pain Points with Incumbents |
| :--- | :--- | :--- | :--- |
| **Solo Creator / Freelancer** | Digital designers, concept artists, social media marketers. | Fast iteration, high aesthetic fidelity, low monthly cost, easy export. | Expensive subscriptions, restrictive credit limits, slow queue times. |
| **Creative Agency / Studio** | Boutique marketing, VFX, and advertising agencies producing campaigns. | Multi-user collaboration, project organization, batch generation, high-res video. | Inability to guarantee data privacy; vendor API rate throttling; high cost of scale. |
| **Enterprise / E-Commerce** | Brands generating catalog imagery, product staging, dynamic video ads. | High uptime (99.9%), API access, strict audit logging, automated moderation, SOC2-readiness. | Vendor lock-in, non-commercial licensing ambiguities, uncontrolled data leakage. |

---

## 4. System Scope & Feature Requirements

### 4.1 Creative Studio & Generative Tools
1. **Text-to-Image (T2I) Engine:**
   - Prompt input with prompt enhancement/assist options.
   - Negative prompt support for supported architectures.
   - Aspect ratio selection (1:1, 16:9, 9:16, 4:3, 3:4, 21:9).
   - Advanced parameters: Steps, Guidance Scale (CFG), Seed control (randomized or locked), Sampler selection.
   - Output resolutions: 512×512, 768×768, 1024×1024, 1280×720, 1920×1080.
2. **Image-to-Image (I2I) & Composition:**
   - Drag-and-drop reference image upload.
   - Denoising strength / reference influence slider (0.0 to 1.0).
   - Multi-reference composition (subject preservation, style transfer).
3. **Inpainting & Outpainting (Canvas Mode):**
   - Interactive brush tool for masking regions.
   - Mask blur and edge feathering.
   - Context-aware fill prompts.
4. **Text-to-Video (T2V) Engine:**
   - Text prompt input with motion intensity / camera trajectory prompts.
   - Duration selector (3 seconds to 5 seconds, 81 frames).
   - Frame rate standard: 16 fps / 24 fps.
5. **Image-to-Video (I2V) Engine:**
   - Upload keyframe image (first frame or start/end frames).
   - Motion dynamics control (pan, zoom, tilt, static ambient).
   - Resolution presets: 480p (854×480) for rapid drafting, 720p (1280×720) for production.

### 4.2 Asset & Workspace Management
- **Asset Gallery:** Grid view with lazy loading, virtual scrolling, and infinite pagination.
- **Metadata Viewer:** Prompt, negative prompt, model ID, seed, sampler, steps, CFG, generation timestamp, compute time, and credit cost.
- **Projects & Folders:** Multi-level folder hierarchies to organize client campaigns.
- **Download Delivery:** Presigned secure download links for individual media files and bulk ZIP downloads.
- **Asset Actions:** Favorite, Tag, Move, Delete, Upscale, and Fork parameters back into studio.

### 4.3 Credit & Subscription Engine
- **Prepaid Credit Wallets:** Real-time balance display updated via WebSockets/SSE.
- **Two-Phase Reservation:** Credits reserved at job submission; finalized on successful completion; immediately refunded on worker error or timeout.
- **Tiered Subscriptions:** Monthly recurring quotas with automatic monthly credit rollover or reset according to plan rules.
- **Credit Top-Up Packs:** One-time Stripe-powered checkout for additional credits.
- **Billing History & Invoicing:** Complete downloadable receipts and transaction ledgers.

### 4.4 Admin Operations & Management Portal
- **Fleet Monitoring:** Real-time GPU worker status (online, busy, offline, VRAM consumption, temperature, GPU utilization).
- **Queue Management:** BullMQ queue depth, active jobs, waiting time, worker throughput, and dead-letter queue (DLQ) inspection.
- **User & Subscription Management:** View users, manually adjust credit balances, suspend accounts, inspect user job histories.
- **Model Registry Management:** Toggle models on/off, change default models, set credit multipliers per model.
- **Audit & Security Logging:** Comprehensive logs of authentication events, admin interventions, credit ledger changes, and moderation violations.

---

## 5. Technology Stack & Constraints

To ensure maximum performance, stability, and maintainability, the following strict technical boundaries are enforced:

| Subsystem | Mandatory Technology | Constraints & Architectural Rules |
| :--- | :--- | :--- |
| **Frontend UI** | **React (Pure JavaScript)** | **Strictly React with standard JavaScript.** Next.js, TypeScript, and heavy SSR frameworks are explicitly disallowed. Single Page Application (SPA) bundled via Vite. |
| **Styling** | **Tailwind CSS** | Utility-first CSS with dark/light mode theming and custom studio component classes. |
| **Backend API** | **Node.js / Express** | RESTful modular architecture, express validator, JWT authentication, Winston logging. |
| **Relational DB** | **MySQL 8.0+** | InnoDB engine, strict foreign key constraints, normalized 3NF schema, row-level locking for credit ledger. |
| **Queue & Cache** | **Redis 7.0+ & BullMQ** | Atomic queue operations, distributed locks (`redlock`), job prioritization, delayed retry handling. |
| **AI Inference** | **Python 3.11+, PyTorch 2.x, CUDA 12.x** | Dedicated worker microservices consuming from BullMQ via Redis. |
| **ML Frameworks** | **Hugging Face Diffusers & ComfyUI** | Standardized Diffusers pipelines for direct API workers; ComfyUI headless execution for complex node workflows. |
| **Storage Layer** | **S3-Compatible Object Storage** | MinIO (self-hosted bare-metal) or Cloudflare R2 / AWS S3 with presigned URL uploads/downloads. |
| **Containerization** | **Docker & Docker Compose** | Reproducible multi-stage Dockerfiles with NVIDIA Container Toolkit runtime (`--gpus all`). |

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performance & Latency Targets
- **API Response Time:** P95 < 80ms for all non-inference read/write REST endpoints.
- **Job Dispatch Latency:** < 150ms from user click to GPU worker reception.
- **Image Generation Turnaround:**
  - Distilled Models (4–8 steps): P95 < 3.0s total user wait time.
  - Standard Models (20–30 steps): P95 < 12.0s total user wait time.
- **Video Generation Turnaround (5s clip):**
  - Fast 480p mode: P95 < 45.0s.
  - HD 720p mode: P95 < 120.0s.
- **Asset Download Delivery:** P95 < 200ms TTFB via direct presigned CDN/object storage URLs.

### 6.2 Availability & Resilience
- **Platform Availability:** 99.5% uptime for the SaaS web application and API gateway.
- **Worker Isolation:** Failure of a GPU worker process must never crash the API server or disrupt other workers.
- **Queue Fault Tolerance:** Redis persistence (AOF + RDB) ensures zero job loss during service restarts.
- **Automatic Job Recovery:** Orphaned jobs (workers crashing mid-inference) are automatically detected via heartbeat timeouts and rescheduled or refunded.

### 6.3 Security & Compliance
- **Authentication:** Dual-token JWT (short-lived Access Token in memory, secure httpOnly Refresh Token in cookie).
- **Role-Based Access Control (RBAC):** Strict separation between `user`, `creator`, `agency_admin`, and `super_admin`.
- **Content Moderation:** Two-stage automated moderation (pre-inference prompt regex/classifier + post-inference safety checker) to prevent illegal content, CSAM, and extreme violence.
- **Data Isolation:** Strict multi-tenant row-level access controls enforced at the API database layer.

---

## 7. Success Metrics & Key Performance Indicators (KPIs)

1. **Generation Success Rate:** $\ge 99.0\%$ of all queued generation jobs complete successfully without worker crashes.
2. **Infrastructure Cost Efficiency:** Average compute cost per image $\le \$0.003$; average compute cost per 5-second video $\le \$0.045$.
3. **Queue Wait Times:** Average queue wait time during peak hours $< 5.0$ seconds for paid subscribers.
4. **Credit Reconciliation Accuracy:** 100.00% audit balance accuracy with zero untracked credit drift.
5. **Gross Margin Target:** $\ge 70\%$ gross profit margin on subscription and credit revenue after GPU rental, storage, and bandwidth expenses.

