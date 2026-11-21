# RESTful API Specification & Contract

**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Planning (Phase 1)  
**Author:** Principal SaaS Backend Lead & Security Architect  
**Base URL:** `https://api.antigravity.local/api/v1`  
**Protocol:** HTTPS / WSS / Server-Sent Events (SSE)  

---

## 1. Global API Conventions & Standards

### 1.1 Authentication & Request Headers
- All protected endpoints require a Bearer token: `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
- Client requests modifying state should pass a correlation ID: `X-Request-Id: <UUIDv4>`.
- Mutating financial operations require an idempotency key: `Idempotency-Key: <UUIDv4>`.

### 1.2 Standard Success Response Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "c1f4e4e0-9114-47dc-905a-8b89cfc0d01a",
    "timestamp": "2026-11-12T11:45:00.000Z"
  }
}
```

### 1.3 Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Available balance of 5 credits is lower than required 12 credits.",
    "details": []
  },
  "meta": {
    "requestId": "c1f4e4e0-9114-47dc-905a-8b89cfc0d01a",
    "timestamp": "2026-11-12T11:45:00.000Z"
  }
}
```

---

## 2. Authentication & User Management Endpoints

### 2.1 User Registration
- **Route:** `POST /auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "artist@studio.com",
    "password": "SecurePassword123!",
    "fullName": "Jane Doe"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_99182371",
        "email": "artist@studio.com",
        "fullName": "Jane Doe",
        "role": "creator",
        "status": "ACTIVE"
      },
      "accessToken": "eyJhbGciOiJIUzI1...",
      "expiresIn": 900
    }
  }
  ```

### 2.2 User Login
- **Route:** `POST /auth/login`
- **Auth:** Public
- **Response (200 OK):** Sets httpOnly `refreshToken` cookie and returns short-lived `accessToken` in JSON.

### 2.3 Token Refresh
- **Route:** `POST /auth/refresh`
- **Auth:** Public (Reads httpOnly `refreshToken` cookie)
- **Response (200 OK):** Returns fresh `accessToken`.

### 2.4 User Profile & Quotas
- **Route:** `GET /users/me`
- **Auth:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "usr_99182371",
      "email": "artist@studio.com",
      "fullName": "Jane Doe",
      "role": "creator",
      "wallet": {
        "balance": 580,
        "reserved": 12,
        "available": 568
      },
      "subscription": {
        "tier": "Pro Studio",
        "status": "ACTIVE",
        "currentPeriodEnd": "2026-12-01T00:00:00.000Z"
      }
    }
  }
  ```

---

## 3. Subscription & Credit Wallet Endpoints

### 3.1 Get Credit Balance & Wallet State
- **Route:** `GET /credits/balance`
- **Auth:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalBalance": 600,
      "reservedCredits": 12,
      "availableCredits": 588,
      "lifetimeGranted": 1200,
      "lifetimeSpent": 612
    }
  }
  ```

### 3.2 Credit Transaction History
- **Route:** `GET /credits/transactions?page=1&limit=20`
- **Auth:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "tx_812739",
          "type": "SETTLE",
          "amount": -1,
          "balanceAfter": 588,
          "description": "FLUX.2 Klein 4B 1024x1024 generation",
          "jobId": "job_01j98127381",
          "createdAt": "2026-11-12T11:42:15.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 142 }
    }
  }
  ```

### 3.3 Create Top-Up Checkout Session
- **Route:** `POST /credits/topup`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "packSlug": "credits-500",
    "successUrl": "https://app.antigravity.local/wallet?success=true",
    "cancelUrl": "https://app.antigravity.local/wallet?canceled=true"
  }
  ```
- **Response (200 OK):** Returns Stripe Checkout URL:
  ```json
  {
    "success": true,
    "data": {
      "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4..."
    }
  }
  ```

---

## 4. AI Generation Orchestration Endpoints

### 4.1 Submit Image Generation Job
- **Route:** `POST /generate/image`
- **Auth:** Bearer Token
- **Header:** `Idempotency-Key: <UUID>`
- **Request Body:**
  ```json
  {
    "model": "flux-2-klein-4b",
    "jobType": "TEXT_TO_IMAGE",
    "prompt": "Cinematic portrait of an astronaut on a neon alien planet, bioluminescent flora, octane render, 8k",
    "negativePrompt": "blurry, low quality, distorted hands",
    "parameters": {
      "width": 1024,
      "height": 1024,
      "steps": 4,
      "guidanceScale": 3.5,
      "seed": 428912,
      "numOutputs": 1
    },
    "projectId": "proj_01j9812001"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job_01j98127381",
      "status": "QUEUED",
      "queuePosition": 2,
      "estimatedWaitSeconds": 2.5,
      "creditsReserved": 1,
      "streamUrl": "/api/v1/generate/jobs/job_01j98127381/stream"
    }
  }
  ```

### 4.2 Submit Video Generation Job
- **Route:** `POST /generate/video`
- **Auth:** Bearer Token
- **Header:** `Idempotency-Key: <UUID>`
- **Request Body:**
  ```json
  {
    "model": "wan-2.1-t2v-14b",
    "jobType": "TEXT_TO_VIDEO",
    "prompt": "Slow aerial dolly zoom into an ancient cyberpunk temple during rain, high dynamic range",
    "parameters": {
      "width": 1280,
      "height": 720,
      "durationSeconds": 5.0,
      "fps": 16,
      "steps": 50,
      "seed": 109283
    },
    "projectId": "proj_01j9812001"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job_vid_01j982299",
      "status": "QUEUED",
      "queuePosition": 1,
      "estimatedWaitSeconds": 48.0,
      "creditsReserved": 25,
      "streamUrl": "/api/v1/generate/jobs/job_vid_01j982299/stream"
    }
  }
  ```

### 4.3 Get Job Status & Result
- **Route:** `GET /generate/jobs/:jobId`
- **Auth:** Bearer Token
- **Response (200 OK - Finished State):**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job_01j98127381",
      "status": "COMPLETED",
      "jobType": "TEXT_TO_IMAGE",
      "model": "flux-2-klein-4b",
      "executionTimeMs": 1140,
      "creditCost": 1,
      "assets": [
        {
          "assetId": "ast_01j9812999",
          "mimeType": "image/webp",
          "width": 1024,
          "height": 1024,
          "fileSizeBytes": 1420980,
          "downloadUrl": "https://storage.antigravity.local/assets/ast_01j9812999.webp?token=exp17000...",
          "thumbnailUrl": "https://storage.antigravity.local/thumbs/ast_01j9812999_thumb.webp",
          "blurhash": "LEHLh[WB2yk8pyo0adR*.7kCMdnj"
        }
      ],
      "completedAt": "2026-11-12T11:42:16.000Z"
    }
  }
  ```

### 4.4 Real-Time Job Progress Stream (Server-Sent Events)
- **Route:** `GET /generate/jobs/:jobId/stream`
- **Auth:** Bearer Token (or short-lived query token)
- **Content-Type:** `text/event-stream`
- **Event Stream Sequence:**
  ```
  event: state_change
  data: {"status": "RUNNING", "progress": 10, "message": "Allocated to GPU Worker #2"}

  event: progress
  data: {"status": "RUNNING", "progress": 60, "step": 3, "totalSteps": 4}

  event: state_change
  data: {"status": "POST_PROCESSING", "progress": 90, "message": "Encoding WebP and uploading to S3"}

  event: completed
  data: {"status": "COMPLETED", "progress": 100, "assetUrl": "https://storage.antigravity.local/..."}
  ```

### 4.5 Cancel Queued Job
- **Route:** `POST /generate/jobs/:jobId/cancel`
- **Auth:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job_01j98127381",
      "status": "CANCELLED",
      "creditsRefunded": 1
    }
  }
  ```

---

## 5. Asset & Project Management Endpoints

### 5.1 List User Assets
- **Route:** `GET /assets?page=1&limit=30&mediaType=IMAGE&projectId=proj_01j9812001`
- **Auth:** Bearer Token
- **Response (200 OK):** Paginated asset collection with direct download links and metadata.

### 5.2 Get Direct Presigned Asset Download URL
- **Route:** `GET /assets/:assetId/download`
- **Auth:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "presignedUrl": "https://storage.antigravity.local/assets/raw-ast_01j9812999.png?X-Amz-Expires=900...",
      "expiresInSeconds": 900
    }
  }
  ```

### 5.3 Delete Asset (Soft Delete)
- **Route:** `DELETE /assets/:assetId`
- **Auth:** Bearer Token
- **Response (200 OK):** Confirms soft deletion; asset removed from UI view.

---

## 6. Admin & Fleet Telemetry Endpoints (Admin RBAC Only)

### 6.1 GPU Fleet Status
- **Route:** `GET /admin/workers`
- **Auth:** Admin Bearer Token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalWorkers": 4,
      "online": 4,
      "busy": 2,
      "idle": 2,
      "workers": [
        {
          "workerId": "wrk_rtx4090_01",
          "hostname": "gpu-node-alpha-1",
          "pool": "IMAGE_POOL",
          "gpu": "NVIDIA GeForce RTX 4090",
          "totalVramMb": 24564,
          "usedVramMb": 14210,
          "temperatureC": 58,
          "utilizationPercent": 94,
          "activeJobId": "job_01j98127381"
        }
      ]
    }
  }
  ```

### 6.2 BullMQ Queue Analytics
- **Route:** `GET /admin/queues`
- **Auth:** Admin Bearer Token
- **Response (200 OK):** Real-time metrics for waiting, active, completed, failed, and delayed job counts across all queue partitions.

---

## 7. Internal Worker RPC Endpoints (Private VPC Only)

### 7.1 Worker Heartbeat
- **Route:** `POST /internal/workers/heartbeat`
- **Auth:** Mutual TLS / Internal Worker Secret Header
- **Request Body:**
  ```json
  {
    "workerUuid": "wrk_rtx4090_01",
    "status": "ONLINE",
    "usedVramMb": 14210,
    "temperatureC": 58
  }
  ```

### 7.2 Worker Job Progress / Completion Hook
- **Route:** `POST /internal/workers/job-update`
- **Auth:** Internal Worker Secret Header
- **Request Body:**
  ```json
  {
    "jobId": "job_01j98127381",
    "workerUuid": "wrk_rtx4090_01",
    "status": "COMPLETED",
    "executionTimeMs": 1140,
    "asset": {
      "storageBucket": "antigravity-media",
      "storageKey": "assets/ast_01j9812999.webp",
      "mimeType": "image/webp",
      "fileSizeBytes": 1420980,
      "width": 1024,
      "height": 1024
    }
  }
  ```

