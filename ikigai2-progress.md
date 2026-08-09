# Ikigai2 Progress & Context (IMPORTANT)

This file documents the journey and progress made on the Ikigai2 Round 2 platform architecture. Any future agent (Antigravity or otherwise) working on this repository **MUST** read this file and `ikigai2-plan.md` before making any assumptions about the codebase.

## What has been done so far:

1. **Repository Reset**:
   - The old `ikigai2` implementation was completely wiped from both the local workspace and the remote GitHub repository. We are starting Phase 1 with a completely clean slate.

2. **Database Exploration & Decisions**:
   - Explored the live databases (`ikigai` vs `ikigai2`).
   - Discovered that the Round 2 `ikigai2` database only contains a `teams` collection (which holds Round 2 registrations) and an empty `events` and `tracks` state.
   - **Crucial Decision**: The legacy `ikigai` database will **NOT** be queried. `ikigai2` relies exclusively on the `ikigai2` database.
   - The Admin will recreate Events and Evaluators from scratch in the new `ikigai2` dashboard.
   - The `Participant` and `Shortlisted` collections have been completely dropped from the architecture as they are no longer needed.

3. **Schema Enhancements**:
   - **Mailing Service**: The `AdminMailingService` from ikigai1's recent commits is being ported, but heavily modified to query only the `teams` collection in `ikigai2`.
   - **Assessments**: To solve the "wrong room" evaluation problem, evaluators are now decoupled from strict track assignments. The `TeamLeader` (`teams`) schema now embeds an `assessments` object grouped by role (e.g., `evaluator: []`, `judge: []`) to seamlessly handle multiple assessments for a single team.

4. **Role Clarifications**:
   - `evaluator` replaces the old `sessionChair` role logic.
   - `judge` is included as an empty placeholder model and route to accommodate future feature additions.
   - `studentCoordinator` is included as a placeholder.
   - `teamLeader` manages the `teams` collection.

5. **Codebase Hygiene**:
   - The bloated 800-line `UsersView.jsx` from `ikigai1` is slated to be refactored into smaller modular components.
   - Tailwind's legacy `green-*` colors (which render pink/purple) are being globally renamed to `primary-*`.
   - WebSockets are restricted to `tracks` features for now.

## Next Steps
- Begin Phase 1: Project Scaffolding (`backend/` and `frontend/` initialization).

### Phase 1: Project Scaffolding
- Initialized Vite with Tailwind.
- Initialized Node with dependencies.
- Pushed cleanly to 'migration' branch.

### Phase 2: Backend Foundation
- Created .env template and strict JWT middleware.
- Extracted all Mongoose models (Event, Evaluator, Judge, StudentCoordinator, TeamLeader) mapping to ikigai2.
- Created modular route stubs.
- Reassembled Express server with Socket.io.
- Fixed package.json ES6 module support.

### Phase 3: Frontend Foundation
- Configured Tailwind CSS with custom primary colors (fixed legacy UI bug).
- Created centralized authFetch wrapper.
- Created strict constants for roles and local storage keys.

### Verification (Early Backend Tests)
- Wrote and executed Jest test suites for Auth middleware and TeamLeader assessments schema.
- All 7 tests passed successfully.

### Phase 4: Frontend Admin Console
- Scaffolded AdminLayout with unified sidebar routing.
- Created EventsView, UsersView, ProgressView.
- Broken down Admin monolith into modular components: EventCard, TrackList, EvaluatorList.
- Setup routing structure in App.jsx.

### Phase 5: Frontend Shared Components
- Rebuilt Header component with tailwind and lucide-react.
- Rebuilt reusable ChangePasswordModal.
- Rebuilt reusable ConfirmDeleteModal.
