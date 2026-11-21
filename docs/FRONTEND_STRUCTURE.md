# Frontend Architecture & Directory Structure

**Document Version:** 1.1.0 (Phase 2.1 Refinement)  
**Target Audience:** Intern Developers & Incoming Senior Engineers  
**Product Brand:** **Kiaan AI Studio**  
**Tagline:** *Create Beyond Imagination.*  
**App Location:** `frontend/src/`  

---

## 1. Directory Layout & Organization

The React application is structured to enforce clear separation of concerns, high modularity, and beginner-friendly maintainability:

```
frontend/src/
├── assets/                  # Static assets (SVGs, logos, background graphics)
├── components/
│   ├── common/              # Shared high-level components (Logo, RoutePlaceholder)
│   ├── navigation/          # Breadcrumbs, ProfileMenu dropdown
│   └── ui/                  # Reusable design primitives (Button, Card, Input, Select, Badge, Modal, Spinner)
├── context/                 # React Context providers (AuthContext, authContextInstance)
├── hooks/                   # Custom React hooks (useAuth, useBreakpoint)
├── layouts/                 # Root shell layouts with nested Outlets
│   ├── PublicLayout.jsx     # Marketing site header, footer, mobile drawer
│   ├── CustomerLayout.jsx   # Studio collapsible sidebar, credit counter, user profile, logout
│   └── AdminLayout.jsx      # Specialized admin sidebar, system status indicator, logout
├── mocks/                   # Structured mock fixtures (models, users, plans)
├── pages/
│   ├── public/              # Home, Features, Pricing, About, Contact, Privacy, Terms, 404
│   ├── auth/                # Login, Register, Forgot Password
│   ├── customer/            # 13 Studio pages (Dashboard, ImageGen, VideoGen, Inpaint, etc.)
│   └── admin/               # 15 Admin pages (Users, Plans, Credits, GPU, Queues, etc.)
├── routes/
│   └── index.jsx            # Master nested route configuration (AppRoutes)
├── services/
│   └── api.js               # Pre-configured Axios instance with interceptors
├── styles/                  # Global CSS styles (index.css)
├── utils/
│   └── cn.js                # Tailwind class-merging helper function
├── App.jsx                  # Root component (wraps BrowserRouter and AuthProvider)
└── main.jsx                 # Vite application entry point
```

---

## 2. Core Architectural Conventions

### 2.1 Reusable UI Primitives (`src/components/ui/`)
All basic building blocks are located in `src/components/ui/`. They accept standard HTML attributes and use `cn()` for styling flexibility:
- **`Button.jsx`**: Supports variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `gradient`), sizes (`sm`, `md`, `lg`), loading spinner state (`isLoading`), and left/right icon slots.
- **`Card.jsx`**: Provides `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` with dark backdrop-blur styling.
- **`Input.jsx`**: Accessible form text input with optional label, helper text, error text, and left/right icons.
- **`Select.jsx`**: Dropdown select with custom chevron arrow and error state.
- **`Badge.jsx`**: Pill tags (`default`, `primary`, `success`, `warning`, `danger`, `outline`).
- **`Modal.jsx`**: Accessible dialog overlay with backdrop click and Escape key dismissal.
- **`LoadingSpinner.jsx`**: Inline or full-page spinning indicator.
- **`EmptyState.jsx`**: Dashed border placeholder with icon, title, description, and action button.
- **`ErrorState.jsx`**: Warning box with retry action.

### 2.2 Navigation Primitives (`src/components/navigation/`)
- **`ProfileMenu.jsx`**: Shared dropdown menu with clickable avatar, user details, role badge, profile/settings links, click-outside dismissal, Escape key handling, and functional mock logout.
- **`Breadcrumbs.jsx`**: Automatic URL path breadcrumbs generator.

### 2.3 Common Components (`src/components/common/`)
- **`Logo.jsx`**: Renders the official geometric 'K' symbol with violet-to-cyan gradient and wordmark.
- **`RoutePlaceholder.jsx`**: Standard module template featuring product-facing empty states, capability lists, and system connection status. Internal phase references are strictly forbidden.

### 2.4 Shell Layouts (`src/layouts/`)
- **`PublicLayout.jsx`**: Houses the marketing header, public navigation, and footer. Child routes render inside `<Outlet />`.
- **`CustomerLayout.jsx`**: Manages the collapsible 13-item customer sidebar, header credit counter, ProfileMenu, and sidebar bottom logout.
- **`AdminLayout.jsx`**: Manages the 15-item administrative sidebar, system status banner, ProfileMenu, and sidebar bottom logout.

---

## 3. How to Add a New Page (Step-by-Step)

Follow these simple steps whenever a new route or view is needed:

### Step 1: Create the Page Component
Create a new file in `src/pages/customer/` or `src/pages/admin/`:
```jsx
import React from 'react'
import { RoutePlaceholder } from '../../components/common/RoutePlaceholder'

export function MyNewToolPage() {
  return (
    <RoutePlaceholder
      title="My Creative Tool"
      description="Brief summary of what this tool accomplishes."
      category="Creation Studio"
      features={[
        'First core capability',
        'Second core capability'
      ]}
    />
  )
}
```

### Step 2: Register the Route in `src/routes/index.jsx`
Import your page and add the `<Route>` element inside the corresponding layout group.

### Step 3: Add to Navigation Arrays
Add an item entry with label, route `to`, and Lucide icon in `CustomerLayout.jsx` or `AdminLayout.jsx`.

### Step 4: Verify Integrity
Run `npm run lint; npm test; npm run build` to verify clean compilation.
