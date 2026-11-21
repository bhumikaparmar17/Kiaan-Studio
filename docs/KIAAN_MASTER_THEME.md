# Kiaan Studio — Master Design System & Theme Specification

**Document Version:** 1.0.0  
**Status:** Extracted Reference Specification (Pending Approval)  
**Target Framework:** React + Vite + Tailwind CSS v4  
**Brand:** **Kiaan AI Studio** (*Create Beyond Imagination.*)  

---

## 1. Executive Summary

This specification extracts the design tokens, visual atmosphere, typographic hierarchy, ambient glowing lighting, futuristic HUD elements, and interactive component styles from the provided reference interface and establishes a single reusable source of truth for **Kiaan AI Studio**.

### Visual Atmosphere & Identity
- **Aesthetic:** Deep Cyber-Studio / High-Tech Futuristic Cinematic Workspace.
- **Palette Foundation:** Rich deep-violet obsidian surfaces (`#14121f`, `#0e0c1a`, `#1c1a27`) accented by electric cyan neural glows (`#00f0ff`, `#00dbe9`), hot magenta/fuchsia creative triggers (`#ff479c`, `#ffb0ca`), and warm sunset amber particle highlights (`#ffb690`, `#ffcfb8`).
- **Surface Elevation:** Multi-layered translucent panels (`backdrop-blur-xl`, `bg-surface-container-low/90`) bordered by crisp low-contrast glass outlines (`#3b494b`, `#363342`) with focused neon drop shadows.
- **Lighting & Ambiance:** Soft contained ambient glow orbs behind content blocks with subtle pulsating HUD badges.

---

## 2. Reusable Design Tokens

### 2.1 Color Tokens (Exact Reference Hex Codes)

#### Surfaces & Backgrounds
| Token Name | Hex Code | Tailwind v4 Variable / Utility | Role & Usage |
| :--- | :--- | :--- | :--- |
| **`surface-container-lowest`** | `#0e0c1a` | `--color-surface-container-lowest` | Ultra-deep black-violet canvas, header glass backdrops, inputs |
| **`surface` / `background`** | `#14121f` | `--color-surface` | Primary page body background, base viewport background |
| **`surface-container-low`** | `#1c1a27` | `--color-surface-container-low` | Bento card backings, floating prompt bar backplate |
| **`surface-container`** | `#201e2c` | `--color-surface-container` | Standard elevated cards, metrics containers |
| **`surface-container-high`** | `#2b2836` | `--color-surface-container-high` | Interactive parameter chips, secondary hover targets |
| **`surface-container-highest`**| `#363342` | `--color-surface-container-highest`| Highlighted active nav items, tab bars, high-contrast borders |
| **`surface-bright`** | `#3a3746` | `--color-surface-bright` | Button hover surfaces, elevated popovers |
| **`surface-dim`** | `#14121f` | `--color-surface-dim` | Recessed canvas wells |
| **`surface-variant`** | `#363342` | `--color-surface-variant` | Muted card outlines and accent backdrops |
| **`inverse-surface`** | `#e5e0f3` | `--color-inverse-surface` | High-contrast light inverse overlays |

#### Primary (Electric Cyan / Neural Pipeline)
| Token Name | Hex Code | Tailwind v4 Variable / Utility | Role & Usage |
| :--- | :--- | :--- | :--- |
| **`primary-container`** | `#00f0ff` | `--color-primary-container` | Main neon cyan accent, glowing action indicators, active HUD |
| **`primary`** | `#dbfcff` | `--color-primary` | High-visibility primary heading text, glowing typography |
| **`primary-fixed`** | `#7df4ff` | `--color-primary-fixed` | Button hover states, active glows |
| **`primary-fixed-dim`** | `#00dbe9` | `--color-primary-fixed-dim` | Telemetry readouts, throughput badges |
| **`on-primary`** | `#00363a` | `--color-on-primary` | Text/icons on solid primary backgrounds |
| **`on-primary-container`** | `#006970` | `--color-on-primary-container` | Text/icons placed directly on `#00f0ff` |
| **`on-primary-fixed`** | `#002022` | `--color-on-primary-fixed` | Dark typography on cyan badges |
| **`on-primary-fixed-variant`**| `#004f54` | `--color-on-primary-fixed-variant`| Subtle cyan decorative borders |
| **`inverse-primary`** | `#006970` | `--color-inverse-primary` | Inverted primary accent |
| **`surface-tint`** | `#00dbe9` | `--color-surface-tint` | Glass tint overlay filter |

#### Secondary (Hot Magenta / Creative Trigger)
| Token Name | Hex Code | Tailwind v4 Variable / Utility | Role & Usage |
| :--- | :--- | :--- | :--- |
| **`secondary-container`** | `#ff479c` | `--color-secondary-container` | Primary CTA buttons, action buttons, launch triggers |
| **`secondary`** | `#ffb0ca` | `--color-secondary` | Secondary text highlights, active icons, remix buttons |
| **`secondary-fixed`** | `#ffd9e3` | `--color-secondary-fixed` | Highlighted badges |
| **`secondary-fixed-dim`** | `#ffb0ca` | `--color-secondary-fixed-dim` | Subdued magenta chips |
| **`on-secondary`** | `#640036` | `--color-on-secondary` | Contrast text on solid magenta buttons |
| **`on-secondary-container`** | `#58002f` | `--color-on-secondary-container` | Deep contrast text on secondary container |
| **`on-secondary-fixed`** | `#3e001f` | `--color-on-secondary-fixed` | High-contrast label text |
| **`on-secondary-fixed-variant`**| `#8d004e` | `--color-on-secondary-fixed-variant`| Border accents on secondary components |

#### Tertiary (Sunset Amber / Particle Spectral)
| Token Name | Hex Code | Tailwind v4 Variable / Utility | Role & Usage |
| :--- | :--- | :--- | :--- |
| **`tertiary`** | `#fff3ef` | `--color-tertiary` | Warm white highlights, light accent text |
| **`tertiary-container`** | `#ffcfb8` | `--color-tertiary-container` | Particle badges, warm glows |
| **`tertiary-fixed`** | `#ffdbca` | `--color-tertiary-fixed` | Warm ambient chips |
| **`tertiary-fixed-dim`** | `#ffb690` | `--color-tertiary-fixed-dim` | Gradient stop with magenta, 3D workflow badges |
| **`on-tertiary`** | `#552100` | `--color-on-tertiary` | Dark brown-orange text on tertiary buttons |
| **`on-tertiary-container`** | `#9d4300` | `--color-on-tertiary-container` | Mid-tone label text |
| **`on-tertiary-fixed`** | `#341100` | `--color-on-tertiary-fixed` | Dark typography on amber chips |
| **`on-tertiary-fixed-variant`**| `#783200` | `--color-on-tertiary-fixed-variant`| Warm border accent |

#### Content, Text & Neutral Outlines
| Token Name | Hex Code | Tailwind v4 Variable / Utility | Role & Usage |
| :--- | :--- | :--- | :--- |
| **`on-surface`** | `#e5e0f3` | `--color-on-surface` | Primary crisp body and headline text |
| **`on-surface-variant`** | `#b9cacb` | `--color-on-surface-variant` | Secondary descriptions, subheaders, helper labels |
| **`outline`** | `#849495` | `--color-outline` | Focused input borders, highlighted dividers |
| **`outline-variant`** | `#3b494b` | `--color-outline-variant` | Card glass borders, subtle divider lines |
| **`on-background`** | `#e5e0f3` | `--color-on-background` | Default canvas text color |
| **`inverse-on-surface`** | `#312f3d` | `--color-inverse-on-surface` | Text on inverted surface |

#### Semantic Status & Alerts
| Token Name | Hex Code | Tailwind v4 Variable / Utility | Role & Usage |
| :--- | :--- | :--- | :--- |
| **`error`** | `#ffb4ab` | `--color-error` | Validation errors, failed inference notifications |
| **`error-container`** | `#93000a` | `--color-error-container` | Error banner background |
| **`on-error`** | `#690005` | `--color-on-error` | High contrast text on error |
| **`on-error-container`** | `#ffdad6` | `--color-on-error-container` | Error message typography |
| **`success`** | `#34d399` | `--color-success` (Existing) | Successful jobs, completed generations |

---

### 2.2 Typography Tokens

The reference uses 3 complementary typefaces:
1. **Headlines & Display:** `Space Grotesk` (Geometric, futuristic, wide aperture)
2. **Body & UI Text:** `Plus Jakarta Sans` (Clean, highly legible humanist sans)
3. **Telemetry & HUD Labels:** `JetBrains Mono` (Monospaced, technical precision)

| Scale Name | Font Family | Size (rem / px) | Line Height | Letter Spacing | Font Weight |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`display-hero`** | `Space Grotesk` | `3.00rem` (48px) ? md: `4.25rem` (68px) | `3.50rem` / `4.75rem` | `-0.03em` | 700 (Bold) |
| **`headline-lg`** | `Space Grotesk` | `2.00rem` (32px) ? md: `2.50rem` (40px) | `2.50rem` / `3.00rem` | `-0.02em` | 700 (Bold) |
| **`headline-lg-mobile`**| `Space Grotesk` | `1.50rem` (24px) | `2.00rem` | `-0.01em` | 700 (Bold) |
| **`headline-md`** | `Space Grotesk` | `1.25rem` (20px) | `1.75rem` | `0.01em` | 600 (Semi-bold) |
| **`body-lg`** | `Plus Jakarta Sans` | `1.00rem` (16px) | `1.50rem` | `0em` | 400 (Regular) |
| **`body-md`** | `Plus Jakarta Sans` | `0.875rem` (14px) | `1.25rem` | `0em` | 400 (Regular) / 500 |
| **`body-sm`** | `Plus Jakarta Sans` | `0.75rem` (12px) | `1.00rem` | `0.01em` | 400 (Regular) / 500 |
| **`label-code`** | `JetBrains Mono` | `0.75rem` (12px) | `1.00rem` | `0.05em` | 500 (Medium) |
| **`label-badge`** | `Space Grotesk` | `0.6875rem` (11px) | `0.875rem` | `0.08em` | 700 (Bold) |

---

### 2.3 Spacing & Layout Tokens

| Token Name | Value | Pixel Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| **`space-xs`** | `0.25rem` | 4px | Micro-gaps between status dots and badges |
| **`space-sm`** | `0.5rem` | 8px | Button padding, icon spacing |
| **`space-md`** | `1.0rem` | 16px | Card inner content padding, input field padding |
| **`space-lg`** | `1.5rem` | 24px | Card headers, grid gutters, modal padding |
| **`space-xl`** | `2.5rem` | 40px | Section vertical rhythm, hero padding |
| **`gutter`** | `1.0rem` | 16px | Mobile screen edge margins |
| **`gutter-desktop`** | `1.5rem` | 24px | Desktop container edge margins (`max-w-7xl mx-auto`) |
| **`margin-desktop`** | `2.0rem` | 32px | Major component lateral separation |

---

### 2.4 Border Radii

| Token Name | Value | Application |
| :--- | :--- | :--- |
| **`rounded-DEFAULT`** | `0.25rem` (4px) | Small badges, audio scrubber segments |
| **`rounded-md`** | `0.375rem` (6px) | Compact action triggers |
| **`rounded-lg`** | `0.5rem` (8px) | Navigation links, buttons, inputs, HUD overlays |
| **`rounded-xl`** | `0.75rem` (12px) | Standard cards, floating prompt matrix docks |
| **`rounded-2xl`** | `1.0rem` (16px) | Bento cards, viewport containers, major modal dialogs |
| **`rounded-full`** | `9999px` | Avatars, status indicators, pill tags |

---

### 2.5 Gradients, Shadows & Neon Glow Effects

#### Gradients
- **Hero Title Text Gradient:**  
  `bg-gradient-to-r from-primary-container via-secondary to-tertiary-fixed-dim bg-clip-text text-transparent`  
  *Colors: Cyan (`#00f0ff`) ? Magenta (`#ffb0ca`) ? Warm Amber (`#ffb690`)*
- **Primary CTA Button Gradient:**  
  `bg-gradient-to-r from-secondary-container to-tertiary-fixed-dim text-on-secondary`  
  *Colors: Magenta (`#ff479c`) ? Warm Amber (`#ffb690`)*
- **Viewport Frame Gradient Border:**  
  `bg-gradient-to-b from-primary-container/30 via-secondary-container/20 to-transparent`
- **Ambient Glow Backdrop:**  
  `bg-gradient-to-r from-secondary-container/25 via-primary-container/20 to-tertiary-fixed-dim/20 blur-[130px]`
- **Card Media Scrim:**  
  `bg-gradient-to-t from-surface-container-low via-transparent to-transparent`

#### Shadows & Neon Halos
- **Magenta Action Button Glow:**  
  `shadow-[0_0_25px_rgba(255,71,156,0.6)] hover:shadow-[0_0_35px_rgba(0,240,255,0.7)]`
- **Cyan Synthesize Button Glow:**  
  `shadow-[0_0_18px_rgba(0,240,255,0.5)] hover:shadow-[0_0_24px_rgba(0,240,255,0.8)]`
- **Floating Glass Prompt Dock Shadow:**  
  `shadow-[0_12px_45px_rgba(0,0,0,0.5),0_0_28px_rgba(0,240,255,0.15)]`
- **Studio Frame Shadow:**  
  `shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(255,71,156,0.18)]`
- **Header Glass Shadow:**  
  `shadow-[0_1px_8px_rgba(0,0,0,0.04)]`

#### Interactive Hover & Animation Effects
- **Button Micro-Interactions:** `active:scale-95 transition-all` and `hover:scale-[1.02]`
- **Bento Card Lift:** `hover:-translate-y-1 transition-transform duration-300`
- **Image Zoom on Hover:** `group-hover:scale-105 transition-transform duration-500`
- **HUD Live Pulse:** `animate-ping` and `animate-pulse` on neural status indicators

---

## 3. Component Style Audit & Translation Matrix

This matrix establishes how our existing shared UI components in `frontend/src/components/ui/` and `frontend/src/components/studio/` will map to the new tokens without changing their DOM structure, props, or behavior.

| Component | Current Class Pattern | New Themed Class Pattern | Preserved Behavior |
| :--- | :--- | :--- | :--- |
| **`Button.jsx`** (`variant="gradient"`) | `bg-gradient-to-r from-indigo-500 to-violet-600 text-white` | `bg-gradient-to-r from-secondary-container to-tertiary-fixed-dim text-on-secondary shadow-[0_0_20px_rgba(255,71,156,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]` | All `isLoading`, icons, sizes, click events preserved |
| **`Button.jsx`** (`variant="primary"`) | `bg-indigo-600 hover:bg-indigo-500 text-white` | `bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(0,240,255,0.4)] hover:bg-primary-fixed hover:shadow-[0_0_24px_rgba(0,240,255,0.7)] font-headline-md uppercase tracking-wider` | Preserves all variants & disable states |
| **`Button.jsx`** (`variant="secondary"`) | `bg-neutral-800 border-neutral-700 text-neutral-100` | `bg-surface-container-high/90 text-primary border border-outline-variant hover:bg-surface-bright` | Preserved |
| **`Card.jsx`** | `bg-neutral-900/60 border-neutral-800/80` | `bg-surface-container border border-outline-variant/60 rounded-2xl shadow-xl backdrop-blur-md` | Subcomponents (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) unchanged |
| **`Input.jsx`** | `bg-neutral-900 border-neutral-700` | `bg-surface-container-lowest/90 border border-outline-variant text-primary placeholder-on-surface-variant focus:ring-2 focus:ring-primary-container focus:border-primary-container` | All input types, helper text, error text preserved |
| **`Select.jsx`** | `bg-neutral-900 border-neutral-700` | `bg-surface-container-lowest border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary-container` | Native select accessibility & options intact |
| **`Badge.jsx`** | `bg-indigo-950/80 text-indigo-300 border-indigo-800` | `bg-surface-container-high text-primary border border-primary-container/30 font-label-code uppercase tracking-wider` | Preserved |
| **`Modal.jsx`** | `bg-neutral-900 border-neutral-800` | `bg-surface-container-low border border-outline-variant text-on-surface shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(0,240,255,0.15)]` | Escape key, backdrop click, focus management untouched |
| **`StudioUI.jsx`** (`Panel`) | `bg-white rounded-2xl border-neutral-200` | `bg-surface-container-low rounded-2xl border border-outline-variant shadow-lg text-on-surface` | Children & layout preserved |
| **`StudioUI.jsx`** (`StatCard`) | `bg-white border-neutral-200` | `bg-surface-container rounded-xl border border-outline-variant p-space-lg text-on-surface relative overflow-hidden group hover:bg-surface-container-high transition-colors` | Preserved |
| **`StudioUI.jsx`** (`SegmentedTabs`) | `bg-neutral-100 border-neutral-200` | `bg-surface-container-lowest border border-outline-variant p-1 rounded-xl` (Active tab: `bg-surface-container-highest text-primary-container shadow-sm border border-primary-container/20`) | Controlled state untouched |
| **`StudioUI.jsx`** (`SearchField`) | `bg-neutral-50 border-neutral-300` | `bg-surface-container-lowest border border-outline-variant text-primary placeholder-on-surface-variant focus:border-primary-container` | Controlled state untouched |

---

## 4. Phased Migration Plan

This plan details how the visual styles will be phased in sequentially. At every step, existing components, route maps, auth mocks, and business logic remain functional.

```
+--------------------------------------------------------+
¦ Phase 0: Design Tokens & Font Configuration (Baseline)  ¦
¦  - Mount Plus Jakarta Sans, Space Grotesk, JetBrains   ¦
¦  - Define Tailwind CSS v4 @theme token variables      ¦
+--------------------------------------------------------+
                           ¦
                           ?
+--------------------------------------------------------+
¦ Phase 1: Landing Page Visual Elevation                 ¦
¦  - Navbar: glass container-lowest with blurred header  ¦
¦  - Hero: glow orbs, Space Grotesk headline gradient    ¦
¦  - Floating prompt HUD matrix bar styling              ¦
¦  - Showcase cards: bento layout, neon hover rings      ¦
¦  - Footer: multi-column telemetry strip                ¦
+--------------------------------------------------------+
                           ¦
                           ?
+--------------------------------------------------------+
¦ Phase 2: Login & Signup Modal System                   ¦
¦  - AuthModal dialog: surface-container-low glass       ¦
¦  - Neon form fields with cyan focus halo               ¦
¦  - Carousel container: high-tech preview frame         ¦
¦  - Demo Access switcher: cyberpunk role credentials    ¦
+--------------------------------------------------------+
                           ¦
                           ?
+--------------------------------------------------------+
¦ Phase 3: Customer Studio & Creative Workstations      ¦
¦  - CustomerLayout shell: deep violet navigation rail   ¦
¦  - Text-to-Image & Image-to-Image studios              ¦
¦  - AI Video Generator & Image-to-Video timelines       ¦
¦  - Inpainting Canvas: cybernetic canvas HUD frame      ¦
¦  - Asset Management: Generations, Projects, Downloads  ¦
¦  - Account & Billing: Credits, Subscriptions, Settings ¦
+--------------------------------------------------------+
                           ¦
                           ?
+--------------------------------------------------------+
¦ Phase 4: Admin Portal Governance Dashboard             ¦
¦  - AdminLayout shell: cybernetic telemetric header     ¦
¦  - GPU Cluster & Queue Telemetry screens               ¦
¦  - Models, User Governance & Revenue tables            ¦
¦  - Final cross-browser and regression verification     ¦
+--------------------------------------------------------+
```

### Detailed Phase Milestones

#### Phase 0: Foundation Tokens (Zero Risk)
1. Add Google Fonts links to `frontend/index.html` (`Space Grotesk`, `Plus Jakarta Sans`, `JetBrains Mono`).
2. Integrate the reference color tokens directly into `frontend/src/index.css` using Tailwind CSS v4 `@theme` block.
3. Validate `npm run build` to confirm zero regression.

#### Phase 1: Landing Page Transformation
1. Update `NavbarMegaMenu.jsx` with `bg-surface-container-lowest/80` and `backdrop-blur-xl`.
2. Update `HeroSection.jsx` with the ambient glow backdrop, `font-display-hero`, and text gradient.
3. Apply HUD prompt matrix styling to the sample prompt bar.
4. Style `CreativeShowcaseSection.jsx`, `HowItWorksSection.jsx`, and `PricingSection.jsx` using `bg-surface-container-low` bento cards and neon hover effects.
5. Update `PremiumFooter.jsx` with `bg-surface-container-lowest` and node status indicator.

#### Phase 2: Auth System (Login & Register)
1. Style `AuthModal.jsx`, `AuthForm.jsx`, and `AuthLayout.jsx` with `surface-container-lowest` and cyan focus rings.
2. Update `DemoAccess.jsx` role switch buttons with magenta and cyan accent states.
3. Preserve all mock authentication state handlers (`useAuth()`, session storage, and role routing).

#### Phase 3: Customer Studio (Creation Tools & Asset Management)
1. Update `CustomerLayout.jsx` sidebar and header with deep violet surface colors and glowing active states.
2. Elevate `StudioUI.jsx` (Panels, StatCards, SegmentedTabs, LightSelect, SearchField) to the dark cyber-studio theme.
3. Update Text-to-Image, AI Video Generator, Image-to-Image, Image Editor, and Image-to-Video pages.
4. Update My Generations, My Projects, Downloads, Credits & Usage, Subscription, Settings, and Support.

#### Phase 4: Admin Dashboard & Telemetry
1. Update `AdminLayout.jsx` with dark obsidian sidebar and glowing GPU cluster status lights.
2. Apply the cyber-studio table and metric card styles across Admin Overview, Users, GPU Infrastructure, and Queue Telemetry pages.
3. Execute end-to-end verification (`npm run lint`, `npm test`, `npm run build`).

---

## 5. Compliance & Guardrails Checklist

- [x] **No functional changes:** Handlers, state variables, routes, and auth contexts are unchanged.
- [x] **No HTML replacement:** Component hierarchies and React JSX structures are preserved.
- [x] **No vendor lock-in:** Tailored for Tailwind CSS v4 with standard CSS variables.
- [x] **Branding preserved:** All references retain **Kiaan AI Studio** branding and assets.
- [x] **Ready for step-by-step approval:** No source files are modified during this extraction turn.
