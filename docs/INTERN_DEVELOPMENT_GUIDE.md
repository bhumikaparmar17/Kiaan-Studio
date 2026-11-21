# Intern Developer Onboarding & Execution Guide

**Document Version:** 1.0.0  
**Target Audience:** Intern Software Engineers & Junior Developers  
**Author:** Principal Software Architect & Technical Lead  
**Scope:** Clear task boundaries, local setup instructions, testing conventions, and handover protocols.

---

## 1. Welcome & Development Philosophy

Welcome to the Self-Hosted AI Image & Video SaaS platform team! 

As the primary developer leading early development, your mission is to build a rock-solid, beginner-friendly, and beautifully structured foundation. You are paired with the Antigravity AI assistant to implement frontend user interfaces, dashboards, backend APIs, and database migrations.

### Core Philosophy:
- **Build Step-by-Step:** Implement one authorized phase at a time. Do not jump ahead.
- **Simplicity Over Cleverness:** Write clean, readable, self-documenting JavaScript.
- **Strict Stack Rules:**
  - **YES:** React.js (Vite), JavaScript JSX, Tailwind CSS, React Router, Axios, Lucide React, Node.js, Express.js, MySQL.
  - **NO:** Never use Next.js. Never use TypeScript. Never use external generative AI APIs (OpenAI, Midjourney, Replicate).
- **Mock First:** In Phases 2 through 5, build complete user interfaces using realistic mock data files. You do **not** need to touch real AI models or GPUs.

---

## 2. Phase Ownership & Responsibility Breakdown

| Phase Category | Phase Numbers & Names | Who Builds It? | What is Required? |
| :--- | :--- | :---: | :--- |
| **Intern Independent Phases** | **Phase 2:** React Frontend Foundation<br>**Phase 3:** Public Website & Auth UI<br>**Phase 4:** Customer Dashboard (Mock Data)<br>**Phase 5:** Admin Dashboard (Mock Data)<br>**Phase 6:** Node.js Backend Foundation<br>**Phase 7:** Local MySQL & Authentication<br>**Phase 8:** Frontend/Backend Integration | **INTERN** | Implement modular code, test locally in browser, write basic unit/integration tests, and ensure zero console errors. |
| **Joint Phase (Requires Senior Review)** | **Phase 9:** Subscriptions & Credit System | **INTERN + SENIOR REVIEW** | Intern implements plan CRUD, UI, and base ledger. **Senior Architect must review and approve** 2PC locking, idempotency, and Stripe webhooks before proceeding. |
| **Senior Reserved Phases** | **Phase 10:** AI Engine & GPU Infrastructure<br>**Phase 11:** Production Readiness & Launch | **SENIOR DEVELOPERS** | Reserved for senior infrastructure and AI leads (Python, PyTorch, CUDA, Diffusers, ComfyUI, Redis/BullMQ, Docker clustering, and production cloud deployment). |

---

## 3. Local Development & Testing Instructions

### 3.1 Frontend Development (Phases 2 – 5, 8)
- **Prerequisites:** Node.js 20 LTS installed locally.
- **Starting the Dev Server:**
  ```bash
  cd "c:\Users\Kiaan technology\Desktop\AI image video"
  npm run dev
  ```
  Open `http://localhost:5173` in your browser.
- **Testing Your Frontend Work:**
  1. Open DevTools (`F12`) $\rightarrow$ check the **Console** tab. There should be zero red errors or unhandled warnings.
  2. Toggle mobile/tablet/desktop screen sizes to verify responsive Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
  3. Verify that all buttons, modals, dropdowns, and form inputs function smoothly with mock data.
  4. Run production build test:
     ```bash
     npm run build
     ```
     Ensure the build succeeds without bundle or syntax errors.

### 3.2 Backend Development (Phases 6 – 8)
- **Starting the Express Server:**
  ```bash
  npm run server:dev
  ```
  API will listen on `http://localhost:5000`.
- **Testing the Health Endpoint:**
  ```bash
  curl http://localhost:5000/api/v1/health
  ```
  Should return:
  ```json
  { "success": true, "data": { "status": "healthy", "uptime": 12.4 } }
  ```
- **Running Backend Automated Tests:**
  ```bash
  npm test
  ```
  Ensure all Jest / Supertest test cases pass.

### 3.3 Local Database (Phase 7 – 9)
- Run migrations:
  ```bash
  npm run db:migrate
  ```
- Verify database tables in MySQL Workbench or CLI (`USE antigravity_saas; SHOW TABLES;`).
- **Safety Rule:** Never attempt to connect to remote or production databases. Always use `localhost` with a dedicated local development user.

---

## 4. How to Report Errors & Roadblocks

If you encounter an error or unexpected bug during development:

1. **Capture Exact Details:**
   - What file were you editing?
   - What command or action triggered the error?
   - Copy the exact error message and stack trace from the terminal or browser console.
2. **Consult Phase Documentation:**
   - Check the relevant architecture file in [`docs/`](file:///c:/Users/Kiaan%20technology/Desktop/AI%20image%20video/docs) (e.g., [`API_SPECIFICATION.md`](file:///c:/Users/Kiaan%20technology/Desktop/AI%20image%20video/docs/API_SPECIFICATION.md) for expected request/response formats).
3. **Formulate a Clear Blocker Report:**
   - **Summary:** One-sentence description of the issue.
   - **Observed Behavior:** What actually happened.
   - **Expected Behavior:** What the documentation specified.
   - **Suspected Cause:** Your initial hypothesis.
4. **Use Antigravity:** Ask Antigravity to analyze the stack trace and suggest a fix following the minimal complexity rule.

---

## 5. Senior Handover Protocols

When handing over work (especially at Phase 8 completion, during Phase 9 review, or before Phase 10):

### 5.1 Pre-Handover Checklist
- [ ] All code for the phase is committed with clear, descriptive commit messages.
- [ ] No temporary `console.log` statements or commented-out dead code left behind.
- [ ] All environment variables are documented in `.env.example` (never commit real secrets).
- [ ] `npm run build` (frontend) and `npm test` (backend) pass with zero errors.
- [ ] Mock data fixtures are cleanly isolated in `/src/mocks/` and labeled as mock.

### 5.2 Handover Briefing Template
Submit a handover note containing:
1. **Completed Phase:** (e.g., Phase 8 — Frontend/Backend Integration).
2. **What Was Built:** Summary of pages, endpoints, and components created.
3. **Verification Evidence:** Confirmation that tests pass and manual browser verification succeeded.
4. **Known Limitations / Stubs:** Explicitly list any placeholder actions (e.g., "AI generation button returns simulated job ID because GPU workers are deferred to Phase 10").
5. **Next Required Action:** Awaiting senior architect review or approval for the next phase.

