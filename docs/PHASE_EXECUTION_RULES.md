# Phase Execution & Governance Rules

**Document Version:** 1.0.0  
**Scope:** Mandatory operational rules governing every development phase from Phase 2 through Phase 11.  
**Authority:** Technical Project Manager & Principal Software Architect  

---

## 1. The 15 Golden Rules of Execution

Every developer, intern, and AI agent working on this codebase must strictly observe these fifteen rules across all phases:

### Rule 1 — Audit Before Action
Before making code changes in any phase, inspect the existing workspace files, directory tree, and dependencies. Never overwrite or duplicate working components without first reviewing their existing implementation.

### Rule 2 — Strict Phase Boundary Adherence
Implement **only** the specific tasks authorized for the current active phase. Never jump ahead to implement features from future phases (e.g., do not attempt Docker or AI inference in Phase 2).

### Rule 3 — Reusability & Modularity
Build components and utilities with clean, single-responsibility boundaries. Shared UI primitives (buttons, inputs, modals, cards) must live in `src/components/common/` and accept standard props.

### Rule 4 — Zero Dependency Bloat
Avoid installing heavy or redundant npm packages. Check if standard JavaScript or existing libraries can solve the problem before running `npm install`. Every dependency must be justified.

### Rule 5 — Simple, Readable JavaScript
Write clean, standard modern JavaScript (ES6+ JSX). Avoid convoluted patterns, excessive meta-programming, or unnecessary abstractions. Code must be easily readable by an intern and instantly reviewable by a senior engineer.

### Rule 6 — Preserve Working Functionality
Never break, refactor, or delete previously verified functionality when implementing new features. Run existing test suites and manual checks to ensure regression-free commits.

### Rule 7 — Zero Production Access Without Approval
Never connect to, query, modify, or provision production databases, production servers, or live cloud infrastructure without explicit written authorization from the project owner.

### Rule 8 — Local-Only Development
All development, database migrations, and testing must be performed strictly within the local development environment (`localhost`, local MySQL, local Node server).

### Rule 9 — Basic Automated Tests
Every backend API endpoint and critical business logic service must be accompanied by basic automated unit or integration tests (using Jest / Supertest). Never ship code with zero test coverage.

### Rule 10 — Verify Before Claiming Completion
Never mark a task or phase as "complete" without empirical verification:
- Frontend: Verify build compiles cleanly (`npm run build`) and renders without console errors.
- Backend: Verify endpoints return expected HTTP status codes and JSON envelopes.
- Database: Verify migrations apply cleanly without foreign key violations.

### Rule 11 — Explicit Labeling of Mock Data
Any mock datasets, placeholder responses, or simulated actions must be explicitly segregated (e.g., inside `src/mocks/`) and clearly labeled with comments (e.g., `// MOCK DATA: Deferred to Phase 10 AI Engine`). Never confuse mock data with live production pipelines.

### Rule 12 — Standardized Phase Completion Report
At the conclusion of each phase, provide a comprehensive report detailing:
1. Files created or modified.
2. Features implemented.
3. Verification results and test output.
4. Confirmation of phase acceptance criteria fulfillment.

### Rule 13 — Transparent Blocker & Pending Task Disclosure
If an issue cannot be resolved within the scope of the current phase, document it clearly as a "Pending Task" or "Blocker". Never hide failing tests or unhandled edge cases.

### Rule 14 — Mandatory Stop & Approval Gate
Upon completing a phase report, **HALT ALL EXECUTION IMMEDIATELY**. Never proceed to the next phase automatically. Wait for explicit approval and authorization from the project owner before starting the next milestone.

### Rule 15 — Dual-Audience Architecture
Keep the codebase structured so that it remains accessible and educational for the intern developer, while maintaining the structural rigor, naming conventions, and scalability demanded by senior architects who will extend it later.

