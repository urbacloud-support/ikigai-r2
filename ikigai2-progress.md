# Ikigai2 — Progress Log

*Project hard-reset on 2026-08-11 to align natively with the ikigai2 database.*

## Completed Tasks

### Phase 1: Clean Slate & Scaffolding
- Deleted legacy `frontend` and `backend` folders to eradicate Round 1 codebase artifacts.
- Generated new scalable `backend/src/` folder skeleton (MVC structure).
- Initialized `package.json` with required dependencies (Express, Mongoose, Socket.io, JWT).
- Pointed `MONGO_URI` directly to the `ikigai2` database on the live cluster.

### Phase 2: Backend Models
- Created `Team.js` natively mapping to the `teams` collection, embedding `assessments`.
- Created `User.js` mapping to `users` collection as the single source of truth for auth.
- Created `Track.js` mapping to the global `tracks` collection.
- Created `Event.js` mapping to `events` collection, embedding selected tracks array for isolation.
- Fixed `.env` to include missing 3rd-party API keys (Brevo, Cloudinary, Gemini).

### Phase 3: Backend Config & Auth Routing
- Created `config/db.js` for MongoDB connection via Mongoose.
- Created `middleware/auth.js` for strict JWT verification and role-based route protection.
- Created `controllers/auth.controller.js` & `routes/auth.routes.js` with unified login.
- Added `utils/hash.js` to perform SHA-256 hashing to correctly verify legacy passwords from the DB.

### Phase 4: Backend Admin & Evaluator Routing
- Created `admin.controller.js` and `admin.routes.js` to fetch Events, Users, and global Tracks.
- Implemented global Track embedding logic during Event creation to prevent ikigai1 cross-contamination bug.
- Created `evaluator.controller.js` and `evaluator.routes.js` with `PATCH` logic to append scores into the `assessments` array on `teams`.
- Configured `server.js` with Socket.io stub (`io.emit('assessment-saved')`) and mounted all routes.

### Phase 5: Frontend Scaffolding
- Initialized a brand new React project using Vite.
- Installed and configured Tailwind CSS v4.
- Ported over the exact pink/purple gradient design system to `index.css` to match legacy aesthetics.
- Created `config/api.js` wrapper to seamlessly inject the `ikigai_token` JWT into all backend requests.
- Created `config/constants.js` to standardize UI labels and criteria.

### Phase 6: Frontend Auth & Routing
- Created `AuthContext.jsx` to manage global user state and authentication logic.
- Rewrote `App.jsx` to implement a secure, role-based Router using `<ProtectedRoute>`.
- Developed a dynamic nested view showcasing assigned Teams, their projects, and M1/M2 mock task completion statuses.

### Phase 10: Evaluator Console (Mobile-First)
- Implemented `EvaluatorConsole.jsx` allowing Judges/Evaluators to score teams across native `ASSESSMENT_CRITERIA`.
- Integrated dynamic range sliders resulting in automated `totalScore` aggregation.
- Implemented a smart mobile UX that switches views automatically when a team is selected for evaluation.

### Phase 7: Frontend Shared UI
- Created `Header.jsx` with a responsive nav bar, dynamic role labels, and a mobile hamburger menu.
- Created `ChangePasswordModal.jsx` utilizing modern backdrop-blur and zoom-in entry animations.

### Phase 8: Admin Events & Users (Mobile-First)
- Created `AdminDashboard.jsx` featuring a desktop sidebar/top-tabs architecture and a native-like mobile bottom tab navigation bar.
- Implemented `EventsView.jsx` leveraging TailwindCSS grid to list event cards dynamically from the database.
- Implemented `UsersView.jsx` incorporating a responsive split design: stacked cards for mobile, structured tables for desktop.

---

## Pending: Assessment Features (assessment-features branch)

*Planning session completed on 2026-08-16. Implementation not yet started.*

### Architecture Decisions Made (via /grill-me)

- **Tracks**: 5 static tracks sourced from R1 "ikigai Hackathon 2026 Round-2" event. Codes `'001'`–`'005'` match the existing `Team.assignedTrack` string values. A `code` field will be added to the `Track` model as the universal join key.
- **Track titles**: `001` SportsTech, `002` NextGenAI, `003` Cyber Security, `004` AgriTech, `005` Sustainability.
- **Default criteria** (from R1 Round-2 event): Innovation & Originality, Technical Complexity, Business & Market Viability, User Experience & Design, Presentation & Q&A — all 10 marks each.
- **Evaluator lock**: `isLocked: Boolean` on the User doc, toggled per-evaluator by admin, pushed via WebSocket instantly to `evaluator:${userId}` room.
- **Evaluator assignment**: `assignedTrackId` (track code string) + `assignedEventId` (ObjectId) on User doc. One evaluator → one track per event.
- **Team-track join**: `Team.assignedTrack` string ('001'-'005') ↔ `Track.code`. No ObjectId join needed.
- **Evaluator console UX**: R1 TrackCard + fullscreen AssessmentModal (Prev/Next). 2 sections: About Team + Assessment (numeric inputs, criteria-only, no direct total mode).
- **Lock UI**: When locked, submit buttons disabled + greyed out. Nav buttons (Close/Prev/Next) stay active. LockBanner shown at top. No emojis — Lucide icons only.
- **Problem Statements page**: Read-only. Teams grouped by `assignedProblemStatement` string. 5 track filter buttons. References R1's AdminProblemStatements pattern.
- **Progress page**: Event picker → 5 track tabs → Evaluator sidebar (Lock/Unlock per evaluator + Lock All) → Team list panel with toggle (selected evaluator's teams OR all track teams). Export: PDF + XLSX + CSV.
- **WebSocket rooms**: `evaluator:${userId}` for lock events, `event:${eventId}` for assessment-saved events.
- **No caching**: Deferred — data volume too small to justify complexity alongside WebSocket invalidation.

### DB State at Time of Planning
- `tracks` collection: 3 docs (no `code` field yet — needs seed script)
- `teams` collection: 55 docs with `assignedTrack` ('001'-'005') and `assignedProblemStatement` ('01-01' format)
- `events` collection: **empty** (admin creates via UI)
- `users` collection: exists, no `isLocked`/`assignedTrackId`/`assignedEventId` yet

### Schema Changes Planned
| Model | Fields to Add |
|---|---|
| `Track` | `code: String` (unique, sparse) |
| `User` | `isLocked: Boolean`, `assignedTrackId: String`, `assignedEventId: ObjectId` |
| `Team` | `teamName`, `assignedTrack`, `assignedProblemStatement`, `trackPreferences` (confirm against live data) |
| `Event` | `criteria: [{ name, maxMarks, inputType }]` (replaces `assessmentCriteria: [String]`), embed `code` in `selectedTracks` |
| `Assessment` (subdoc) | Change `criteriaScores: Map` → `criteria: [Mixed]` ordered array |

### Implementation Phases Planned
1. Track model `code` field + seed script
2. User + Team schema updates
3. Event model updates (criteria schema, embedded track code)
4. Admin backend: full CRUD routes for events, users, evaluator assignment, lock endpoints, teams fetch
5. Evaluator backend: session endpoint, track-scoped teams, lock-aware assessment save
6. Admin EventsView UI (full port from R1 with static 5-track display, evaluator management per track)
7. Admin UsersView CRUD + ProblemStatementsView (new nav item)
8. Evaluator Console UI (TrackCard + AssessmentModal + LockBanner)
9. Admin ProgressView UI + WebSocket room setup on server

### Git Protocol
- All work on branch: `assessment-features`
- Commit and push after **completing each Phase**, not after every task
- Commit message format: `feat(Phase N): <short description>` (e.g. `feat(Phase 1): setup track model and seed`)
- Push to `origin assessment-features` — never to `main`

### Phase 1: Track Model & Seed (assessment-features branch)
- **Modified**: `backend/src/models/Track.js` - Added `code` field (String, unique, sparse) to act as the universal join key linking teams, events, and evaluators, resolving the ObjectId mismatch.
- **Created**: `temp/seed-tracks.js` - Script to seed the 5 track definitions from the Round-2 event (SportsTech, NextGenAI, Cyber Security, AgriTech, Sustainability).
- **Action**: Ran the seed script successfully. The 5 tracks now exist in the R2 `tracks` collection with their respective string codes ('001' to '005').

### Phase 2: User + Team Schema (assessment-features branch)
- **Modified**: `backend/src/models/User.js` - Added evaluator-specific fields (`isLocked`, `assignedTrackId`, `assignedEventId`) to control assessment locking and track allocation.
- **Modified**: `backend/src/models/Team.js` - Added new fields (`teamName`, `assignedTrack`, `assignedProblemStatement`, `trackPreferences`) to natively align with live production DB data. Refactored `assessmentSchema` from a `Map` of criteria scores to an ordered array of `Mixed` type to handle assessment entries properly, and added `mode` enum (`'criteria'`, `'absent'`).

### Phase 3: Event Schema (assessment-features branch)
- **Modified**: `backend/src/models/Event.js` - Updated `embeddedTrackSchema` to include the `code` string and removed `isLocked`. Replaced simple `assessmentCriteria` strings with a detailed `criteriaSchema` (`name`, `maxMarks`, `inputType`).

### Phase 4: Admin Backend Routes (assessment-features branch)
- **Modified**: `backend/src/controllers/admin.controller.js` - Added full CRUD operations for Events and Users. Added endpoints to define criteria, assign evaluators to tracks, toggle locks, and lock all evaluators via WebSockets.
- **Modified**: `backend/src/routes/admin.routes.js` - Wired up all new controller endpoints.

### Phase 5: Evaluator Backend Routes (assessment-features branch)
- **Modified**: `backend/src/controllers/evaluator.controller.js` - Rebuilt to support `getSessionData` (loads user + event criteria), `getAssignedTeams` (fetches teams based on evaluator's assigned track code), `submitAssessment`, and `markAbsent`. All assessment routes now explicitly check for `user.isLocked` before proceeding.
- **Modified**: `backend/src/routes/evaluator.routes.js` - Wired up new endpoints with the correct `requireAuth('evaluator', 'judge')` middleware.

### Phase 6: Frontend Admin Events (assessment-features branch)
- **Created**: `CreateEventForm.jsx`, `ConfirmDeleteModal.jsx`, `EditEventModal.jsx`, `DefineCriteriaModal.jsx`, `EvaluatorList.jsx` in `pages/admin/components/`. These components break down the monolithic R1 logic into manageable, reusable pieces.
- **Modified**: `pages/admin/EventsView.jsx` - Rebuilt from scratch to implement the new componentized architecture. Allows creating events with static 5-track toggles, defining criteria (event-scoped), and adding/assigning evaluators inline per track.

### Phase 7: Frontend Admin Users & Problem Statements (assessment-features branch)
- **Created**: `CreateUserModal.jsx` to generate users with auto-passwords.
- **Modified**: `UsersView.jsx` - Rebuilt to include creation/deletion capabilities using the new components.
- **Created**: `ProblemStatementsView.jsx` - New page that fetches all teams and groups them visually by `assignedTrack` and `assignedProblemStatement`.
- **Modified**: `AdminLayout.jsx` & `App.jsx` - Added routing and sidebar navigation for the new Problem Statements page.

### Phase 8: Frontend Evaluator Console (assessment-features branch)
- **Created Components**: `LockBanner.jsx`, `TrackCard.jsx`, `AssessmentModal.jsx`. 
- **Modified**: `EvaluatorConsole.jsx` - Completely rebuilt. Uses dynamic schema for criteria scoring (instead of hardcoded), supports "Absent" mode natively, handles WebSocket real-time lock updates, and presents teams in a grid of track cards rather than a 2-pane list view. All inputs are completely disabled and greyed out when `user.isLocked` is true.

### Phase 9: Frontend Admin Progress & WebSockets (assessment-features branch)
- **Modified**: `backend/src/server.js` - Added `join-evaluator` socket room to allow individual lock toggling via WebSockets.
- **Created Components**: `EvaluatorSidebar.jsx`, `ProgressStats.jsx`, `TeamGrid.jsx` in `pages/admin/components/`.
- **Modified**: `pages/admin/ProgressView.jsx` - Rebuilt to fetch live teams based on selected track code. Displays an evaluator sidebar allowing admins to individually lock/unlock evaluators, and a global lock/unlock all button. Team Grid shows precise score amounts and 'Absent' badges in real-time by listening to the `assessment-saved` socket event. Export CSV natively supported based on fetched data.

### Post-Phase Adjustments & Bug Fixes (assessment-features branch)
- **Evaluator Passwords**: Updated `createUser` logic in `admin.controller.js` to deterministically generate passwords based on the user's first name (e.g. "Mr. John Doe" -> `john123`).
- **Evaluator Assignment**: Enhanced `EvaluatorList.jsx` to allow assigning existing evaluator users to a track via a dropdown, rather than only allowing the creation of new evaluators.
- **Evaluator Console UI**: 
  - Added `AssessmentSummary.jsx` component and a fixed, floating "View Summary" button in `EvaluatorConsole.jsx` so evaluators can easily review all teams they've scored.
  - Fixed a React child rendering error in `AssessmentSummary` by ensuring criteria objects are parsed down to primitive score values, appropriately formatting booleans as Yes/No.
- **Dummy Data**: Created `temp/seed_dummy_teams.js` to seed 15 dummy teams (3 per track) with distinct `[DUMMY]` naming for testing the Progress and Evaluator Console views.
