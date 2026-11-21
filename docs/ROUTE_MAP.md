# Complete Application Route Inventory & Map

**Document Version:** 1.1.0 (Phase 2.1 Refinement)  
**Product Brand:** **Kiaan AI Studio**  
**Tagline:** *Create Beyond Imagination.*  
**Status:** 100% Configured & Verified in Phase 2.1  
**Router Configuration File:** [`frontend/src/routes/index.jsx`](file:///c:/Users/Kiaan%20technology/Desktop/AI%20image%20video/frontend/src/routes/index.jsx)  

---

## 1. Master Route Directory (39 Registered Routes)

| # | Route Path | Component | Shell Layout | Description |
| :---: | :--- | :--- | :--- | :--- |
| **PUBLIC & MARKETING ROUTES** | | | | |
| 1 | `/` | `HomePage` | `PublicLayout` | Main marketing landing page with hero and feature showcases |
| 2 | `/features` | `FeaturesPage` | `PublicLayout` | Generative visual capabilities and tool overview |
| 3 | `/pricing` | `PricingPage` | `PublicLayout` | Tier comparison (Starter, Creator, Pro Studio, Enterprise) |
| 4 | `/about` | `AboutPage` | `PublicLayout` | Product mission and sovereign open weights commitment |
| 5 | `/contact` | `ContactPage` | `PublicLayout` | Support desk and enterprise cluster consultation inquiries |
| 6 | `/privacy` | `PrivacyPage` | `PublicLayout` | Data sovereignty and zero foundation training guarantee |
| 7 | `/terms` | `TermsPage` | `PublicLayout` | Commercial ownership rights and terms of service |
| **AUTHENTICATION ROUTES** | | | | |
| 8 | `/login` | `LoginPage` | `PublicLayout` | Studio sign-in with interactive preview session switchers |
| 9 | `/register` | `RegisterPage` | `PublicLayout` | New creator account registration |
| 10| `/forgot-password` | `ForgotPasswordPage` | `PublicLayout` | Account password recovery with confirmation status |
| **CUSTOMER STUDIO ROUTES** | | | | |
| 11| `/dashboard` | `DashboardOverviewPage` | `CustomerLayout` | Creator dashboard overview, quick-launch tools, credit counter |
| 12| `/dashboard/image-generator` | `ImageGeneratorPage` | `CustomerLayout` | Sub-second text-to-image synthesis with FLUX.2 Klein |
| 13| `/dashboard/video-generator` | `VideoGeneratorPage` | `CustomerLayout` | Cinematic text-to-video synthesis with Wan 2.1 |
| 14| `/dashboard/image-to-image` | `ImageToImagePage` | `CustomerLayout` | Multimodal reference restyling and transformation |
| 15| `/dashboard/image-editor` | `ImageEditorPage` | `CustomerLayout` | Inpainting brush canvas and context-aware editing |
| 16| `/dashboard/image-to-video` | `ImageToVideoPage` | `CustomerLayout` | Static photograph animation with 3D DiT dynamics |
| 17| `/dashboard/generations` | `GenerationsPage` | `CustomerLayout` | Personal media history with metadata inspection |
| 18| `/dashboard/projects` | `ProjectsPage` | `CustomerLayout` | Nested project folders and campaign workspaces |
| 19| `/dashboard/downloads` | `DownloadsPage` | `CustomerLayout` | Presigned S3 downloads and bulk ZIP archives |
| 20| `/dashboard/credits` | `CreditsPage` | `CustomerLayout` | Real-time wallet balance and consumption ledger |
| 21| `/dashboard/subscription` | `SubscriptionPage` | `CustomerLayout` | Recurring quota management and billing tier updates |
| 22| `/dashboard/settings` | `SettingsPage` | `CustomerLayout` | User profile, security credentials, and studio preferences |
| 23| `/dashboard/support` | `SupportPage` | `CustomerLayout` | Customer support inquiries and ticket desk |
| **ADMIN PORTAL ROUTES** | | | | |
| 24| `/admin` | `AdminOverviewPage` | `AdminLayout` | Fleet governance overview and system KPI status |
| 25| `/admin/users` | `AdminUsersPage` | `AdminLayout` | User management and role-based access control (RBAC) |
| 26| `/admin/plans` | `AdminPlansPage` | `AdminLayout` | Subscription tier and pricing quota configuration |
| 27| `/admin/credits` | `AdminCreditsPage` | `AdminLayout` | Global double-entry credit ledger and balance governance |
| 28| `/admin/image-jobs` | `AdminImageJobsPage` | `AdminLayout` | Real-time image generation task telemetry |
| 29| `/admin/video-jobs` | `AdminVideoJobsPage` | `AdminLayout` | Real-time video generation task telemetry |
| 30| `/admin/models` | `AdminModelsPage` | `AdminLayout` | AI model catalog, active status toggles, and weight integrity |
| 31| `/admin/gpu` | `AdminGpuPage` | `AdminLayout` | Physical compute hardware telemetry and VRAM allocations |
| 32| `/admin/queue` | `AdminQueuePage` | `AdminLayout` | BullMQ queue latency, depth, and worker concurrency |
| 33| `/admin/revenue` | `AdminRevenuePage` | `AdminLayout` | MRR analytics, charge logs, and payment gateway health |
| 34| `/admin/analytics` | `AdminAnalyticsPage` | `AdminLayout` | Platform-wide generation volume and model distribution |
| 35| `/admin/failed-jobs` | `AdminFailedJobsPage` | `AdminLayout` | Dead-Letter Queue (DLQ) inspection and error stack traces |
| 36| `/admin/support` | `AdminSupportPage` | `AdminLayout` | Customer ticket queue and goodwill compensation actions |
| 37| `/admin/audit-logs` | `AdminAuditLogsPage` | `AdminLayout` | Security audit trail of administrative actions |
| 38| `/admin/settings` | `AdminSettingsPage` | `AdminLayout` | Global platform toggles and maintenance mode controls |
| **ERROR HANDLING ROUTE** | | | | |
| 39| `*` (Catch-All) | `NotFoundPage` | `PublicLayout` | Styled 404 page with return home & studio actions |

---

## 2. Navigation & Access Controls

- **Unified Navigation:** Both Customer and Admin layouts provide top-bar Profile Menus and bottom-sidebar links to switch between workspaces.
- **Functional Logout:** Available in both the sidebar footer and the Profile Menu dropdown. Clicking "Log Out" clears active mock user state, marks `logged_out` in session storage, and redirects to `/login`.
- **Session Preview:** The `/login` page provides quick single-click login actions ("Creator Role" and "Admin Role") for local development review.
