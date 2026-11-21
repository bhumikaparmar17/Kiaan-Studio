# Frontend Setup & Developer Manual

**Document Version:** 1.0.0  
**Target Audience:** Intern Developers & Full-Stack Engineers  
**App Location:** `frontend/`  
**Prerequisites:** Node.js v20+ LTS, npm v10+  

---

## 1. Quick Start Guide

To launch the frontend application locally, open a terminal in the project directory:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install all dependencies (first time only)
npm install

# 3. Start the local Vite development server
npm run dev
```

The application will start immediately at:
👉 **`http://localhost:5173`** (or `http://127.0.0.1:5173`)

Open this URL in your web browser. You can navigate between the Public Landing Page, Customer Studio (`/dashboard`), and Admin Portal (`/admin`).

---

## 2. Available NPM Scripts

All commands must be executed from inside the `frontend/` directory:

| Command | Purpose | When to Use |
| :--- | :--- | :--- |
| `npm run dev` | Starts the local Vite development server with Hot Module Replacement (HMR). | Daily development. |
| `npm run build` | Compiles and bundles production-ready static assets into `frontend/dist/`. | Pre-commit check to ensure zero build errors. |
| `npm run lint` | Runs the high-speed `oxlint` linter across all JavaScript and JSX files. | Before pushing code to check for syntax/unused imports. |
| `npm test` | Executes the automated component & route integrity smoke test suite. | Verification of all 63 required files and mock fixtures. |
| `npm run preview` | Serves the built `dist/` directory locally to preview the production bundle. | Performance & production asset verification. |

---

## 3. Technology Stack & Key Dependencies

- **Build Tool:** Vite 8.x
- **Framework:** React 19.x (Standard JavaScript JSX)
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite`
- **Routing:** React Router v7 (`react-router-dom`)
- **HTTP Client:** Axios v1.x (configured in `src/services/api.js`)
- **Icons:** Lucide React (`lucide-react`)
- **Utility Classes:** `clsx` and `tailwind-merge` (via `src/utils/cn.js`)

> [!IMPORTANT]
> **Strict Rules:**
> - Do **NOT** install TypeScript or rename files to `.ts` / `.tsx`.
> - Do **NOT** install Next.js or SSR frameworks.
> - Do **NOT** install heavy animation or UI component kits. Use the reusable primitives in `src/components/ui/`.

---

## 4. Troubleshooting Common Issues

### Issue A: Port 5173 is already in use
If another process is using port 5173, Vite will automatically offer the next available port (e.g. 5174). To force port 5173, stop the other process or run:
```bash
npx vite --port 5173
```

### Issue B: Tailwind classes are not applying
Verify that `frontend/src/index.css` begins with:
```css
@import "tailwindcss";
```
Tailwind v4 is integrated natively through the `@tailwindcss/vite` plugin inside `frontend/vite.config.js`. Do not create a legacy `tailwind.config.js` or `postcss.config.js`.

### Issue C: ESLint / Oxlint warning about unused imports
Run `npm run lint` to view any unused identifiers. Remove unused imports before committing.

