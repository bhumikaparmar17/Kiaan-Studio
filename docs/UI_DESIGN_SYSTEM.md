# UI Design System & Component Guidelines

**Document Version:** 1.1.0 (Phase 2.1 Refinement)  
**Product Brand:** **Kiaan AI Studio**  
**Tagline:** **Create Beyond Imagination.**  
**Design Philosophy:** Dark Premium Creative Studio Aesthetic  
**Implementation Framework:** Tailwind CSS v4 + Pure JavaScript JSX  

---

## 1. Official Brand Identity & Visual Tokens

The user interface is engineered for digital artists, creative agencies, and production studios. It features deep neutral backgrounds, crisp border lines, and sophisticated violet-to-cyan creative accents.

### 1.1 Official Wordmark & Logo Mark
- **Product Name:** **Kiaan AI Studio**
- **Tagline:** *Create Beyond Imagination.*
- **Monogram Icon:** A custom geometric 'K' symbol crafted from faceted polygon vectors.
  - **Stem:** Rounded vertical bar with indigo gradient (`#818cf8` to `#6366f1`).
  - **Upper Wing:** Angled facet with violet-to-sky gradient (`#a855f7` to `#38bdf8`).
  - **Lower Wing:** Angled facet with indigo-to-cyan gradient (`#6366f1` to `#06b6d4`).
  - **Neural Sparkle Core:** Crisp white central focus circle.
- **Favicon:** Encoded as vector SVG in `frontend/public/favicon.svg`.

### 1.2 Color Tokens
- **Backgrounds:**
  - Base Studio Canvas: `bg-neutral-950` (`#0a0a0a`)
  - Elevated Cards / Shells: `bg-neutral-900/60` (`#171717`) with `backdrop-blur-sm`
  - Subtle Sub-panels: `bg-neutral-950/80` or `bg-neutral-900/30`
- **Borders & Dividers:**
  - Primary Border: `border-neutral-800` (`#262626`)
  - Highlight Border: `border-neutral-700/80` (`#404040`)
  - Active Ring: `ring-indigo-500` or `ring-cyan-400`
- **Typography:**
  - Primary Text: `text-white` / `text-neutral-100` (`#f5f5f5`)
  - Secondary Text: `text-neutral-400` (`#a3a3a3`)
  - Muted / Helper Text: `text-neutral-500` (`#737373`)
- **Accents:**
  - Creative Primary: `violet-600` (`#7c3aed`), `indigo-500` (`#6366f1`), and `cyan-400` (`#22d3ee`)
  - Success / Active: `emerald-400` (`#34d399`) / `emerald-950`
  - Administrative / Warning: `amber-400` (`#fbbf24`) / `amber-950`
  - Error / Danger: `rose-500` (`#f43f5e`) / `rose-950`

---

## 2. Core Navigation & Account Components

### 2.1 Profile Dropdown Menu (`src/components/navigation/ProfileMenu.jsx`)
Shared across the Customer Studio and Admin Portal:
- **Trigger:** Displays user initials in a gradient badge with name, role, and animated chevron.
- **Interaction:**
  - Opens/closes on click.
  - Automatically closes on outside click via document listener.
  - Closes on `Escape` key and returns focus to trigger button.
- **Menu Items:**
  - User Header: Full name, email, role badge (`Creator` or `Super Admin`), and plan tier.
  - "My Profile" (`/dashboard/settings` or `/admin/settings`).
  - "Settings".
  - Divider.
  - "Log Out": Calls `logout()` and redirects immediately to `/login`.

### 2.2 Reusable Logo (`src/components/common/Logo.jsx`)
```jsx
import { Logo } from '../components/common/Logo'

// Standard Full Wordmark Header
<Logo to="/" />

// Compact Sidebar Rail (Symbol Only)
<Logo to="/dashboard" showWordmark={false} size="sm" />

// Admin Custom Badge
<Logo to="/admin" badgeText="Admin" />
```

---

## 3. Product-Facing Empty States & Module Templates

Customer and admin views must **never** display internal project management phases, roadmap milestones, or fake metrics. Instead, clean product-facing empty states are used:

### 3.1 Empty State Conventions (`src/components/ui/EmptyState.jsx` & `RoutePlaceholder.jsx`)
- **Generation History:**
  - *Title:* "No generations yet."
  - *Description:* "When you generate images or videos using the studio tools, your visual assets will appear here in your personal library."
- **My Projects:**
  - *Title:* "No projects created yet."
  - *Description:* "Create a project folder to organize your visual marketing campaigns and creative assets."
- **Downloads:**
  - *Title:* "No downloads available."
  - *Description:* "Generated assets ready for high-resolution export will appear here."
- **GPU Fleet Monitoring:**
  - *Title:* "Monitoring data is not connected."
  - *Description:* "Connect compute worker nodes to view real-time hardware telemetry and VRAM utilization."
- **Queue Operations:**
  - *Title:* "No active queue data."
  - *Description:* "Task queues will display real-time throughput when jobs are dispatched by creators."

---

## 4. Current Mock Authentication Limitations

1. **Local Exploration Only:** The current authentication state (`AuthContext.jsx`) operates in memory and syncs with `sessionStorage` under `kiaan_mock_session_state`.
2. **Explicit Logout:** Clicking "Log Out" in either the sidebar or profile menu marks the session as `logged_out`, clears active user memory, and redirects to `/login`.
3. **No Automatic Regeneration:** Refreshing the page while logged out maintains the logged-out state. Users can re-enter via "Sign In as Creator" or "Sign In as Admin" on the login page.
4. **Security Boundary:** Real backend password verification, HTTP-only cookie issuance, and JWT rotation are scheduled for **Phase 7**. Current mock auth is strictly for UI development and layout testing.
