# Ikigai2 Architecture Rules

**CRITICAL INSTRUCTION FOR ALL AGENTS:**
Before beginning any work or making any assumptions about the codebase, database schema, or authentication flow in this repository, you **MUST** read the following two files in the root directory:
1. `ikigai2-plan.md` - The comprehensive architectural and implementation plan for the Round 2 platform.
2. `ikigai2-progress.md` - The historical context of decisions made and work completed so far.

Failure to read these files will result in catastrophic architectural misalignment (e.g. querying the wrong database, using legacy Round 1 logic, or breaking the assessments schema). Read them first!

## 3. Recent Architectural Updates (Post-Launch Refinements)
- **Nested Routing**: The Admin dashboard relies on React Router's nested routing (`<Outlet />`) via `AdminLayout.jsx`.
- **Hybrid Responsive UI**: Desktop renders a fixed left sidebar (matching `ikigai1`), while mobile renders a sticky bottom navigation bar.
- **Cross-Tab Auth Sync**: `AuthContext.jsx` uses a `storage` event listener to immediately log in/log out across all open browser tabs simultaneously to prevent state corruption.
- **Global Interactions**: All buttons share a global GitHub-style interaction effect (brightness increase on hover, and active press scale) defined in `index.css` `@layer base`.
